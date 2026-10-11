import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, Group, Vector3 } from "three";
import { FoodModel } from "./FoodModel";
import { CM_PER_UNIT, foodDimensionsCm, portionPieces } from "../lib/scale";

function CalibratedModel({ id }: { id: string }) {
  const root = useRef<Group>(null);
  const model = useRef<Group>(null);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    if (!root.current || !model.current) return;
    // Measure in model coordinates, independent of camera, plate or parent scale.
    const bounds = new Box3();
    const point = new Vector3();
    model.current.updateMatrixWorld(true);
    const inverse = model.current.matrixWorld.clone().invert();
    model.current.traverse((object) => {
      if ("geometry" in object) {
        const mesh = object as import("three").Mesh;
        const transform = inverse.clone().multiply(mesh.matrixWorld);
        const vertices = mesh.geometry.getAttribute("position");
        // Measure actual vertices, matching collision calibration even when
        // a floret or an irregular solid is rotated inside the portion.
        for (let i = 0; i < vertices.count; i++)
          bounds.expandByPoint(
            point.fromBufferAttribute(vertices, i).applyMatrix4(transform),
          );
      }
    });
    const size = bounds.getSize(new Vector3());
    const center = bounds.getCenter(new Vector3());
    const dimensions = foodDimensionsCm[id];
    const scale = new Vector3(...dimensions)
      .divideScalar(CM_PER_UNIT)
      .divide(size);
    root.current.scale.copy(scale);
    model.current.position.set(-center.x, -bounds.min.y, -center.z);
    invalidate();
  }, [id, invalidate]);
  return (
    <group ref={root}>
      <group ref={model}>
        <FoodModel id={id} />
      </group>
    </group>
  );
}

export function FoodPortion({ id, ratio }: { id: string; ratio: number }) {
  return portionPieces(id, ratio).map((piece, index) => (
    <group key={index} position={piece.position} scale={piece.scale}>
      <CalibratedModel id={id} />
    </group>
  ));
}
