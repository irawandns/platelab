import {
  Component,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Box3, Group, Mesh, PerspectiveCamera, Vector2, Vector3 } from "three";
import { FoodPortion } from "./FoodPortion";
import { PlateModel } from "./PlateModel";
import { MealTrayModel } from "./MealTrayModel";
import { foodById } from "../lib/nutrition";
import { foodModelId, foodSupportHeight } from "../lib/scale";
import { traySupportHeight } from "../lib/meal-tray";
import {
  framePhoto,
  PHOTO_SIZE,
  photoLooks,
  type PhotoAngle,
  type PhotoCamera,
  type PhotoLook,
} from "../lib/photo";
import type { Snapshot } from "../lib/store";
export interface PhotoExporter {
  download: () => Promise<Blob>;
}
interface Props {
  plate: Snapshot;
  look: PhotoLook;
  angle: PhotoAngle;
  currentCamera: PhotoCamera | null;
  exporter: RefObject<PhotoExporter | null>;
  onReady: (ready: boolean) => void;
  onFailure: () => void;
}
function PhotoWorld({
  plate,
  look,
  angle,
  currentCamera,
  exporter,
  onReady,
}: Props) {
  const subject = useRef<Group>(null);
  const { camera, gl, scene, invalidate } = useThree();
  const frames = useRef(0);
  const palette = photoLooks[look];
  useLayoutEffect(() => {
    if (!subject.current) return;
    subject.current.traverse((object) => {
      if ((object as Mesh).isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    const bounds = new Box3().setFromObject(subject.current, true);
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    const view = framePhoto(
      center.toArray(),
      size.toArray(),
      angle,
      currentCamera,
    );
    const lens = camera as PerspectiveCamera;
    lens.position.fromArray(view.position);
    lens.fov = view.fov;
    lens.lookAt(...view.target);
    lens.updateProjectionMatrix();
    lens.updateMatrixWorld();
    gl.shadowMap.needsUpdate = true;
    invalidate();
  }, [plate, angle, currentCamera, camera, gl, invalidate]);
  useEffect(() => {
    frames.current = 0;
    gl.domElement.dataset.photoReady = "false";
    onReady(false);
    invalidate();
    return () => {
      exporter.current = null;
    };
  }, [look, angle, gl, invalidate, onReady, exporter]);
  useFrame(() => {
    if (frames.current >= 3) return;
    frames.current++;
    if (frames.current < 3) {
      invalidate();
      return;
    }
    gl.domElement.dataset.photoReady = "true";
    exporter.current = {
      download: async () => {
        const size = gl.getSize(new Vector2());
        const pixelRatio = gl.getPixelRatio();
        const lens = camera as PerspectiveCamera;
        const aspect = lens.aspect;
        try {
          gl.setPixelRatio(1);
          gl.setSize(PHOTO_SIZE, PHOTO_SIZE, false);
          lens.aspect = 1;
          lens.updateProjectionMatrix();
          gl.render(scene, camera);
          return await new Promise<Blob>((resolve, reject) => {
            gl.domElement.toBlob(
              (blob) =>
                blob
                  ? resolve(blob)
                  : reject(new Error("The photo couldn’t be created.")),
              "image/png",
            );
          });
        } finally {
          gl.setPixelRatio(pixelRatio);
          gl.setSize(size.x, size.y, false);
          lens.aspect = aspect;
          lens.updateProjectionMatrix();
          invalidate();
        }
      },
    };
    onReady(true);
  });
  return (
    <>
      <color attach="background" args={[palette.background]} />
      <ambientLight intensity={palette.ambient} />
      <directionalLight
        position={[-4, 8, 4]}
        intensity={palette.intensity}
        color={palette.key}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.1}
        shadow-camera-far={35}
        shadow-bias={-0.0001}
        shadow-normalBias={0.015}
        shadow-radius={3}
        shadow-blurSamples={8}
      />
      <directionalLight
        position={[4, 4, -4]}
        intensity={palette.rim}
        color={palette.fill}
      />
      <Environment resolution={128}>
        <Lightformer
          position={[-4, 6, 2]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[5, 6, 1]}
          intensity={2}
          color={palette.key}
        />
        <Lightformer
          position={[4, 4, -3]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[3, 6, 1]}
          intensity={1.5}
          color={palette.fill}
        />
      </Environment>
      <group ref={subject}>
        {plate.plateType === "meal-tray" ? (
          <MealTrayModel />
        ) : (
          <PlateModel
            diameterCm={plate.plateDiameterCm}
            skin={plate.plateSkin}
            showShadow={false}
          />
        )}
        {plate.items.map((item) => {
          const grams = foodById[item.foodId].defaultPortionGrams;
          const y =
            plate.plateType === "meal-tray"
              ? traySupportHeight(item, grams)
              : foodSupportHeight(plate.plateDiameterCm, item, grams);
          return (
            <group
              key={item.instanceId}
              position={
                item.pose?.position ?? [item.position[0], y, item.position[1]]
              }
              quaternion={item.pose?.rotation}
            >
              <FoodPortion
                id={foodModelId(item)}
                ratio={item.portionGrams / grams}
              />
            </group>
          );
        })}
      </group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.12, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={palette.background} roughness={1} />
      </mesh>
      <ContactShadows
        key={look + angle}
        position={[0, -0.115, 0]}
        opacity={palette.shadow}
        scale={24}
        blur={2.4}
        far={8}
        resolution={512}
        frames={1}
        color="#332b24"
      />
    </>
  );
}
function Unavailable({ onFailure }: Pick<Props, "onFailure">) {
  useEffect(onFailure, [onFailure]);
  return (
    <div className="photo-unavailable">
      <strong>Photo mode needs 3D.</strong>
      <p>Your plate is still here. Try a browser with WebGL enabled.</p>
    </div>
  );
}
class PhotoBoundary extends Component<
  { children: ReactNode; onFailure: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <Unavailable onFailure={this.props.onFailure} />
    ) : (
      this.props.children
    );
  }
}
export default function PhotoScene(props: Props) {
  return (
    <PhotoBoundary onFailure={props.onFailure}>
      <Canvas
        shadows="variance"
        frameloop="demand"
        dpr={[1, 1.5]}
        camera={{ position: [0, 8, 10], fov: 35, near: 0.1, far: 500 }}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        fallback={<p>Photo mode needs 3D.</p>}
      >
        <PhotoWorld {...props} />
      </Canvas>
    </PhotoBoundary>
  );
}
