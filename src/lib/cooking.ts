import oilData from "../data/cooking-oils.json";
import foodData from "../data/foods.json";
import type {
  CookingMethod,
  CookingSettings,
  Nutrients,
  OilId,
  OilUnit,
  PlateItem,
} from "../types";

export const cookingMethods: Record<
  CookingMethod,
  { label: string; oilGramsPer100g: number }
> = {
  sear: { label: "Sear", oilGramsPer100g: 2 },
  "pan-fry": { label: "Pan-fry", oilGramsPer100g: 5 },
  "deep-fry": { label: "Deep-fry", oilGramsPer100g: 10 },
  "air-fry": { label: "Air-fry", oilGramsPer100g: 1 },
};
export const MAX_OIL_GRAMS = 100;
export const DEFAULT_OIL: OilId = "soybean";
const cookingFoodIds = new Set(
  foodData
    .filter((food) => food.available !== false && food.category === "Protein")
    .map((food) => food.id),
);
export const supportsCooking = (foodId: string) => cookingFoodIds.has(foodId);
export const oils = oilData as {
  id: OilId;
  name: string;
  gramsPerTeaspoon: number;
  gramsPerTablespoon: number;
  nutrientsPer100g: Nutrients;
  source: { id: string; description: string; url: string };
}[];
export const oilById = Object.fromEntries(oils.map((oil) => [oil.id, oil]));

export function gramsPerUnit(oilId: OilId, unit: OilUnit) {
  const oil = oilById[oilId];
  return unit === "g"
    ? 1
    : unit === "tsp"
      ? oil.gramsPerTeaspoon
      : oil.gramsPerTablespoon;
}
export function oilAmountGrams(item: PlateItem) {
  if (!item.cooking || !supportsCooking(item.foodId)) return 0;
  return (
    item.cooking.oil?.grams ??
    (cookingMethods[item.cooking.method].oilGramsPer100g * item.portionGrams) /
      100
  );
}
export function retainedOilGrams(item: PlateItem) {
  const amount = oilAmountGrams(item);
  return item.cooking?.oil?.basis === "used"
    ? (amount * item.cooking.oil.retainedPercent) / 100
    : amount;
}
export function oilForItem(item: PlateItem): Nutrients {
  const grams = retainedOilGrams(item);
  const oil = oilById[item.cooking?.oilId ?? DEFAULT_OIL];
  return Object.fromEntries(
    Object.entries(oil.nutrientsPer100g).map(([key, value]) => [
      key,
      value === null ? null : (value * grams) / 100,
    ]),
  ) as Nutrients;
}

export function normalizeCooking(
  foodId: string,
  cooking: CookingSettings,
): CookingSettings | null {
  if (
    !supportsCooking(foodId) ||
    !Object.hasOwn(cookingMethods, cooking.method) ||
    !Object.hasOwn(oilById, cooking.oilId)
  )
    return null;
  if (!cooking.oil) return { method: cooking.method, oilId: cooking.oilId };
  const { grams, basis, retainedPercent } = cooking.oil;
  if (
    !Number.isFinite(grams) ||
    !Number.isFinite(retainedPercent) ||
    !["in-serving", "used"].includes(basis)
  )
    return null;
  return {
    method: cooking.method,
    oilId: cooking.oilId,
    oil: {
      grams: Math.min(MAX_OIL_GRAMS, Math.max(0, grams)),
      basis,
      retainedPercent:
        basis === "in-serving"
          ? 100
          : Math.min(100, Math.max(0, retainedPercent)),
    },
  };
}
