import { describe, expect, it } from "vitest";
import { foods, foodById, forPortion, summarize } from "../src/lib/nutrition";
import rawNutrients from "../src/data/usda-nut_data.json";
import rawWeights from "../src/data/usda-weight.json";
import tkpiFoods from "../src/data/tkpi-foods.json";
import { clampPosition, MAX_ITEMS, usePlate } from "../src/lib/store";
import { DEFAULT_PLATE_CM, placementRadius } from "../src/lib/scale";
import type { PlateItem, Nutrient } from "../src/types";
const item = (foodId: string, grams: number): PlateItem => ({
  instanceId: foodId,
  foodId,
  portionGrams: grams,
  position: [0, 0],
});
describe("auditable food data", () => {
  it("has 15 available distinct foods with auditable values and missing data", () => {
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
      if (!food.source.database.startsWith("USDA")) {
        const source = tkpiFoods.find((row) => row.code === food.source.id);
        expect(source).toBeDefined();
        expect(food.nutrientsPer100g).toEqual(source!.nutrientsPer100g);
        expect(food.source.url).toContain(`#page=${source!.pdfPage}`);
      } else for (const [key, id] of Object.entries(nutrientIds)) {
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
  it("keeps temporarily unavailable foods off the shelf and rejects adding them", () => {
    usePlate.setState({ items: [], history: [] });
    for (const id of ["carrot", "banana", "apple", "milk"]) {
      expect(foodById[id]).toBeUndefined();
      usePlate.getState().add(id);
    }
    expect(usePlate.getState().items).toHaveLength(0);
  });
});
describe("nutrition calculations", () => {
  it("scales the Indonesian foods and preserves unknown fish fiber", () => {
    const meal = [
      item("timun", 50),
      item("kerupuk", 10),
      item("ikan-kembung", 100),
      item("bakwan-sayur", 50),
    ];
    const result = summarize(meal);
    expect(result.totals.calories).toBeCloseTo(316.7);
    expect(result.totals.protein).toBeCloseTo(25.97);
    expect(result.totals.carbohydrates).toBeCloseTo(29.25);
    expect(result.totals.fat).toBeCloseTo(10.65);
    expect(result.totals.fiber).toBeCloseTo(2.35);
    expect(result.incomplete).toEqual(new Set(["fiber"]));
    expect(forPortion(foodById["ikan-kembung"], 100).fiber).toBeNull();
    expect(summarize(meal.map((food) => ({
      ...food,
      portionGrams: food.portionGrams * 2,
    }))).totals.calories).toBeCloseTo(633.4);
  });

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
    const result = summarize([item("rice", 17.3), item("rice", 17.3)]).totals;
    expect(result.calories).toBeCloseTo(44.98, 8);
    expect(result.carbohydrates).toBeCloseTo(9.74682, 8);
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
      plateDiameterCm: DEFAULT_PLATE_CM,
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
    expect(Math.hypot(...i.position)).toBeCloseTo(
      placementRadius(DEFAULT_PLATE_CM, i, 100),
      8,
    );
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
