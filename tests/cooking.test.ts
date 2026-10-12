import { beforeEach, describe, expect, it } from "vitest";
import {
  cookingMethods,
  gramsPerUnit,
  oilForItem,
  oils,
  retainedOilGrams,
} from "../src/lib/cooking";
import { foodById, forItem, forPortion, summarize } from "../src/lib/nutrition";
import { registerPoseReader, usePlate } from "../src/lib/store";
import source from "../src/data/usda-oils.json";
import type {
  CookingSettings,
  FoodPose,
  Nutrient,
  PlateItem,
} from "../src/types";

const portion = (cooking?: CookingSettings): PlateItem => ({
  foodId: "chicken",
  instanceId: "chicken",
  portionGrams: 100,
  position: [0, 0],
  cooking,
});
beforeEach(() =>
  usePlate.setState({
    items: [],
    history: [],
    selectedItemId: null,
    sceneRevision: 0,
    restorePhysics: false,
    plateDiameterCm: 26,
  }),
);

describe("oil data and calculations", () => {
  it("backs every oil nutrient and spoon weight with retained USDA rows", () => {
    const codes: Record<Nutrient, string> = {
      calories: "208",
      protein: "203",
      fat: "204",
      carbohydrates: "205",
      fiber: "291",
    };
    for (const oil of oils) {
      for (const [key, code] of Object.entries(codes)) {
        const row = source.nutrientRows.find(
          (r) => r[0] === oil.source.id && r[1] === code,
        );
        expect(oil.nutrientsPer100g[key as Nutrient]).toBe(
          row ? Number(row[2]) : null,
        );
      }
      const rows = source.weightRows.filter((r) => r[0] === oil.source.id);
      expect(oil.gramsPerTeaspoon).toBe(
        Number(rows.find((r) => r[3] === "tsp")![4]),
      );
      expect(oil.gramsPerTablespoon).toBe(
        Number(rows.find((r) => ["tbsp", "tablespoon"].includes(r[3]))![4]),
      );
    }
    expect(gramsPerUnit("olive", "tbsp")).toBe(13.5);
    expect(gramsPerUnit("soybean", "tbsp")).toBe(13.6);
    expect(gramsPerUnit("palm", "tsp")).toBe(4.5);
    expect(gramsPerUnit("olive", "g")).toBe(1);
  });
  it("adds oil once while preserving reference macros and uncooked items", () => {
    const item = portion({ method: "deep-fry", oilId: "soybean" });
    const base = forPortion(foodById.chicken, 100);
    expect(forItem(portion())).toEqual(base);
    expect(forItem(item).calories).toBeCloseTo(253.4, 8);
    expect(forItem(item).fat).toBeCloseTo(13.57, 8);
    for (const key of ["protein", "carbohydrates", "fiber"] as const)
      expect(forItem(item)[key]).toBe(base[key]);
    expect(summarize([item]).totals.calories).toBeCloseTo(253.4, 8);
    expect(
      summarize([item, { ...portion(), foodId: "tempeh" }]).incomplete.has(
        "fiber",
      ),
    ).toBe(true);
  });
  it("scales presets with food weight but holds custom oil fixed for the serving", () => {
    const preset = portion({ method: "pan-fry", oilId: "olive" });
    expect(retainedOilGrams(preset)).toBe(5);
    expect(retainedOilGrams({ ...preset, portionGrams: 200 })).toBe(10);
    const custom = portion({
      method: "pan-fry",
      oilId: "olive",
      oil: { grams: 13.5, basis: "in-serving", retainedPercent: 100 },
    });
    expect(retainedOilGrams({ ...custom, portionGrams: 200 })).toBe(13.5);
    expect(forItem({ ...custom, portionGrams: 200 }).calories).toBeCloseTo(
      449.34,
      8,
    );
  });
  it("counts only the specified oil remaining with the food, including zero", () => {
    const item = portion({
      method: "deep-fry",
      oilId: "palm",
      oil: { grams: 27.2, basis: "used", retainedPercent: 50 },
    });
    expect(retainedOilGrams(item)).toBeCloseTo(13.6, 8);
    expect(oilForItem(item).calories).toBeCloseTo(120.224, 8);
    for (const retainedPercent of [0, 100]) {
      const modified = {
        ...item,
        cooking: {
          ...item.cooking!,
          oil: { ...item.cooking!.oil!, retainedPercent },
        },
      };
      expect(retainedOilGrams(modified)).toBeCloseTo(
        (27.2 * retainedPercent) / 100,
        8,
      );
    }
  });
});

describe("cooking state", () => {
  it("replaces presets without accumulating oil and supports undo to the reference", () => {
    const actions = usePlate.getState();
    actions.add("chicken");
    const id = usePlate.getState().items[0].instanceId;
    for (const [method, preset] of Object.entries(cookingMethods)) {
      actions.setCooking(id, {
        method: method as CookingSettings["method"],
        oilId: "soybean",
      });
      expect(summarize(usePlate.getState().items).totals.calories).toBeCloseTo(
        165 + preset.oilGramsPer100g * 8.84,
        8,
      );
    }
    actions.setCooking(id);
    expect(summarize(usePlate.getState().items).totals.calories).toBe(165);
    actions.undo();
    expect(usePlate.getState().items[0].cooking?.method).toBe("air-fry");
  });
  it("preserves live poses and physics while changing oil, and restores them on undo", () => {
    const actions = usePlate.getState();
    actions.add("tofu");
    const before = usePlate.getState();
    const id = before.items[0].instanceId;
    const pose: FoodPose = {
      position: [0.1, 0.3, 0.2],
      rotation: [0, 0, 0, 1],
    };
    const unregister = registerPoseReader(() => ({ [id]: pose }));
    try {
      actions.setCooking(id, { method: "sear", oilId: "olive" });
      expect(usePlate.getState().sceneRevision).toBe(before.sceneRevision);
      expect(usePlate.getState().items[0].pose).toEqual(pose);
      expect(usePlate.getState().items[0].position).toEqual([0.1, 0.2]);
      actions.undo();
      expect(usePlate.getState().items[0].cooking).toBeUndefined();
      expect(usePlate.getState().items[0].pose).toEqual(pose);
    } finally {
      unregister();
    }
  });
  it("keeps duplicate foods independent across portions, remove, reset, and undo", () => {
    const actions = usePlate.getState();
    actions.add("tofu");
    actions.add("tofu");
    const [first, second] = usePlate.getState().items;
    const cooking: CookingSettings = {
      method: "sear",
      oilId: "olive",
      oil: { grams: 5, basis: "in-serving", retainedPercent: 100 },
    };
    actions.setCooking(first.instanceId, cooking);
    actions.setPortion(first.instanceId, 200);
    expect(usePlate.getState().items[0].cooking).toEqual(cooking);
    expect(usePlate.getState().items[1].cooking).toBeUndefined();
    const calories = summarize(usePlate.getState().items).totals.calories;
    actions.remove(first.instanceId);
    actions.undo();
    expect(summarize(usePlate.getState().items).totals.calories).toBe(calories);
    actions.reset();
    actions.undo();
    expect(usePlate.getState().items[0].cooking).toEqual(cooking);
    expect(usePlate.getState().items[1].instanceId).toBe(second.instanceId);
  });
  it("ignores unsupported and invalid changes, clamps inputs, and skips unchanged history", () => {
    const actions = usePlate.getState();
    actions.add("rice");
    const rice = usePlate.getState().items[0].instanceId;
    actions.setCooking(rice, { method: "sear", oilId: "olive" });
    expect(usePlate.getState().items[0].cooking).toBeUndefined();
    actions.add("chicken");
    const id = usePlate.getState().items[1].instanceId;
    const before = usePlate.getState();
    const valid: CookingSettings = { method: "sear", oilId: "olive" };
    for (const bad of [
      { ...valid, method: "missing" },
      { ...valid, oilId: "missing" },
      { ...valid, oil: { grams: NaN, basis: "used", retainedPercent: 50 } },
      {
        ...valid,
        oil: { grams: 10, basis: "used", retainedPercent: Infinity },
      },
      { ...valid, oil: { grams: 10, basis: "missing", retainedPercent: 50 } },
    ])
      actions.setCooking(id, bad as CookingSettings);
    expect(usePlate.getState()).toBe(before);
    actions.setCooking(id, valid);
    const after = usePlate.getState();
    actions.setCooking(id, valid);
    expect(usePlate.getState()).toBe(after);
    actions.setCooking(id, {
      ...valid,
      oil: { grams: 999, basis: "used", retainedPercent: -50 },
    });
    expect(usePlate.getState().items[1].cooking?.oil).toEqual({
      grams: 100,
      basis: "used",
      retainedPercent: 0,
    });
    actions.setCooking(id, {
      ...valid,
      oil: { grams: -5, basis: "in-serving", retainedPercent: 20 },
    });
    expect(usePlate.getState().items[1].cooking?.oil).toEqual({
      grams: 0,
      basis: "in-serving",
      retainedPercent: 100,
    });
  });
});
