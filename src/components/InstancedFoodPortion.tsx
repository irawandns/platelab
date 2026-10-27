import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import {
  foodRenderResource,
  retainFoodRenderResource,
  type FoodRenderBatch,
} from "../lib/food-render-resources";
import { portionPieces, type VisualPiece } from "../lib/scale";

function PartInstances({
  batch,
  pieces,
}: {
  batch: FoodRenderBatch;
  pieces: VisualPiece[];
}) {
  const mesh = useRef<InstancedMesh>(null);
  const { invalidate } = useThree();
  const { geometry, material } = batch;
  useLayoutEffect(() => {
    const current = mesh.current;
    // Shared geometry/materials have their own lifetime; the instance buffer
    // belongs to this serving and must still be released on resize/removal.
    return () => {
      current?.dispose();
    };
  }, [pieces.length, geometry, material]);
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
  const resource = useMemo(() => foodRenderResource(id), [id]);
  useLayoutEffect(() => retainFoodRenderResource(resource), [resource]);
  return resource.batches.map((batch, index) => (
    <PartInstances key={index} batch={batch} pieces={pieces} />
  ));
}
