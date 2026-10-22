import { useEffect, useMemo } from "react";
import { LatheGeometry, Vector2 } from "three";
import { plateRadius, plateTopProfile } from "../lib/scale";
import { plateSkins, type PlateSkin } from "../lib/plate-skins";

function ceramicGeometry(radius: number) {
  // Underside with a small foot ring, outer lip, then the glazed top back to
  // the centre. A single revolved shell avoids overlapping cylinders/tori.
  const underside: [number, number][] = [
    [0, 0.1],
    [0.4, 0.1],
    [0.4, -0.06],
    [0.42, -0.1],
    [0.5, -0.1],
    [0.52, -0.06],
    [0.52, 0.08],
    [0.7, 0.08],
    [0.75, 0.1],
    [0.82, 0.22],
    [0.9, 0.41],
    [0.97, 0.5],
    [0.993, 0.54],
    [1, 0.57],
  ];
  const profile = [...underside, ...plateTopProfile.slice().reverse()];
  const segments = 128;
  const geometry = new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r * radius, y)),
    segments,
  );
  // Reorder indices by glaze colour for just three draw calls. Bands are part
  // of the surface itself, so they cannot float above it or cause z-fighting.
  const indices = geometry.index!;
  const groups: number[][] = [[], [], []];
  for (let angle = 0; angle < segments; angle++) {
    for (let edge = 0; edge < profile.length - 1; edge++) {
      const r = (profile[edge][0] + profile[edge + 1][0]) / 2;
      const top = edge >= underside.length - 1;
      const material =
        top && r >= 0.96 ? 1 : top && r > 0.935 && r < 0.942 ? 2 : 0;
      const start = (angle * (profile.length - 1) + edge) * 6;
      for (let i = 0; i < 6; i++)
        groups[material].push(indices.getX(start + i));
    }
  }
  geometry.setIndex(groups.flat());
  geometry.clearGroups();
  let start = 0;
  groups.forEach((group, material) => {
    geometry.addGroup(start, group.length, material);
    start += group.length;
  });
  return geometry;
}

export function PlateModel({
  diameterCm,
  skin,
  showShadow = true,
}: {
  diameterCm: number;
  skin: PlateSkin;
  showShadow?: boolean;
}) {
  const palette = plateSkins[skin];
  const radius = plateRadius(diameterCm);
  const geometry = useMemo(() => ceramicGeometry(radius), [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group>
      <mesh name="plate-ceramic" geometry={geometry}>
        <meshPhysicalMaterial
          attach="material-0"
          color={palette.base}
          roughness={0.3}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
        />
        <meshPhysicalMaterial
          attach="material-1"
          color={palette.rim}
          roughness={0.28}
          clearcoat={0.7}
          clearcoatRoughness={0.2}
        />
        <meshPhysicalMaterial
          attach="material-2"
          color={palette.band}
          roughness={0.3}
          clearcoat={0.65}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {showShadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.105, 0]}>
          <circleGeometry args={[radius * 1.025, 80]} />
          <meshBasicMaterial
            color="#555b38"
            transparent
            opacity={0.06}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
