import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import { mealTrayGeometry } from "../src/lib/tray-geometry";
import {
  fitsTrayWell,
  insideWell,
  trayAddPosition,
  trayFootprint,
  trayOutline,
  trayPosition,
  trayWells,
  TRAY_FLOOR_Y,
  TRAY_RIM_Y,
  traySurfaceHeight,
} from "../src/lib/meal-tray";
import { FoodPhysics, initializePhysics } from "../src/lib/physics";
import { foodById, foods, summarize } from "../src/lib/nutrition";
import { registerPoseReader, usePlate } from "../src/lib/store";
import type { PlateItem } from "../src/types";

beforeAll(initializePhysics);
beforeEach(() =>
  usePlate.setState({
    plateType: "ceramic",
    plateDiameterCm: 26,
    plateSkin: "cream",
    items: [],
    history: [],
    sceneRevision: 0,
    selectedItemId: null,
    restorePhysics: false,
  }),
);
const portion = (
  foodId: string,
  position: [number, number] = [0, 0],
): PlateItem => ({
  instanceId: foodId,
  foodId,
  portionGrams: foodById[foodId].defaultPortionGrams,
  position,
});
function settle(sim: FoodPhysics) {
  for (let i = 0; i < 900 && sim.hasActivity(); i++) sim.step(1 / 60);
  expect(
    sim.hasActivity(),
    JSON.stringify(
      [...sim.entries.values()].map((e) => ({
        id: e.item.foodId,
        pose: sim.pose(e.item.instanceId),
        velocity: e.body.linvel(),
        angular: e.body.angvel(),
      })),
    ),
  ).toBe(false);
}

describe("stainless meal tray", () => {
  it("has five recessed wells, solid separators, and the reference outer dimensions", () => {
    const geometry = mealTrayGeometry();
    const material = new MeshBasicMaterial();
    const mesh = new Mesh(geometry, material);
    const height = (x: number, z: number) =>
      new Raycaster(
        new Vector3(x, 5, z),
        new Vector3(0, -1, 0),
      ).intersectObject(mesh)[0]?.point.y;
    try {
      const bounds = geometry.boundingBox!;
      expect(bounds.max.x - bounds.min.x).toBeCloseTo(29 / 5);
      expect(bounds.max.z - bounds.min.z).toBeCloseTo(23 / 5);
      expect(bounds.max.y - bounds.min.y).toBeCloseTo(3.3 / 5);
      expect(trayWells).toHaveLength(5);
      for (const w of trayWells)
        expect(height(w.x, w.z)).toBeCloseTo(TRAY_FLOOR_Y);
      expect(height(0, 0)).toBeCloseTo(TRAY_RIM_Y);
      expect(height(2.8, 0)).toBeCloseTo(TRAY_RIM_Y);
    } finally {
      geometry.dispose();
      material.dispose();
    }
  });

  it("places fitting food inside rounded wells and retains the actual size of oversized food", () => {
    for (const food of foods) {
      const item = portion(food.id);
      const position = trayPosition([99, -99], item, food.defaultPortionGrams);
      expect(
        trayWells.some((w) =>
          fitsTrayWell(
            w,
            ...position,
            trayFootprint(item, food.defaultPortionGrams),
          ),
        ),
        food.id,
      ).toBe(!["bread", "avocado", "ikan-kembung"].includes(food.id));
      expect(item.portionGrams).toBe(food.defaultPortionGrams);
    }
    const large = { ...portion("broccoli"), portionGrams: 300 };
    expect(
      trayPosition([99, 99], large, foodById.broccoli.defaultPortionGrams),
    ).toEqual([trayWells[0].x, trayWells[0].z]);
    expect(
      trayPosition(
        [NaN, Infinity],
        portion("egg"),
        foodById.egg.defaultPortionGrams,
      ).every(Number.isFinite),
    ).toBe(true);
  });

  it("preserves food, cooking, and live poses across vessel switching and undo", () => {
    const actions = usePlate.getState();
    actions.setPlateDiameter(32);
    actions.setPlateSkin("blue");
    actions.add("chicken");
    const original = usePlate.getState().items[0];
    actions.setCooking(original.instanceId, {
      method: "pan-fry",
      oilId: "palm",
    });
    const pose = {
      position: [0.2, 0.4, 0.3] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    };
    const unregister = registerPoseReader(() => ({
      [original.instanceId]: pose,
    }));
    try {
      const totals = summarize(usePlate.getState().items);
      actions.setPlateType("meal-tray");
      expect(usePlate.getState().items[0].pose).toBeUndefined();
      expect(summarize(usePlate.getState().items)).toEqual(totals);
      expect(usePlate.getState().items[0].cooking).toEqual({
        method: "pan-fry",
        oilId: "palm",
      });
      expect(usePlate.getState().selectedItemId).toBe(original.instanceId);
      actions.undo();
      expect(usePlate.getState().plateType).toBe("ceramic");
      expect(usePlate.getState().plateDiameterCm).toBe(32);
      expect(usePlate.getState().plateSkin).toBe("blue");
      expect(usePlate.getState().items[0].pose).toEqual(pose);
    } finally {
      unregister();
    }
    actions.setPlateType("meal-tray");
    const history = usePlate.getState().history;
    actions.setPlateType("meal-tray");
    expect(usePlate.getState().history).toBe(history);
    actions.reset();
    actions.undo();
    expect(usePlate.getState().plateType).toBe("meal-tray");
    expect(usePlate.getState().items).toHaveLength(1);
  });

  it("settles every regular food on the shared tray surface without sinking through it", () => {
    for (const food of foods) {
      const item = portion(food.id);
      item.position = trayAddPosition(item, food.defaultPortionGrams, 0);
      const sim = new FoodPhysics(26, [item], false, "meal-tray");
      try {
        settle(sim);
        for (const point of sim.bounds(food.id)) {
          if (insideWell(trayOutline, point.x, point.z))
            expect(point.y, food.id).toBeGreaterThan(
              traySurfaceHeight(point.x, point.z) - 0.015,
            );
        }
        expect(sim.pose(food.id)!.position[1]).toBeLessThan(TRAY_RIM_Y);
        expect(sim.entries.get(food.id)!.body.mass()).toBeCloseTo(
          item.portionGrams / 1000,
          6,
        );
      } finally {
        sim.dispose();
      }
    }
  });

  it("supports the corner wells outside the old circle and lifts food over dividers when moved", () => {
    const w = trayWells.find((w) => w.id === "top-right")!;
    const item = { ...portion("cheese", [w.x, w.z]), portionGrams: 10 };
    const sim = new FoodPhysics(18, [item], false, "meal-tray");
    try {
      settle(sim);
      expect(sim.pose("cheese")!.position[0]).toBeCloseTo(w.x, 1);
      const target = trayWells.find((w) => w.id === "round")!;
      sim.beginDrag("cheese");
      sim.dragTo("cheese", target.x, target.z);
      sim.endDrag();
      settle(sim);
      const [x, , z] = sim.pose("cheese")!.position;
      expect(insideWell(target, x, z)).toBe(true);
      expect(insideWell(trayOutline, x, z)).toBe(true);
    } finally {
      sim.dispose();
    }
  });

  it("settles a mixed tray and all maximum portions without losing food or changing nutrition", () => {
    const items = foods.map((food, index) => {
      const item = portion(food.id);
      item.position = trayAddPosition(item, food.defaultPortionGrams, index);
      return item;
    });
    const totals = summarize(items);
    const mixed = new FoodPhysics(26, items, false, "meal-tray");
    try {
      settle(mixed);
      expect(
        summarize(
          items.map((item) => ({ ...item, pose: mixed.pose(item.instanceId) })),
        ),
      ).toEqual(totals);
      for (const item of items) {
        const [x, y, z] = mixed.pose(item.instanceId)!.position;
        expect(insideWell(trayOutline, x, z)).toBe(true);
        expect(y).toBeGreaterThan(0);
      }
    } finally {
      mixed.dispose();
    }
    for (const food of foods) {
      const item = { ...portion(food.id), portionGrams: food.maxPortionGrams };
      item.position = trayAddPosition(item, food.defaultPortionGrams, 0);
      const sim = new FoodPhysics(26, [item], false, "meal-tray");
      try {
        settle(sim);
        expect(sim.pose(food.id)!.position.every(Number.isFinite)).toBe(true);
        expect(sim.pose(food.id)!.position[1]).toBeGreaterThan(0);
        expect(sim.entries.get(food.id)!.body.mass()).toBeCloseTo(
          food.maxPortionGrams / 1000,
          6,
        );
      } finally {
        sim.dispose();
      }
    }
  }, 15000);
});
