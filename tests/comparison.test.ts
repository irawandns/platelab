import { beforeEach, describe, expect, it } from "vitest";
import { comparePlates } from "../src/lib/comparison";
import { summarize } from "../src/lib/nutrition";
import { registerPoseReader, usePlate } from "../src/lib/store";
import type { FoodPose, PlateItem } from "../src/types";

const item = (foodId: string, grams: number): PlateItem => ({
  instanceId: foodId,
  foodId,
  portionGrams: grams,
  position: [0, 0],
});

describe("nutrition comparison", () => {
  it("compares whole meals and retains unrounded positive and negative differences", () => {
    const original = [
      item("rice", 100),
      item("chicken", 100),
      item("broccoli", 100),
    ];
    const current = [item("rice", 200), ...original.slice(1)];
    const rows = comparePlates(original, current);
    expect(rows.find((row) => row.key === "calories")).toMatchObject({
      original: 330,
      current: 460,
      difference: 130,
    });
    expect(rows.find((row) => row.key === "carbohydrates")?.difference)
      .toBeCloseTo(28.17, 8);
    expect(comparePlates(current, original)[0].difference).toBe(-130);
    expect(comparePlates(original, original).every((row) => row.difference === 0))
      .toBe(true);
    expect(comparePlates([], [item("rice", 17.3)])[0].difference)
      .toBeCloseTo(22.49, 8);
  });

  it("includes custom retained oil exactly once and supports an empty current plate", () => {
    const original = [item("chicken", 100)];
    const current: PlateItem[] = [{
      ...original[0],
      cooking: {
        method: "pan-fry",
        oilId: "olive",
        oil: { grams: 10, basis: "used", retainedPercent: 50 },
      },
    }];
    const rows = comparePlates(original, current);
    expect(rows.find((row) => row.key === "fat")?.difference).toBeCloseTo(5, 8);
    expect(rows[0].difference).toBeCloseTo(44.2, 8);
    expect(comparePlates(current, [])[0].current).toBe(0);
    expect(comparePlates(current, [])[0].difference)
      .toBeCloseTo(-summarize(current).totals.calories, 8);
  });

  it("never subtracts incomplete subtotals, even when both sides have missing fiber", () => {
    const tempeh = [item("tempeh", 100)];
    const broccoli = [item("broccoli", 100)];
    for (const [before, after] of [
      [tempeh, broccoli],
      [broccoli, tempeh],
      [tempeh, tempeh],
      [tempeh, []],
    ]) {
      const fiber = comparePlates(before, after).find((row) => row.key === "fiber");
      expect(fiber?.difference).toBeNull();
    }
    expect(comparePlates(tempeh, broccoli).find((row) => row.key === "fiber"))
      .toMatchObject({
        original: 0,
        originalIncomplete: true,
        current: 3.3,
        currentIncomplete: false,
      });
    expect(comparePlates([], [])[4].difference).toBe(0);
  });
});

describe("comparison snapshots", () => {
  beforeEach(() => {
    usePlate.setState({
      items: [],
      history: [],
      selectedItemId: null,
      comparisonBaseline: null,
      plateType: "ceramic",
      plateDiameterCm: 26,
      plateSkin: "cream",
      sceneRevision: 0,
      restorePhysics: false,
      announcement: "",
    });
  });

  it("ignores empty capture and restore without an original", () => {
    usePlate.getState().captureComparison();
    usePlate.getState().restoreComparison();
    expect(usePlate.getState().comparisonBaseline).toBeNull();
    expect(usePlate.getState().history).toHaveLength(0);
    expect(usePlate.getState().sceneRevision).toBe(0);
  });

  it("captures live poses and deeply independent portions, duplicate foods, and oil", () => {
    usePlate.getState().add("tofu");
    usePlate.getState().add("tofu");
    const [first, second] = usePlate.getState().items;
    usePlate.getState().setCooking(first.instanceId, {
      method: "pan-fry",
      oilId: "olive",
      oil: { grams: 10, basis: "used", retainedPercent: 50 },
    });
    const pose: FoodPose = {
      position: [0.2, 0.5, -0.3],
      rotation: [0, 0, 0, 1],
    };
    const unregister = registerPoseReader(() => ({ [first.instanceId]: pose }));
    const revision = usePlate.getState().sceneRevision;
    const historyLength = usePlate.getState().history.length;
    try {
      usePlate.getState().captureComparison();
    } finally {
      unregister();
    }
    const baseline = usePlate.getState().comparisonBaseline!;
    expect(baseline.items[0].position).toEqual([0.2, -0.3]);
    expect(baseline.items[0].pose).toEqual(pose);
    expect(baseline.items[0].pose).not.toBe(pose);
    expect(baseline.items[0].cooking).not.toBe(usePlate.getState().items[0].cooking);
    expect(usePlate.getState().sceneRevision).toBe(revision);
    expect(usePlate.getState().history).toHaveLength(historyLength);
    pose.position[0] = 99;
    usePlate.getState().setPortion(first.instanceId, 200);
    usePlate.getState().setCooking(first.instanceId);
    usePlate.getState().remove(second.instanceId);
    usePlate.getState().reset();
    usePlate.getState().undo();
    expect(baseline.items).toHaveLength(2);
    expect(baseline.items[0].portionGrams).toBe(100);
    expect(baseline.items[0].pose?.position[0]).toBe(0.2);
    expect(baseline.items[0].cooking?.oil?.retainedPercent).toBe(50);
  });

  it("restores the original vessel, selection, and arrangement and allows undo of restoration", () => {
    usePlate.getState().setPlateType("meal-tray");
    usePlate.getState().setPlateDiameter(32);
    usePlate.getState().setPlateSkin("blue");
    usePlate.getState().add("chicken");
    const id = usePlate.getState().selectedItemId!;
    usePlate.getState().setCooking(id, {
      method: "sear",
      oilId: "soybean",
    });
    usePlate.getState().captureComparison();
    const baseline = usePlate.getState().comparisonBaseline!;
    usePlate.getState().setPortion(id, 200);
    usePlate.getState().setPlateType("ceramic");
    usePlate.getState().reset();
    const revision = usePlate.getState().sceneRevision;
    usePlate.getState().restoreComparison();
    const restored = usePlate.getState();
    expect(restored.items).toEqual(baseline.items);
    expect(restored.items).not.toBe(baseline.items);
    expect(restored.plateType).toBe("meal-tray");
    expect(restored.plateDiameterCm).toBe(32);
    expect(restored.plateSkin).toBe("blue");
    expect(restored.selectedItemId).toBe(id);
    expect(restored.restorePhysics).toBe(true);
    expect(restored.sceneRevision).toBe(revision + 1);
    usePlate.getState().undo();
    expect(usePlate.getState().items).toHaveLength(0);
    expect(usePlate.getState().plateType).toBe("ceramic");
    expect(usePlate.getState().comparisonBaseline).toEqual(baseline);
    usePlate.getState().restoreComparison();
    expect(usePlate.getState().items).toEqual(baseline.items);
  });

  it("replaces the original explicitly and finishes without changing the meal or undo history", () => {
    usePlate.getState().add("rice");
    usePlate.getState().captureComparison();
    const id = usePlate.getState().selectedItemId!;
    usePlate.getState().setPortion(id, 200);
    usePlate.getState().captureComparison();
    expect(usePlate.getState().comparisonBaseline?.items[0].portionGrams).toBe(200);
    const state = usePlate.getState();
    usePlate.getState().endComparison();
    expect(usePlate.getState().comparisonBaseline).toBeNull();
    expect(usePlate.getState().items).toBe(state.items);
    expect(usePlate.getState().history).toBe(state.history);
    expect(usePlate.getState().sceneRevision).toBe(state.sceneRevision);
  });
});
