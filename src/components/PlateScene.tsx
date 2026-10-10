import {
  Suspense,
  useEffect,
  useMemo,
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
import { FoodModel } from "./FoodModel";
import { foodById } from "../lib/nutrition";
import { usePlate } from "../lib/store";
import type { PlateItem } from "../types";
const surface = new Plane(new Vector3(0, 1, 0), -0.18);
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
  const group = useRef<Group>(null);
  const pressed = useRef(false);
  const remembered = useRef(false);
  const point = useMemo(() => new Vector3(), []);
  const offset = useRef<[number, number]>([0, 0]);
  const { invalidate } = useThree();
  const food = foodById[item.foodId];
  const ratio = item.portionGrams / food.defaultPortionGrams;
  const targetScale = Math.cbrt(ratio) * 0.85;
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
    if (e.ray.intersectPlane(surface, point))
      offset.current = [item.position[0] - point.x, item.position[1] - point.z];
    pressed.current = true;
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!pressed.current) return;
    e.stopPropagation();
    if (e.ray.intersectPlane(surface, point)) {
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
      position={[item.position[0], 0.18, item.position[1]]}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <ringGeometry args={[0.53, 0.55, 40]} />
          <meshBasicMaterial color="#b16c41" side={DoubleSide} />
        </mesh>
      )}
      <group ref={group}>
        <FoodModel id={item.foodId} />
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
  const controls = useRef<OrbitControlsImpl>(null);
  const [dragging, setDragging] = useState(false);
  const { camera, gl, invalidate } = useThree();
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
      camera.position.set(0, 5.6, 6.1);
      c.target.set(0, 0, 0);
    }
    if (action === "left" || action === "right") {
      const angle = action === "left" ? -0.3 : 0.3;
      camera.position.applyAxisAngle(new Vector3(0, 1, 0), angle);
    }
    if (action === "in" || action === "out") {
      const desired =
        camera.position.length() * (action === "in" ? 0.85 : 1.15);
      camera.position.setLength(Math.max(6.5, Math.min(12, desired)));
    }
    c.update();
    invalidate();
  }, [cameraAction, camera, invalidate]);
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
      const point = ray.ray.intersectPlane(surface, new Vector3());
      if (point && Math.hypot(point.x, point.z) <= 2.65)
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
  }, [gl, camera]);
  return (
    <>
      <ambientLight intensity={1.7} />
      <directionalLight position={[-3, 7, 5]} intensity={2.4} />
      <directionalLight position={[4, 3, -2]} intensity={0.6} color="#ffe4ba" />
      <mesh position={[0, -0.035, 0]}>
        <cylinderGeometry args={[2.74, 2.63, 0.14, 80]} />
        <meshStandardMaterial color="#d5d9c4" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[2.68, 2.7, 0.12, 80]} />
        <meshStandardMaterial color="#faf9ed" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.115, 0]}>
        <torusGeometry args={[2.43, 0.24, 10, 80]} />
        <meshStandardMaterial color="#f3f3e5" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[2.24, 2.24, 0.07, 80]} />
        <meshStandardMaterial color="#f8f8eb" roughness={0.9} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
        scale={[1, 1, 1]}
      >
        <circleGeometry args={[2.82, 64]} />
        <meshBasicMaterial color="#555b38" transparent opacity={0.06} />
      </mesh>
      {(dragging || libraryDrag) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.175, 0]}>
          <ringGeometry args={[2.15, 2.19, 64]} />
          <meshBasicMaterial color="#829568" transparent opacity={0.7} />
        </mesh>
      )}
      {items.map((item) => (
        <Item
          key={item.instanceId}
          item={item}
          setDragging={setDragging}
          reduced={reduced}
        />
      ))}
      <OrbitControls
        ref={controls}
        enabled={!dragging}
        enablePan={false}
        enableDamping={!reduced}
        minDistance={6.5}
        maxDistance={12}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.5}
        makeDefault
      />
    </>
  );
}
function Fallback() {
  return (
    <div className="scene-fallback">
      <div className="fallback-plate" />
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
        aria-label="Interactive 3D plate. Use the food list and portion controls below as a keyboard alternative."
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
