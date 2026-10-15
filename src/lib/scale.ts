import type { PlateItem } from "../types";

// Form changes the geometry only; foodId remains the nutrition source key.
export const foodModelId = (item: PlateItem) =>
  item.foodId === "timun" && item.form === "whole"
    ? "timun-whole"
    : item.foodId;

// Physical coordinates are shared by food models, plate geometry and placement.
export const CM_PER_UNIT = 5;
export const DEFAULT_PLATE_CM = 26;
export const MIN_PLATE_CM = 18;
export const MAX_PLATE_CM = 36;
export const WELL_RATIO = 0.7;
export const PLATE_SURFACE_Y = 0.18;
// Radius as a fraction of the outer rim, height in scene units. The flat well
// keeps regular servings level; the shoulder curves up to a rolled ceramic lip.
export const plateTopProfile: [number, number][] = [
  [0, PLATE_SURFACE_Y],
  [WELL_RATIO, PLATE_SURFACE_Y],
  [0.74, 0.19],
  [0.78, 0.23],
  [0.82, 0.3],
  [0.86, 0.39],
  [0.9, 0.48],
  [0.935, 0.54],
  [0.942, 0.55],
  [0.96, 0.575],
  [0.975, 0.59],
  [0.99, 0.6],
  [1, 0.58],
];
export const plateRadius = (diameterCm: number) => diameterCm / CM_PER_UNIT / 2;
export const wellRadius = (diameterCm: number) =>
  plateRadius(diameterCm) * WELL_RATIO;

export function plateSurfaceHeight(diameterCm: number, radialDistance: number) {
  const ratio = Math.max(0, radialDistance / plateRadius(diameterCm));
  for (let i = 1; i < plateTopProfile.length; i++) {
    const [r0, y0] = plateTopProfile[i - 1];
    const [r1, y1] = plateTopProfile[i];
    if (ratio <= r1) return y0 + ((ratio - r0) / (r1 - r0)) * (y1 - y0);
  }
  return plateTopProfile.at(-1)![1];
}

// Use the highest surface beneath a conservative footprint, including its
// interior. Oversize portions stay level and clear the rim instead of sinking
// into it. This is geometric clearance, not simulated contact or stacking.
export function foodSupportHeight(
  diameterCm: number,
  item: PlateItem,
  defaultGrams: number,
) {
  const outer =
    Math.hypot(...item.position) +
    footprintRadius(foodModelId(item), item.portionGrams / defaultGrams);
  const radius = plateRadius(diameterCm);
  return (
    Math.max(
      plateSurfaceHeight(diameterCm, outer),
      ...plateTopProfile.filter(([r]) => r * radius <= outer).map(([, y]) => y),
    ) + 0.005
  );
}

// Width × height × depth of a regular serving, including its silhouette.
// Broccoli is calibrated per illustrative floret, then assembled into a serving.
// Dimensions are explicit visual estimates, not USDA measurements.
export const foodDimensionsCm: Record<string, [number, number, number]> = {
  rice: [9, 3.5, 8],
  bread: [10, 1.2, 10],
  noodles: [10, 3.5, 9],
  egg: [4.4, 5.7, 4.4],
  chicken: [10, 2.8, 6],
  salmon: [9, 2.5, 4.5],
  tofu: [7, 4.5, 6],
  tempeh: [8, 2.5, 5],
  broccoli: [4.5, 4.8, 4.5],
  avocado: [7, 4, 10],
  cheese: [5, 2, 4],
  timun: [3.5, 0.6, 3.5],
  "timun-whole": [8, 2.8, 2.8],
  kerupuk: [6, 0.8, 5],
  "ikan-kembung": [16, 2.5, 5],
  "bakwan-sayur": [6, 1.5, 5.5],
};
export const physicsFoods = new Set(
  Object.keys(foodDimensionsCm).filter((id) => id !== "timun-whole"),
);
const pieceFoods = new Set(["egg", "bread"]);
// A visual quantity cue, not a measured gram-to-floret conversion.
export const BROCCOLI_FLORETS_PER_SERVING = 5;
// Artistic piece counts per serving; edible grams drive nutrient calculations.
export const illustratedPiecesPerServing: Record<string, number> = {
  timun: 5,
  kerupuk: 3,
  "bakwan-sayur": 1,
};
export interface VisualPiece {
  position: [number, number, number];
  scale: number;
  rotationY?: number;
}
export function portionPieces(foodId: string, ratio: number): VisualPiece[] {
  const illustratedCount = illustratedPiecesPerServing[foodId];
  if (illustratedCount) {
    const quantity = ratio * illustratedCount;
    const count = Math.ceil(quantity - 1e-8);
    const [width, , depth] = foodDimensionsCm[foodId];
    // Cucumber rounds lie flat with a visible gap, including at maximum portion.
    const spacing = foodId === "timun" ? 1.06 : 0.6;
    // Crackers form an overlapping cluster rather than a long rigid row.
    const columns = Math.min(count, foodId === "kerupuk" && count <= 3 ? 2 : 3);
    const rows = Math.ceil(count / columns);
    return Array.from({ length: count }, (_, i): VisualPiece => ({
      position: [
        (foodId === "kerupuk" && i === count - 1 && count % columns === 1
          ? 0
          : (i % columns) - (columns - 1) / 2) *
          (width / CM_PER_UNIT) *
          spacing,
        0,
        (Math.floor(i / columns) - (rows - 1) / 2) *
          (depth / CM_PER_UNIT) *
          spacing,
      ],
      scale: Math.cbrt(Math.min(1, quantity - i)),
    }));
  }
  if (foodId === "broccoli") {
    const florets = ratio * BROCCOLI_FLORETS_PER_SERVING;
    const pieces = Array.from(
      { length: Math.ceil(florets - 1e-8) },
      (_, i): VisualPiece => {
        const angle = i * 2.399963;
        const radius = Math.sqrt(i) * 0.34;
        return {
          position: [Math.cos(angle) * radius, 0, Math.sin(angle) * radius],
          scale: Math.cbrt(Math.min(1, florets - i)),
          rotationY: (i % 4) * (Math.PI / 2),
        };
      },
    );
    // Center the whole cluster, including the smaller fractional floret.
    for (const axis of [0, 2] as const) {
      const halfSize = foodDimensionsCm.broccoli[axis] / CM_PER_UNIT / 2;
      const center =
        (Math.min(...pieces.map((p) => p.position[axis] - halfSize * p.scale)) +
          Math.max(
            ...pieces.map((p) => p.position[axis] + halfSize * p.scale),
          )) /
        2;
      pieces.forEach((piece) => (piece.position[axis] -= center));
    }
    return pieces;
  }
  if (!pieceFoods.has(foodId))
    return [{ position: [0, 0, 0], scale: Math.cbrt(ratio) }];
  const count = Math.ceil(ratio - 1e-8);
  const [width, height, depth] = foodDimensionsCm[foodId];
  return Array.from({ length: count }, (_, i) => {
    let position: [number, number, number] = [0, 0, 0];
    if (foodId === "bread") position = [0, (i * height) / CM_PER_UNIT, 0];
    else if (count === 2)
      position = [((i - 0.5) * (width + 0.3)) / CM_PER_UNIT, 0, 0];
    else if (count === 3)
      position = [
        ((i === 2 ? 0 : i === 0 ? -0.5 : 0.5) * (width + 0.3)) / CM_PER_UNIT,
        0,
        ((i === 2 ? 0.58 : -0.29) * (depth + 0.3)) / CM_PER_UNIT,
      ];
    return { position, scale: Math.cbrt(Math.min(1, ratio - i)) };
  });
}
export function footprintRadius(foodId: string, ratio: number): number {
  const [width, , depth] = foodDimensionsCm[foodId];
  return Math.max(
    ...portionPieces(foodId, ratio).map(({ position, scale }) =>
      Math.hypot(
        Math.abs(position[0]) + (width * scale) / CM_PER_UNIT / 2,
        Math.abs(position[2]) + (depth * scale) / CM_PER_UNIT / 2,
      ),
    ),
  );
}
export function placementRadius(
  diameterCm: number,
  item?: PlateItem,
  defaultGrams = 1,
) {
  const footprint = item
    ? footprintRadius(foodModelId(item), item.portionGrams / defaultGrams)
    : 0;
  const usableRadius =
    item && physicsFoods.has(item.foodId)
      ? plateRadius(diameterCm)
      : wellRadius(diameterCm);
  return Math.max(0, usableRadius - footprint - 0.04);
}
