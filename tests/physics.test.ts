import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FoodPhysics, initializePhysics } from "../src/lib/physics";
import { foodById, foods, summarize } from "../src/lib/nutrition";
import { registerPoseReader, usePlate } from "../src/lib/store";
import {
  foodCollisionHulls,
  foodPartGeometry,
  foodPartTransforms,
  physicsFoodParts,
} from "../src/lib/food-shapes";
import { Box3, Euler, Matrix4, Quaternion, Vector3 } from "three";
import {
  CM_PER_UNIT,
  foodDimensionsCm,
  placementRadius,
  plateRadius,
  plateSurfaceHeight,
  PLATE_SURFACE_Y,
  portionPieces,
} from "../src/lib/scale";
import type { PlateItem } from "../src/types";

beforeAll(async () => {
  await initializePhysics();
});
beforeEach(() =>
  usePlate.setState({
    items: [],
    plateType: "ceramic",
    history: [],
    plateDiameterCm: 26,
    selectedItemId: null,
    sceneRevision: 0,
    restorePhysics: false,
  }),
);
const item = (
  foodId: string,
  position: [number, number] = [0, 0],
  id = foodId,
): PlateItem => ({
  instanceId: id,
  foodId,
  position,
  portionGrams: foodById[foodId].defaultPortionGrams,
});
function settle(simulation: FoodPhysics) {
  for (let i = 0; i < 900 && simulation.hasActivity(); i++)
    simulation.step(1 / 60);
  expect(
    simulation.hasActivity(),
    `Still moving on ${simulation.diameterCm} cm plate: ${[
      ...simulation.entries.values(),
    ]
      .filter(({ body }) => !body.isSleeping())
      .map(({ item }) => item.foodId)
      .join(", ")}`,
  ).toBe(false);
}
function clearOfPlate(simulation: FoodPhysics, id: string) {
  const points = simulation.bounds(id);
  for (const point of points) {
    if (Math.hypot(point.x, point.z) <= plateRadius(simulation.diameterCm)) {
      // Allow the solver's sub-millimetre contact tolerance.
      expect(
        point.y,
        `${simulation.entries.get(id)!.item.foodId} vertex ${point.toArray()}`,
      ).toBeGreaterThan(
        plateSurfaceHeight(
          simulation.diameterCm,
          Math.hypot(point.x, point.z),
        ) - 0.015,
      );
    }
  }
}

describe("controlled food physics", () => {
  it.each(["broccoli", "timun", "timun-whole", "kerupuk", "ikan-kembung"])(
    "keeps %s render vertices aligned with its collision hulls across portions",
    (id) => {
      const geometries = physicsFoodParts[id].map((part, index) =>
        foodPartGeometry(part).applyMatrix4(foodPartTransforms(id)[index]),
      );
      try {
        for (const ratio of [0.25, 1, 2, 3]) {
          const rendered = new Box3();
          for (const piece of portionPieces(id, ratio)) {
            const matrix = new Matrix4().compose(
              new Vector3(...piece.position),
              new Quaternion().setFromEuler(
                new Euler(0, piece.rotationY ?? 0, 0),
              ),
              new Vector3().setScalar(piece.scale),
            );
            for (const geometry of geometries) {
              const vertices = geometry.getAttribute("position");
              for (let index = 0; index < vertices.count; index++)
                rendered.expandByPoint(
                  new Vector3()
                    .fromBufferAttribute(vertices, index)
                    .applyMatrix4(matrix),
                );
            }
          }
          const collisions = new Box3();
          for (const hull of foodCollisionHulls(id, ratio))
            for (let index = 0; index < hull.length; index += 3)
              collisions.expandByPoint(new Vector3().fromArray(hull, index));
          for (const axis of ["x", "y", "z"] as const) {
            expect(rendered.min[axis]).toBeCloseTo(collisions.min[axis], 5);
            expect(rendered.max[axis]).toBeCloseTo(collisions.max[axis], 5);
          }
        }
      } finally {
        geometries.forEach((geometry) => geometry.dispose());
      }
    },
  );
  it("settles both timun forms at minimum and maximum portions on each vessel", () => {
    for (const plateType of ["ceramic", "meal-tray"] as const)
      for (const form of ["sliced", "whole"] as const)
        for (const grams of [12.5, 50, 150]) {
          usePlate.setState({ items: [], history: [], plateType });
          usePlate.getState().add("timun");
          const id = usePlate.getState().items[0].instanceId;
          usePlate.getState().setForm(id, form);
          usePlate.getState().setPortion(id, grams);
          const simulation = new FoodPhysics(
            26,
            usePlate.getState().items,
            false,
            plateType,
          );
          try {
            settle(simulation);
            expect(simulation.entries.get(id)!.body.mass()).toBeCloseTo(
              grams / 1000,
              6,
            );
            if (plateType === "ceramic") clearOfPlate(simulation, id);
          } finally {
            simulation.dispose();
          }
        }
  });
  it("settles the Indonesian meal when foods are added one at a time with live poses", () => {
    usePlate.setState({ plateType: "ceramic" });
    let simulation: FoodPhysics | undefined;
    const unregister = registerPoseReader(() => simulation?.poses() ?? {});
    try {
      for (const id of ["timun", "kerupuk", "ikan-kembung", "bakwan-sayur"]) {
        usePlate.getState().add(id);
        const items = usePlate.getState().items;
        simulation?.dispose();
        simulation = new FoodPhysics(26, items);
        settle(simulation);
        for (const food of items) clearOfPlate(simulation, food.instanceId);
        usePlate.getState().commitPoses(simulation.poses());
      }
    } finally {
      unregister();
      simulation?.dispose();
    }
  });
  it("settles every intermediate arrangement while adding the expanded food collection", () => {
    let simulation: FoodPhysics | undefined;
    const unregister = registerPoseReader(() => simulation?.poses() ?? {});
    try {
      for (const id of [
        "potato",
        "sweet-potato",
        "corn",
        "peas",
        "green-beans",
        "tomato",
        "orange",
        "strawberry",
      ]) {
        usePlate.getState().add(id);
        const items = usePlate.getState().items;
        simulation?.dispose();
        simulation = new FoodPhysics(26, items);
        settle(simulation);
        for (const food of items) clearOfPlate(simulation, food.instanceId);
        usePlate.getState().commitPoses(simulation.poses());
      }
    } finally {
      unregister();
      simulation?.dispose();
    }
  });
  it("lets a demand render loop stop on the frame that finishes settling", () => {
    const simulation = new FoodPhysics(26, [item("rice")]);
    try {
      let requestFrame = true;
      let frames = 0;
      while (requestFrame && frames < 900) {
        requestFrame = simulation.step(1 / 60);
        frames++;
      }
      expect(frames).toBeGreaterThan(1);
      expect(requestFrame).toBe(false);
      expect(simulation.hasActivity()).toBe(false);
      expect(simulation.pose("rice")!.position[1]).toBeCloseTo(
        PLATE_SURFACE_Y,
        1,
      );
      clearOfPlate(simulation, "rice");
    } finally {
      simulation.dispose();
    }
  });
  it("uses the same calibrated food dimensions for convex collision shapes", () => {
    for (const id of foods.map((food) => food.id))
      for (const ratio of [0.25, 1, 3]) {
        const hulls = foodCollisionHulls(id, ratio);
        const coordinates = hulls.flatMap((hull) =>
          Array.from({ length: hull.length / 3 }, (_, i) => [
            hull[i * 3],
            hull[i * 3 + 1],
            hull[i * 3 + 2],
          ]),
        );
        for (let axis = 0; axis < 3; axis++) {
          const values = coordinates.map((p) => p[axis]);
          const pieces = portionPieces(id, ratio);
          const dimension = foodDimensionsCm[id][axis] / CM_PER_UNIT;
          const minimum = Math.min(
            ...pieces.map(
              (piece) =>
                piece.position[axis] +
                (axis === 1 ? 0 : (-dimension / 2) * piece.scale),
            ),
          );
          const maximum = Math.max(
            ...pieces.map(
              (piece) =>
                piece.position[axis] +
                dimension * (axis === 1 ? 1 : 0.5) * piece.scale,
            ),
          );
          // Cheese's flat surface markings are excluded from contact geometry.
          expect(
            Math.abs(
              Math.max(...values) - Math.min(...values) - (maximum - minimum),
            ),
          ).toBeLessThan(id === "cheese" ? 0.02 : 0.00001);
        }
        expect(Math.min(...coordinates.map((p) => p[1]))).toBeCloseTo(0);
        expect(hulls).toHaveLength(
          (id === "tofu" ? 3 : 1) * portionPieces(id, ratio).length,
        );
      }
  });
  it("settles onto the hollow plate and curved shoulder without floating at rim height", () => {
    for (const diameter of [18, 21, 26, 36])
      for (const id of foods.map((food) => food.id)) {
        const food = item(id);
        food.position = [
          placementRadius(diameter, food, food.portionGrams) * 0.95,
          0,
        ];
        const simulation = new FoodPhysics(diameter, [food]);
        try {
          settle(simulation);
          clearOfPlate(simulation, id);
          // A tilted body's local origin can rise; its actual geometry must
          // remain supported on the plate rather than hover above the rim.
          expect(
            Math.min(...simulation.bounds(id).map((point) => point.y)),
          ).toBeLessThan(0.62);
          expect(simulation.entries.get(id)!.body.mass()).toBeCloseTo(
            food.portionGrams / 1000,
            6,
          );
        } finally {
          simulation.dispose();
        }
      }
    const simulation = new FoodPhysics(26, [item("rice")]);
    try {
      settle(simulation);
      expect(simulation.pose("rice")!.position[1]).toBeCloseTo(
        PLATE_SURFACE_Y,
        1,
      );
    } finally {
      simulation.dispose();
    }
  }, 15000);
  it("settles all foods at minimum and maximum portions with the correct compound mass", () => {
    for (const food of foods)
      for (const grams of [food.minPortionGrams, food.maxPortionGrams]) {
        const portion = { ...item(food.id), portionGrams: grams };
        const simulation = new FoodPhysics(26, [portion]);
        try {
          settle(simulation);
          clearOfPlate(simulation, food.id);
          expect(simulation.entries.get(food.id)!.body.mass()).toBeCloseTo(
            grams / 1000,
            6,
          );
          expect(simulation.poses()[food.id]).toBeDefined();
          const body = simulation.entries.get(food.id)!.body;
          if (food.countable) {
            expect(body.numColliders()).toBe(
              portionPieces(food.id, grams / food.defaultPortionGrams).length,
            );
          }
        } finally {
          simulation.dispose();
        }
      }
  });
  it("stacks cheese on bread, releases it after removing the bread, and restores both poses", () => {
    const bread = item("bread"),
      cheese = item("cheese");
    let simulation = new FoodPhysics(26, [bread, cheese]);
    try {
      settle(simulation);
      const original = simulation.poses();
      expect(original.cheese.position[1]).toBeGreaterThan(
        original.bread.position[1] + 0.1,
      );
      const nutrition = summarize([bread, cheese]);
      simulation.dispose();
      simulation = new FoodPhysics(26, [{ ...cheese, pose: original.cheese }]);
      settle(simulation);
      expect(simulation.pose("cheese")!.position[1]).toBeLessThan(
        original.cheese.position[1] - 0.08,
      );
      simulation.dispose();
      simulation = new FoodPhysics(
        26,
        [bread, cheese].map((food) => ({
          ...food,
          pose: original[food.instanceId],
        })),
        true,
      );
      expect(simulation.hasActivity()).toBe(false);
      expect(simulation.poses()).toEqual(original);
      expect(summarize([bread, cheese])).toEqual(nutrition);
    } finally {
      simulation.dispose();
    }
  });
  it.each([false, true])(
    "settles a mixed plate containing every available food (extra rice: %s)",
    (extraRice) => {
      for (const food of foods) usePlate.getState().add(food.id);
      if (extraRice) usePlate.getState().add("rice");
      const items = usePlate.getState().items;
      const nutrition = summarize(items);
      const simulation = new FoodPhysics(26, items);
      try {
        settle(simulation);
        expect(Object.keys(simulation.poses())).toHaveLength(
          foods.length + Number(extraRice),
        );
        for (const food of items) {
          clearOfPlate(simulation, food.instanceId);
          expect(
            simulation.pose(food.instanceId)!.position.every(Number.isFinite),
          ).toBe(true);
        }
        const bodies = [...simulation.entries.values()].map(
          (entry) => entry.body,
        );
        for (let a = 0; a < bodies.length; a++)
          for (let b = a + 1; b < bodies.length; b++)
            for (let i = 0; i < bodies[a].numColliders(); i++)
              for (let j = 0; j < bodies[b].numColliders(); j++) {
                const contact = bodies[a]
                  .collider(i)
                  .contactCollider(bodies[b].collider(j), 0.02);
                if (contact) expect(contact.distance).toBeGreaterThan(-0.015);
              }
        expect(
          summarize(
            items.map((food) => ({
              ...food,
              pose: simulation.pose(food.instanceId),
            })),
          ),
        ).toEqual(nutrition);
      } finally {
        simulation.dispose();
      }
    },
    // The full 23/24-food simulation can exceed Vitest's default five-second
    // wall-clock budget on CI. settle() still enforces its 900-step limit.
    15000,
  );
  it("stacks three tofu portions and drops upper food after its support is removed", () => {
    let simulation = new FoodPhysics(26, [
      item("tofu", [0, 0], "base"),
      item("tofu", [0, 0], "middle"),
      item("tofu", [0, 0], "top"),
    ]);
    try {
      settle(simulation);
      const base = simulation.pose("base")!,
        middle = simulation.pose("middle")!,
        top = simulation.pose("top")!;
      expect(middle.position[1]).toBeGreaterThan(base.position[1] + 0.3);
      expect(top.position[1]).toBeGreaterThan(middle.position[1] + 0.3);
      for (const id of ["base", "middle", "top"]) clearOfPlate(simulation, id);
      const survivor = {
        ...item("tofu", [top.position[0], top.position[2]], "top"),
        pose: top,
      };
      simulation.dispose();
      simulation = new FoodPhysics(26, [survivor]);
      settle(simulation);
      expect(simulation.pose("top")!.position[1]).toBeLessThan(
        top.position[1] - 0.5,
      );
    } finally {
      simulation.dispose();
    }
  });
  it("lifts dragged chicken over rice, settles it and preserves nutrition", () => {
    const foods = [item("rice"), item("chicken", [1.2, 0])];
    const nutrition = summarize(foods);
    const simulation = new FoodPhysics(26, foods);
    try {
      settle(simulation);
      const supportBefore = simulation.pose("rice")!.position;
      simulation.beginDrag("chicken");
      simulation.dragTo("chicken", 0, 0);
      simulation.step(1 / 60);
      const supportAfter = simulation.pose("rice")!.position;
      expect(
        Math.hypot(
          ...supportAfter.map((value, axis) => value - supportBefore[axis]),
        ),
      ).toBeLessThan(0.01);
      const lifted = simulation.pose("chicken")!.position[1];
      expect(lifted).toBeGreaterThan(
        simulation.pose("rice")!.position[1] + 0.2,
      );
      simulation.endDrag();
      settle(simulation);
      clearOfPlate(simulation, "chicken");
      expect(simulation.pose("chicken")!.position[1]).toBeGreaterThan(
        simulation.pose("rice")!.position[1] + 0.2,
      );
      const chicken = simulation.entries.get("chicken")!.body;
      const rice = simulation.entries.get("rice")!.body;
      const contact = chicken
        .collider(0)
        .contactCollider(rice.collider(0), 0.02);
      expect(contact).not.toBeNull();
      expect(contact!.distance).toBeGreaterThan(-0.015);
      expect(
        summarize(
          foods.map((i) => ({ ...i, pose: simulation.pose(i.instanceId) })),
        ),
      ).toEqual(nutrition);
    } finally {
      simulation.dispose();
    }
  });
  it("captures live positions for undo, restores exact poses, and resettles portion edits", () => {
    const s = usePlate.getState();
    s.add("rice", [0, 0]);
    s.add("chicken", [0, 0]);
    s.add("tofu", [0.8, 0]);
    let simulation = new FoodPhysics(26, usePlate.getState().items);
    let unregister = registerPoseReader(() => simulation.poses());
    try {
      settle(simulation);
      const original = simulation.poses();
      const selected = usePlate.getState().items[1];
      s.setPortion(selected.instanceId, 200);
      expect(usePlate.getState().history.at(-1)!.items[1].pose).toEqual(
        original[selected.instanceId],
      );
      unregister();
      simulation.dispose();
      simulation = new FoodPhysics(26, usePlate.getState().items);
      unregister = registerPoseReader(() => simulation.poses());
      settle(simulation);
      s.undo();
      expect(usePlate.getState().items[1].portionGrams).toBe(100);
      unregister();
      simulation.dispose();
      simulation = new FoodPhysics(26, usePlate.getState().items, true);
      unregister = registerPoseReader(() => simulation.poses());
      expect(simulation.hasActivity()).toBe(false);
      simulation.step(1 / 60);
      for (const [id, pose] of Object.entries(original)) {
        simulation
          .pose(id)!
          .position.forEach((value, axis) =>
            expect(value).toBeCloseTo(pose.position[axis], 6),
          );
        simulation
          .pose(id)!
          .rotation.forEach((value, axis) =>
            expect(value).toBeCloseTo(pose.rotation[axis], 6),
          );
      }
      s.remove(selected.instanceId);
      expect(usePlate.getState().items).toHaveLength(2);
      s.undo();
      expect(usePlate.getState().items[1].pose).toEqual(
        original[selected.instanceId],
      );
      s.reset();
      s.undo();
      expect(usePlate.getState().items[1].pose).toEqual(
        original[selected.instanceId],
      );
    } finally {
      unregister();
      simulation.dispose();
    }
  });
  it("rebuilds the curved surface on resize and preserves food grams and undo poses", () => {
    const s = usePlate.getState();
    s.add("rice", [1.2, 0]);
    s.add("chicken", [-1, 0]);
    s.add("tofu", [0, 0.8]);
    let simulation = new FoodPhysics(26, usePlate.getState().items);
    let unregister = registerPoseReader(() => simulation.poses());
    try {
      settle(simulation);
      const original = simulation.poses();
      const nutrition = summarize(usePlate.getState().items);
      s.setPlateDiameter(18);
      unregister();
      simulation.dispose();
      simulation = new FoodPhysics(18, usePlate.getState().items);
      unregister = registerPoseReader(() => simulation.poses());
      settle(simulation);
      for (const food of usePlate.getState().items)
        clearOfPlate(simulation, food.instanceId);
      expect(summarize(usePlate.getState().items)).toEqual(nutrition);
      s.undo();
      expect(usePlate.getState().plateDiameterCm).toBe(26);
      for (const food of usePlate.getState().items)
        expect(food.pose).toEqual(original[food.instanceId]);
    } finally {
      unregister();
      simulation.dispose();
    }
  });
});
