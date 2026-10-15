import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { DoubleSide, Group, Plane, Vector3 } from "three";
import { FoodPortion } from "./FoodPortion";
import { FoodPhysics } from "../lib/physics";
import { usePlate } from "../lib/store";
import { foodById } from "../lib/nutrition";
import { footprintRadius, foodModelId } from "../lib/scale";
import type { PlateItem } from "../types";

export function PhysicsFood({
  item,
  runtime,
  setDragging,
}: {
  item: PlateItem;
  runtime: RefObject<FoodPhysics | null>;
  setDragging: (dragging: boolean) => void;
}) {
  const selected = usePlate((s) => s.selectedItemId === item.instanceId);
  const sceneRevision = usePlate((s) => s.sceneRevision);
  const capture = useRef<{ target: Element; pointerId: number } | null>(null);
  const root = useRef<Group>(null);
  const pressed = useRef(false),
    moving = useRef(false);
  const plane = useRef(new Plane(new Vector3(0, 1, 0), -0.18));
  const offset = useRef<[number, number]>([0, 0]);
  const initial = useRef<[number, number]>([0, 0]);
  const point = useMemo(() => new Vector3(), []);
  const { invalidate } = useThree();
  const ratio = item.portionGrams / foodById[item.foodId].defaultPortionGrams;
  const modelId = foodModelId(item);
  const footprint = footprintRadius(modelId, ratio);
  useEffect(
    () => () => {
      // Clear/undo/portion edits can interrupt a drag before pointer-up arrives.
      if (capture.current) {
        capture.current.target.releasePointerCapture(capture.current.pointerId);
        capture.current = null;
      }
      if (pressed.current) setDragging(false);
      pressed.current = false;
      moving.current = false;
    },
    [sceneRevision, setDragging],
  );
  useFrame(() => {
    const pose = runtime.current?.pose(item.instanceId);
    if (!pose || !root.current) return;
    root.current.position.fromArray(pose.position);
    root.current.quaternion.fromArray(pose.rotation);
  });
  const down = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0 || !runtime.current) return;
    e.stopPropagation();
    const pose = runtime.current.pose(item.instanceId)!;
    plane.current.constant = -pose.position[1];
    if (!e.ray.intersectPlane(plane.current, point)) return;
    offset.current = [pose.position[0] - point.x, pose.position[2] - point.z];
    initial.current = [pose.position[0], pose.position[2]];
    pressed.current = true;
    moving.current = false;
    usePlate.getState().select(item.instanceId);
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    capture.current = { target: e.target as Element, pointerId: e.pointerId };
  };
  const move = (e: ThreeEvent<PointerEvent>) => {
    if (!pressed.current || !runtime.current) return;
    e.stopPropagation();
    if (!e.ray.intersectPlane(plane.current, point)) return;
    const x = point.x + offset.current[0],
      z = point.z + offset.current[1];
    if (!moving.current) {
      if (Math.hypot(x - initial.current[0], z - initial.current[1]) < 0.02)
        return;
      usePlate.getState().beginMove();
      runtime.current.beginDrag(item.instanceId);
      moving.current = true;
    }
    runtime.current.dragTo(item.instanceId, x, z);
    invalidate();
  };
  const up = (e: ThreeEvent<PointerEvent>) => {
    if (!pressed.current) return;
    e.stopPropagation();
    if (moving.current) {
      runtime.current?.endDrag();
      if (runtime.current)
        usePlate.getState().commitPoses(runtime.current.poses());
      invalidate();
    }
    pressed.current = false;
    moving.current = false;
    setDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    capture.current = null;
  };
  return (
    <group
      ref={root}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <FoodPortion key={modelId} id={modelId} ratio={ratio} />
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[footprint, footprint + 0.025, 40]} />
          <meshBasicMaterial
            color="#b16c41"
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
