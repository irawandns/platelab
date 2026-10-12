import {
  Suspense,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  Component,
  type ReactNode,
} from "react";
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Group, Plane, Raycaster, Vector2, Vector3, DoubleSide } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, View } from "lucide-react";
import { FoodPortion } from "./FoodPortion";
import { PlateModel } from "./PlateModel";
import { PhysicsFood } from "./PhysicsFood";
import { FoodPhysics, initializePhysics } from "../lib/physics";
import {
  footprintRadius,
  plateRadius,
  MAX_PLATE_CM,
  PLATE_SURFACE_Y,
  foodSupportHeight,
  physicsFoods,
} from "../lib/scale";
import { foodById } from "../lib/nutrition";
import { registerPoseReader, usePlate } from "../lib/store";
import type { PlateItem } from "../types";
import { plateSkins } from "../lib/plate-skins";
function Item({
  item,
  setDragging,
  reduced,
}: {
  item: PlateItem;
  setDragging: (value: boolean) => void;
  reduced: boolean;
}) {
  const selected = usePlate((s) => s.selectedItemId === item.instanceId);
  const diameterCm = usePlate((s) => s.plateDiameterCm);
  const group = useRef<Group>(null);
  const pressed = useRef(false);
  const remembered = useRef(false);
  const point = useMemo(() => new Vector3(), []);
  const offset = useRef<[number, number]>([0, 0]);
  const { invalidate } = useThree();
  const food = foodById[item.foodId];
  const ratio = item.portionGrams / food.defaultPortionGrams;
  const targetScale = 1;
  const footprint = footprintRadius(item.foodId, ratio);
  const supportY = foodSupportHeight(
    diameterCm,
    item,
    food.defaultPortionGrams,
  );
  const dragSurface = useMemo(
    () => new Plane(new Vector3(0, 1, 0), -supportY),
    [supportY],
  );
  const animated = useRef(reduced ? targetScale : 0.03);
  useFrame((_, delta) => {
    if (!group.current) return;
    animated.current = reduced
      ? targetScale
      : animated.current +
        (targetScale - animated.current) * Math.min(1, delta * 16);
    group.current.scale.setScalar(animated.current);
    if (Math.abs(animated.current - targetScale) > 0.001) invalidate();
  });
  useEffect(() => {
    invalidate();
  }, [targetScale, invalidate]);
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    usePlate.getState().select(item.instanceId);
    remembered.current = false;
    if (e.ray.intersectPlane(dragSurface, point))
      offset.current = [item.position[0] - point.x, item.position[1] - point.z];
    pressed.current = true;
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!pressed.current) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(dragSurface, point)) {
      const next: [number, number] = [
        point.x + offset.current[0],
        point.z + offset.current[1],
      ];
      if (
        Math.hypot(next[0] - item.position[0], next[1] - item.position[1]) <
        0.01
      )
        return;
      if (!remembered.current) {
        usePlate.getState().beginMove();
        remembered.current = true;
      }
      usePlate.getState().move(item.instanceId, next, false);
    }
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!pressed.current) return;
    e.stopPropagation();
    pressed.current = false;
    setDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
  };
  return (
    <group
      position={[item.position[0], supportY, item.position[1]]}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[footprint, footprint + 0.025, 40]} />
          <meshBasicMaterial color="#b16c41" side={DoubleSide} />
        </mesh>
      )}
      <group ref={group}>
        <FoodPortion id={item.foodId} ratio={ratio} />
      </group>
    </group>
  );
}
function World({
  cameraAction,
  reduced,
  libraryDrag,
}: {
  cameraAction: { action: string; nonce: number };
  reduced: boolean;
  libraryDrag: boolean;
}) {
  const items = usePlate((s) => s.items);
  const sceneRevision = usePlate((s) => s.sceneRevision);
  const diameterCm = usePlate((s) => s.plateDiameterCm);
  const skin = usePlate((s) => s.plateSkin);
  const radius = plateRadius(diameterCm);
  const controls = useRef<OrbitControlsImpl>(null);
  const [dragging, setDragging] = useState(false);
  const setFoodDragging = useCallback((value: boolean) => {
    // Lock orbit controls during the pointer event, before React commits the
    // next render. Otherwise the first food-drag movement can orbit the camera.
    if (controls.current) controls.current.enabled = !value;
    setDragging(value);
  }, []);
  const runtime = useRef<FoodPhysics | null>(null);
  const idleCommitted = useRef(false);
  const plate = useRef<Group>(null);
  const [physicsReady, setPhysicsReady] = useState(false);
  const [physicsError, setPhysicsError] = useState<Error | null>(null);
  const { camera, gl, invalidate, size } = useThree();
  useEffect(() => {
    let active = true;
    initializePhysics()
      .then(() => {
        if (active) setPhysicsReady(true);
      })
      .catch((error) => {
        if (active) setPhysicsError(error);
      });
    return () => {
      active = false;
    };
  }, []);
  useLayoutEffect(() => {
    if (!physicsReady) return;
    const state = usePlate.getState();
    const simulation = new FoodPhysics(
      state.plateDiameterCm,
      state.items,
      state.restorePhysics,
    );
    runtime.current = simulation;
    gl.domElement.dataset.physics = "settling";
    idleCommitted.current = false;
    const unregister = registerPoseReader(() => simulation.poses());
    invalidate();
    return () => {
      unregister();
      runtime.current = null;
      simulation.dispose();
    };
  }, [physicsReady, sceneRevision, gl, invalidate]);
  useFrame((_, delta) => {
    if (!runtime.current) return;
    const active = runtime.current.hasActivity();
    if (active) {
      runtime.current.step(delta);
      idleCommitted.current = false;
      invalidate();
    }
    gl.domElement.dataset.physics = active ? "settling" : "settled";
    // Identify the simulation processed by this frame. A previous simulation's
    // settled marker can remain visible while an undo is being committed.
    gl.domElement.dataset.physicsRevision = String(sceneRevision);
    if (!active && !idleCommitted.current) {
      idleCommitted.current = true;
      usePlate.getState().commitPoses(runtime.current.poses());
    }
  });
  // Keep the same camera for every diameter so a bigger plate actually looks bigger.
  // Fit the largest supported plate even in a narrow mobile viewport.
  const fitDistance = Math.max(
    10,
    (plateRadius(MAX_PLATE_CM) * 2 + 0.8) /
      (2 * Math.tan((39 * Math.PI) / 360) * (size.width / size.height)),
  );
  useEffect(() => {
    camera.position.set(0, fitDistance * 0.676, fitDistance * 0.737);
    camera.lookAt(0, 0, 0);
    controls.current?.update();
    invalidate();
  }, [camera, fitDistance, invalidate]);
  const ready = useRef(false);
  useFrame(() => {
    if (!ready.current) {
      gl.domElement.dataset.ready = "true";
      ready.current = true;
    }
  });
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    const action = cameraAction.action;
    if (action === "reset") {
      camera.position.set(0, fitDistance * 0.676, fitDistance * 0.737);
      c.target.set(0, 0, 0);
    }
    if (action === "left" || action === "right") {
      const angle = action === "left" ? -0.3 : 0.3;
      camera.position.applyAxisAngle(new Vector3(0, 1, 0), angle);
    }
    if (action === "in" || action === "out") {
      const desired =
        camera.position.length() * (action === "in" ? 0.85 : 1.15);
      camera.position.setLength(Math.max(6.5, Math.min(24, desired)));
    }
    c.update();
    invalidate();
  }, [cameraAction, camera, fitDistance, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const drop = (e: DragEvent) => {
      e.preventDefault();
      const id = e.dataTransfer?.getData("application/platelab-food");
      if (!id || !foodById[id]) return;
      const rect = canvas.getBoundingClientRect();
      const ray = new Raycaster();
      ray.setFromCamera(
        new Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          (-(e.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      // Hit the curved ceramic itself, not an invisible flat plane below it.
      const hit =
        plate.current &&
        ray
          .intersectObject(plate.current, true)
          .find((hit) => hit.object.name === "plate-ceramic");
      const point = hit?.point;
      if (point && Math.hypot(point.x, point.z) <= radius)
        usePlate.getState().add(id, [point.x, point.z]);
    };
    const allow = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    canvas.addEventListener("drop", drop);
    canvas.addEventListener("dragover", allow);
    return () => {
      canvas.removeEventListener("drop", drop);
      canvas.removeEventListener("dragover", allow);
    };
  }, [gl, camera, radius]);
  if (physicsError) throw physicsError;
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-3, 7, 5]} intensity={2.4} />
      <directionalLight position={[4, 3, -2]} intensity={0.6} color="#ffe4ba" />
      <group ref={plate}>
        <PlateModel diameterCm={diameterCm} skin={skin} />
      </group>
      {(dragging || libraryDrag) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.608, 0]}>
          <ringGeometry args={[radius - 0.04, radius, 64]} />
          <meshBasicMaterial color="#829568" transparent opacity={0.7} />
        </mesh>
      )}
      {items.map((item) =>
        physicsReady && physicsFoods.has(item.foodId) ? (
          <PhysicsFood
            key={item.instanceId}
            item={item}
            runtime={runtime}
            setDragging={setFoodDragging}
          />
        ) : (
          <Item
            key={item.instanceId}
            item={item}
            setDragging={setFoodDragging}
            reduced={reduced}
          />
        ),
      )}
      <OrbitControls
        ref={controls}
        enabled={!dragging}
        enablePan={false}
        enableDamping={!reduced}
        minDistance={6.5}
        maxDistance={24}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.5}
        makeDefault
      />
    </>
  );
}
function Fallback() {
  const diameterCm = usePlate((s) => s.plateDiameterCm);
  const skin = usePlate((s) => s.plateSkin);
  const palette = plateSkins[skin];
  return (
    <div className="scene-fallback">
      <div
        className="fallback-plate"
        style={{
          width: (200 * diameterCm) / 26,
          height: (95 * diameterCm) / 26,
          backgroundColor: palette.base,
          borderColor: palette.rim,
        }}
      />
      <p>3D isn’t available in this browser.</p>
      <span>
        You can still build your plate using the food library and controls
        below.
      </span>
    </div>
  );
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
export default function PlateScene() {
  const diameterCm = usePlate((s) => s.plateDiameterCm);
  const skin = usePlate((s) => s.plateSkin);
  const [cameraAction, setCameraAction] = useState({ action: "", nonce: 0 });
  const [reduced, setReduced] = useState(false);
  const [over, setOver] = useState(false);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    update();
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return (
    <div
      className={`scene-shell ${over ? "drag-over" : ""}`}
      onDragEnter={() => setOver(true)}
      onDragLeave={() => setOver(false)}
      onDrop={() => setOver(false)}
    >
      <div
        className="canvas-wrap"
        role="img"
        aria-label={`Interactive 3D plate, ${diameterCm} centimetres in diameter, ${plateSkins[skin].name} skin. Use the food list and portion controls below as a keyboard alternative.`}
      >
        <SceneBoundary>
          <Suspense
            fallback={<div className="scene-loading">Setting the table…</div>}
          >
            <Canvas
              frameloop="demand"
              dpr={[1, 1.75]}
              camera={{ position: [0, 5.6, 6.1], fov: 39 }}
              gl={{ antialias: true, alpha: true }}
              fallback={<Fallback />}
              onPointerMissed={() => usePlate.getState().select(null)}
            >
              <World
                cameraAction={cameraAction}
                reduced={reduced}
                libraryDrag={over}
              />
            </Canvas>
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="camera-controls" aria-label="Camera controls">
        {[
          ["left", "Rotate plate left", RotateCcw],
          ["right", "Rotate plate right", RotateCw],
          ["in", "Zoom in", ZoomIn],
          ["out", "Zoom out", ZoomOut],
          ["reset", "Reset camera", View],
        ].map(([action, label, Icon]) => {
          const I = Icon as typeof View;
          return (
            <button
              key={String(action)}
              aria-label={String(label)}
              title={String(label)}
              onClick={() =>
                setCameraAction((v) => ({
                  action: String(action),
                  nonce: v.nonce + 1,
                }))
              }
            >
              <I size={17} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
