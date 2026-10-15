import { useEffect, useMemo } from "react";
import {
  foodPartGeometry,
  physicsFoodParts,
  physicsFoodRotation,
  type FoodPart,
} from "../lib/food-shapes";

function Part({ part }: { part: FoodPart }) {
  const geometry = useMemo(() => foodPartGeometry(part), [part]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const mesh = (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      position={part.position}
      rotation={part.rotation}
      scale={part.scale}
    >
      <meshStandardMaterial
        color={part.color}
        vertexColors={!!part.colors}
        flatShading={part.kind !== "torus" && part.kind !== "circle"}
        roughness={part.kind === "facet" ? 0.95 : 0.9}
      />
    </mesh>
  );
  return part.parent ? (
    <group position={part.parent.position} rotation={part.parent.rotation}>
      {mesh}
    </group>
  ) : (
    mesh
  );
}

export function FoodModel({ id }: { id: string }) {
  return (
    <group rotation={physicsFoodRotation(id)}>
      {physicsFoodParts[id]?.map((part, index) => (
        <Part key={index} part={part} />
      ))}
    </group>
  );
}
