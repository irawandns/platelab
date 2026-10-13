import { nutrientKeys, summarize } from "./nutrition";
import type { Nutrient, PlateItem } from "../types";

const labels: Record<Nutrient, string> = {
  calories: "Energy",
  protein: "Protein",
  carbohydrates: "Carbs",
  fat: "Fat",
  fiber: "Fiber",
};

export function comparePlates(original: PlateItem[], current: PlateItem[]) {
  const before = summarize(original);
  const after = summarize(current);
  return nutrientKeys.map((key) => ({
    key,
    label: labels[key],
    unit: key === "calories" ? "kcal" : "g",
    digits: key === "calories" ? 0 : 1,
    original: before.totals[key],
    current: after.totals[key],
    originalIncomplete: before.incomplete.has(key),
    currentIncomplete: after.incomplete.has(key),
    difference:
      before.incomplete.has(key) || after.incomplete.has(key)
        ? null
        : after.totals[key] - before.totals[key],
  }));
}
