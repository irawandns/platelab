import foodData from "../data/foods.json";
import type { Food, Nutrient, Nutrients, PlateItem } from "../types";
export const foods = foodData as Food[];
export const foodById = Object.fromEntries(
  foods.map((food) => [food.id, food]),
);
export const nutrientKeys: Nutrient[] = [
  "calories",
  "protein",
  "carbohydrates",
  "fat",
  "fiber",
];
export function forPortion(food: Food, grams: number): Nutrients {
  return Object.fromEntries(
    nutrientKeys.map((key) => [
      key,
      food.nutrientsPer100g[key] === null
        ? null
        : (food.nutrientsPer100g[key]! * grams) / 100,
    ]),
  ) as Nutrients;
}
export function summarize(items: PlateItem[]) {
  const totals = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
  };
  const incomplete = new Set<Nutrient>();
  for (const item of items) {
    const values = forPortion(foodById[item.foodId], item.portionGrams);
    for (const key of nutrientKeys) {
      if (values[key] === null) incomplete.add(key);
      else totals[key] += values[key]!;
    }
  }
  return { totals, incomplete };
}
export function format(value: number | null, digits = 1) {
  return value === null
    ? "Unknown"
    : new Intl.NumberFormat("en", { maximumFractionDigits: digits }).format(
        value,
      );
}
export function portionLabel(food: Food, grams: number) {
  if (food.id === "milk")
    return `${format((grams / food.defaultPortionGrams) * 200)} ml`;
  if (food.countable) {
    const count = grams / food.defaultPortionGrams;
    const unit = food.id === "bread" ? "slice" : food.id;
    return `${format(count, 2)} ${unit}${count === 1 ? "" : "s"} · ${format(grams)} g`;
  }
  return `${format(grams)} g`;
}
export function getInsight(items: PlateItem[]) {
  if (!items.length)
    return "Every plate starts with a little curiosity. Pick a food and see what it brings to the table.";
  if (
    items.some(
      (i) => i.portionGrams >= foodById[i.foodId].defaultPortionGrams * 2,
    )
  )
    return "Twice the portion, twice the nutrients. Each estimate scales with the edible weight of your food.";
  if (items.some((i) => i.foodId === "tempeh"))
    return "Missing data is not zero. This tempeh record has no fiber value, so your fiber total is a known subtotal.";
  if (items.filter((i) => foodById[i.foodId].category === "Protein").length > 1)
    return "Different protein sources bring different amounts of fat and carbohydrates, too. Select each one to compare.";
  if (items.some((i) => foodById[i.foodId].category === "Vegetables"))
    return "Fiber is part of total carbohydrates. We show it separately to help you explore, but do not add it twice.";
  return "What changes with a bigger portion? Select a food, adjust its size, and watch the numbers respond.";
}
