import type { PlateItem } from "../types";

// Physical coordinates are shared by food models, plate geometry and placement.
export const CM_PER_UNIT = 5;
export const DEFAULT_PLATE_CM = 26;
export const MIN_PLATE_CM = 18;
export const MAX_PLATE_CM = 36;
export const WELL_RATIO = 2.24 / 2.74;
export const plateRadius = (diameterCm: number) => diameterCm / CM_PER_UNIT / 2;
export const wellRadius = (diameterCm: number) =>
  plateRadius(diameterCm) * WELL_RATIO;

// Width × height × depth of a regular serving, including its silhouette.
// Apple diameter and banana length are anchored to USDA household measures.
// Other dimensions are explicit visual estimates, not USDA measurements.
export const foodDimensionsCm: Record<string, [number, number, number]> = {
  rice: [9, 3.5, 8],
  bread: [10, 1.2, 10],
  noodles: [10, 3.5, 9],
  egg: [4.4, 5.7, 4.4],
  chicken: [10, 2.8, 6],
  salmon: [9, 2.5, 4.5],
  tofu: [7, 4.5, 6],
  tempeh: [8, 2.5, 5],
  broccoli: [10, 6, 9],
  carrot: [15, 3.5, 3.5],
  avocado: [7, 4, 10],
  // A curved medium banana has an estimated 14.6 cm chord across its 18.8 cm length.
  banana: [14.6, 3, 6],
  apple: [7.62, 8.2, 7.2],
  milk: [8.4, 13, 8.4],
  cheese: [5, 2, 4],
};
const pieceFoods = new Set(["apple", "egg", "banana", "bread"]);
export interface VisualPiece {
  position: [number, number, number];
  scale: number;
}
export function portionPieces(foodId: string, ratio: number): VisualPiece[] {
  if (foodId === "milk") return [{ position: [0, 0, 0], scale: 1 }];
  if (!pieceFoods.has(foodId))
    return [{ position: [0, 0, 0], scale: Math.cbrt(ratio) }];
  const count = Math.ceil(ratio - 1e-8);
  const [width, height, depth] = foodDimensionsCm[foodId];
  return Array.from({ length: count }, (_, i) => {
    let position: [number, number, number] = [0, 0, 0];
    if (foodId === "bread") position = [0, (i * height) / CM_PER_UNIT, 0];
    else if (foodId === "banana")
      position = [0, 0, ((i - (count - 1) / 2) * 3.4) / CM_PER_UNIT];
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
    ? footprintRadius(item.foodId, item.portionGrams / defaultGrams)
    : 0;
  return Math.max(0, wellRadius(diameterCm) - footprint - 0.04);
}
