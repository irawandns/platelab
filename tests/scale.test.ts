import { beforeEach, describe, expect, it } from "vitest";
import { usePlate } from "../src/lib/store";
import { foodById, foods, summarize } from "../src/lib/nutrition";
import {
  CM_PER_UNIT,
  DEFAULT_PLATE_CM,
  foodDimensionsCm,
  footprintRadius,
  placementRadius,
  plateRadius,
  portionPieces,
  wellRadius,
  physicsFoods,
  BROCCOLI_FLORETS_PER_SERVING,
  foodModelId,
} from "../src/lib/scale";

beforeEach(() =>
  usePlate.setState({
    plateDiameterCm: DEFAULT_PLATE_CM,
    items: [],
    selectedItemId: null,
    history: [],
    announcement: "",
  }),
);

describe("physical food scale", () => {
  it("keeps cucumber slices separated at every supported slider portion", () => {
    const [width, , depth] = foodDimensionsCm.timun.map(
      (cm) => cm / CM_PER_UNIT,
    );
    for (let ratio = 0.25; ratio <= 3; ratio += 0.25) {
      const pieces = portionPieces("timun", ratio);
      pieces.forEach((a, index) => {
        for (const b of pieces.slice(index + 1)) {
          const radii = (a.scale + b.scale) / 2;
          expect(
            Math.abs(a.position[0] - b.position[0]) > width * radii ||
              Math.abs(a.position[2] - b.position[2]) > depth * radii,
          ).toBe(true);
        }
      });
    }
  });

  it("switches each timun form without changing grams or nutrients and restores it with undo", () => {
    const s = usePlate.getState();
    s.add("timun", [0, 0]);
    s.add("timun", [0, 0]);
    const original = usePlate.getState().items;
    const id = original[0].instanceId;
    s.setForm(id, "whole");
    const whole = usePlate.getState().items[0];
    expect(foodModelId(whole)).toBe("timun-whole");
    expect(foodModelId(usePlate.getState().items[1])).toBe("timun");
    expect(whole.portionGrams).toBe(50);
    expect(summarize(usePlate.getState().items)).toEqual(summarize(original));
    s.setPortion(id, 100);
    expect(foodModelId(usePlate.getState().items[0])).toBe("timun-whole");
    expect(portionPieces("timun-whole", 2)[0].scale ** 3).toBeCloseTo(2);
    s.undo();
    s.undo();
    expect(usePlate.getState().items).toEqual(original);
    s.add("rice");
    const rice = usePlate.getState().items.at(-1)!;
    s.setForm(rice.instanceId, "whole");
    expect(usePlate.getState().items.at(-1)).toEqual(rice);
  });

  it("adds illustrated Indonesian pieces while preserving whole-piece size", () => {
    for (const [id, count] of [
      ["timun", 5],
      ["kerupuk", 3],
      ["bakwan-sayur", 1],
    ] as const) {
      expect(portionPieces(id, 1)).toHaveLength(count);
      expect(portionPieces(id, 2)).toHaveLength(count * 2);
      for (const ratio of [0.25, 1, 1.37, 3]) {
        const pieces = portionPieces(id, ratio);
        expect(
          pieces.reduce((v, p) => v + p.scale ** 3, 0) / count,
        ).toBeCloseTo(ratio);
        expect(pieces.every((p) => p.scale > 0 && p.scale <= 1)).toBe(true);
      }
    }
  });

  it("supplies consistent physical dimensions for all available foods", () => {
    expect([...physicsFoods].sort()).toEqual(
      foods.map((food) => food.id).sort(),
    );
    expect(
      foodDimensionsCm.bread[0] / (plateRadius(26) * 2 * CM_PER_UNIT),
    ).toBeCloseTo(10 / 26);
    for (const food of foods) {
      expect(foodDimensionsCm[food.id].every((cm) => cm > 0)).toBe(true);
      expect(footprintRadius(food.id, 1)).toBeLessThan(wellRadius(26));
    }
  });
  it("doubles piece count while preserving whole-piece size and fractional volume", () => {
    for (const food of foods.filter((f) => f.countable)) {
      expect(portionPieces(food.id, 2).map((p) => p.scale)).toEqual([1, 1]);
      const fractional = portionPieces(food.id, 2.5);
      expect(fractional).toHaveLength(3);
      expect(fractional.reduce((v, p) => v + p.scale ** 3, 0)).toBeCloseTo(2.5);
    }
    expect(portionPieces("rice", 2)[0].scale ** 3).toBeCloseTo(2);
  });
  it("adds broccoli florets instead of growing a fixed trio, preserving estimated portion volume", () => {
    expect(portionPieces("broccoli", 0.5)).toHaveLength(3);
    expect(portionPieces("broccoli", 1)).toHaveLength(5);
    expect(portionPieces("broccoli", 2)).toHaveLength(10);
    expect(portionPieces("broccoli", 3)).toHaveLength(15);
    for (const ratio of [0.25, 0.5, 1, 1.37, 2, 3]) {
      const pieces = portionPieces("broccoli", ratio);
      expect(
        pieces.reduce((volume, p) => volume + p.scale ** 3, 0) /
          BROCCOLI_FLORETS_PER_SERVING,
      ).toBeCloseTo(ratio);
      expect(pieces.every((p) => p.scale > 0 && p.scale <= 1)).toBe(true);
      expect(new Set(pieces.map((p) => p.rotationY)).size).toBeGreaterThan(1);
    }
  });
});

describe("custom plate size", () => {
  it("lets the physics foods reach the curved shoulder instead of restricting them to the well", () => {
    for (const foodId of physicsFoods) {
      const food = foodById[foodId];
      usePlate.getState().add(foodId, [99, 0]);
      const item = usePlate.getState().items.at(-1)!;
      expect(item.position[0] + footprintRadius(foodId, 1)).toBeGreaterThan(
        wellRadius(26),
      );
      expect(item.position[0] + footprintRadius(foodId, 1)).toBeLessThan(
        plateRadius(26),
      );
      expect(item.portionGrams).toBe(food.defaultPortionGrams);
    }
  });
  it("shrinks placement without shrinking food or changing nutrition, and undoes exactly", () => {
    const s = usePlate.getState();
    s.setPlateDiameter(36);
    s.add("rice", [9, 0]);
    const original = usePlate.getState().items;
    const nutrition = summarize(original);
    s.setPlateDiameter(18);
    const small = usePlate.getState().items[0];
    expect(small.position[0]).toBeLessThan(original[0].position[0]);
    expect(small.position[0]).toBeCloseTo(placementRadius(18, small, 100));
    expect(small.portionGrams).toBe(100);
    expect(summarize([small])).toEqual(nutrition);
    s.undo();
    expect(usePlate.getState().plateDiameterCm).toBe(36);
    expect(usePlate.getState().items).toEqual(original);
  });
  it("reclamps enlarged portions and movement using the current food footprint", () => {
    const s = usePlate.getState();
    s.setPlateDiameter(18);
    s.add("rice", [9, 9]);
    s.setPortion(usePlate.getState().items[0].instanceId, 300);
    let item = usePlate.getState().items[0];
    expect(Math.hypot(...item.position)).toBeCloseTo(
      placementRadius(18, item, 100),
    );
    s.move(item.instanceId, [9, -9]);
    item = usePlate.getState().items[0];
    expect(Math.hypot(...item.position)).toBeCloseTo(
      placementRadius(18, item, 100),
    );
    s.add("broccoli");
    s.setPortion(
      usePlate.getState().items[1].instanceId,
      foodById.broccoli.maxPortionGrams,
    );
    expect(usePlate.getState().items[1].position).toEqual([0, 0]);
  });
  it("bounds custom diameters, rejects nonfinite input, and retains size when clearing", () => {
    const s = usePlate.getState();
    s.setPlateDiameter(999);
    expect(usePlate.getState().plateDiameterCm).toBe(36);
    s.setPlateDiameter(NaN);
    expect(usePlate.getState().plateDiameterCm).toBe(36);
    s.setPlateDiameter(10);
    expect(usePlate.getState().plateDiameterCm).toBe(18);
    s.setPlateDiameter(24.56);
    expect(usePlate.getState().plateDiameterCm).toBe(24.6);
    s.add("egg");
    s.reset();
    expect(usePlate.getState().plateDiameterCm).toBe(24.6);
    s.undo();
    expect(usePlate.getState().items).toHaveLength(1);
    expect(usePlate.getState().plateDiameterCm).toBe(24.6);
  });
});
