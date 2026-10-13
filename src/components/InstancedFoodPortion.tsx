import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import {
  Euler,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from "three";
import {
  foodPartGeometry,
  foodPartTransforms,
  physicsFoodParts,
  type FoodPart,
} from "../lib/food-shapes";
import { portionPieces, type VisualPiece } from "../lib/scale";

function PartInstances({
  part,
  transform,
  pieces,
}: {
  part: FoodPart;
  transform: Matrix4;
  pieces: VisualPiece[];
}) {
  const mesh = useRef<InstancedMesh>(null);
  const { invalidate } = useThree();
  // Bake calibration into each shared geometry. Instance matrices then contain
  // only uniform portion scale and rotation, keeping normals and ray bounds
  // correct without sheared instance transforms.
  const geometry = useMemo(
    () => foodPartGeometry(part).applyMatrix4(transform),
    [part, transform],
  );
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: part.color,
        flatShading: part.kind !== "torus" && part.kind !== "circle",
        roughness: part.kind === "facet" ? 0.95 : 0.9,
      }),
    [part],
  );
  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useLayoutEffect(() => {
    if (!mesh.current) return;
    pieces.forEach((piece, index) => {
      const matrix = new Matrix4().compose(
        new Vector3(...piece.position),
        new Quaternion().setFromEuler(new Euler(0, piece.rotationY ?? 0, 0)),
        new Vector3().setScalar(piece.scale),
      );
      mesh.current!.setMatrixAt(index, matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
    invalidate();
  }, [pieces, geometry, invalidate]);
  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, pieces.length]}
      castShadow
      receiveShadow
      dispose={null}
    />
  );
}

export function InstancedFoodPortion({
  id,
  ratio,
}: {
  id: string;
  ratio: number;
}) {
  const pieces = useMemo(() => portionPieces(id, ratio), [id, ratio]);
  const transforms = useMemo(() => foodPartTransforms(id), [id]);
  return physicsFoodParts[id].map((part, index) => (
    <PartInstances
      key={index}
      part={part}
      transform={transforms[index]}
      pieces={pieces}
    />
  ));
}
