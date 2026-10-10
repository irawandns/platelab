import { describe, expect, it } from "vitest";
import { foods, foodById, forPortion, summarize } from "../src/lib/nutrition";
import rawNutrients from "../src/data/usda-nut_data.json";
import rawWeights from "../src/data/usda-weight.json";
import {
  clampPosition,
  MAX_ITEMS,
  PLACEMENT_RADIUS,
  usePlate,
} from "../src/lib/store";
import type { PlateItem, Nutrient } from "../src/types";
const item = (foodId: string, grams: number): PlateItem => ({
  instanceId: foodId,
  foodId,
  portionGrams: grams,
  position: [0, 0],
});
describe("auditable food data", () => {
  it("has all 15 distinct foods and exact USDA values, preserving missing data", () => {
    expect(foods).toHaveLength(15);
    expect(new Set(foods.map((f) => f.id)).size).toBe(15);
    const nutrientIds: Record<Nutrient, string> = {
      calories: "208",
      protein: "203",
      carbohydrates: "205",
      fat: "204",
      fiber: "291",
    };
    for (const food of foods) {
      for (const [key, id] of Object.entries(nutrientIds)) {
        const row = rawNutrients.find(
          (r) => r[0] === food.source.id && r[1] === id,
        );
        expect(food.nutrientsPer100g[key as Nutrient]).toBe(
          row ? Number(row[2]) : null,
        );
      }
      expect(food.minPortionGrams).toBeGreaterThan(0);
      expect(food.maxPortionGrams).toBeGreaterThan(food.defaultPortionGrams);
    }
  });
  it("backs countable servings with USDA household weights", () => {
    for (const food of foods.filter((f) => f.countable))
      expect(
        rawWeights.some(
          (r) =>
            r[0] === food.source.id &&
            Number(r[2]) === 1 &&
            Number(r[4]) === food.defaultPortionGrams,
        ),
      ).toBe(true);
  });
  it("converts 200 ml milk using a USDA 244 g US cup without early rounding", () => {
    const expected = (244 / 236.5882365) * 200;
    expect(foodById.milk.defaultPortionGrams).toBeCloseTo(expected, 10);
    expect(forPortion(foodById.milk, expected).calories).toBeCloseTo(
      expected * 0.61,
      10,
    );
  });
});
describe("nutrition calculations", () => {
  it("computes the documented rice, chicken and broccoli experiment", () => {
    const meal = [
      item("rice", 100),
      item("chicken", 100),
      item("broccoli", 100),
    ];
    const first = summarize(meal).totals;
    expect(first.calories).toBe(330);
    expect(first.protein).toBeCloseTo(36.09, 8);
    expect(first.carbohydrates).toBeCloseTo(35.35, 8);
    expect(first.fat).toBeCloseTo(4.26, 8);
    expect(first.fiber).toBeCloseTo(3.7, 8);
    expect(
      summarize([item("rice", 200), ...meal.slice(1)]).totals.calories,
    ).toBe(460);
  });
  it("does not round intermediate values or count fiber twice", () => {
    const result = summarize([item("apple", 17.3), item("apple", 17.3)]).totals;
    expect(result.calories).toBeCloseTo(17.992, 8);
    expect(result.carbohydrates).toBeCloseTo(4.77826, 8);
  });
  it("distinguishes missing fiber from zero and returns a known subtotal", () => {
    expect(forPortion(foodById.tempeh, 100).fiber).toBeNull();
    const { totals, incomplete } = summarize([
      item("tempeh", 100),
      item("broccoli", 100),
    ]);
    expect(incomplete.has("fiber")).toBe(true);
    expect(totals.fiber).toBe(3.3);
    expect(summarize([item("egg", 50)]).incomplete.size).toBe(0);
    expect(summarize([]).totals.calories).toBe(0);
  });
});
describe("plate state and boundaries", () => {
  const clean = () =>
    usePlate.setState({
      items: [],
      selectedItemId: null,
      history: [],
      announcement: "",
    });
  it("keeps duplicate instances independent and restores a cleared plate", () => {
    clean();
    const s = usePlate.getState();
    s.add("rice");
    s.add("rice");
    const [a, b] = usePlate.getState().items;
    expect(a.instanceId).not.toBe(b.instanceId);
    s.setPortion(a.instanceId, 200);
    expect(usePlate.getState().items[1].portionGrams).toBe(100);
    s.reset();
    expect(usePlate.getState().items).toHaveLength(0);
    s.undo();
    expect(usePlate.getState().items.map((i) => i.portionGrams)).toEqual([
      200, 100,
    ]);
    s.remove(b.instanceId);
    s.undo();
    expect(usePlate.getState().items).toHaveLength(2);
  });
  it("clamps movement and portions, ignores unknown foods and invalid numbers", () => {
    clean();
    const s = usePlate.getState();
    s.add("not-a-food");
    expect(usePlate.getState().items).toHaveLength(0);
    s.add("rice", [100, 100]);
    let i = usePlate.getState().items[0];
    expect(Math.hypot(...i.position)).toBeCloseTo(PLACEMENT_RADIUS, 8);
    s.setPortion(i.instanceId, Infinity);
    expect(usePlate.getState().items[0].portionGrams).toBe(100);
    s.setPortion(i.instanceId, 999);
    expect(usePlate.getState().items[0].portionGrams).toBe(300);
    s.setPortion(i.instanceId, -10);
    expect(usePlate.getState().items[0].portionGrams).toBe(25);
    expect(clampPosition(NaN, 2)).toEqual([0, 0]);
    const energy = summarize(usePlate.getState().items).totals.calories;
    s.move(i.instanceId, [99, 20]);
    expect(summarize(usePlate.getState().items).totals.calories).toBe(energy);
  });
  it("caps items and undo history to bound retained state", () => {
    clean();
    for (let n = 0; n < MAX_ITEMS + 4; n++) usePlate.getState().add("rice");
    expect(usePlate.getState().items).toHaveLength(MAX_ITEMS);
    const id = usePlate.getState().items[0].instanceId;
    for (let n = 0; n < 40; n++) usePlate.getState().setPortion(id, 50 + n);
    expect(usePlate.getState().history.length).toBeLessThanOrEqual(30);
  });
});
