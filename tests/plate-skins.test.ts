import { beforeEach, describe, expect, it } from "vitest";
import { registerPoseReader, usePlate } from "../src/lib/store";
import { summarize } from "../src/lib/nutrition";
import { DEFAULT_PLATE_SKIN } from "../src/lib/plate-skins";
import type { FoodPose } from "../src/types";

beforeEach(() =>
  usePlate.setState({
    plateDiameterCm: 26,
    plateSkin: DEFAULT_PLATE_SKIN,
    items: [],
    selectedItemId: null,
    history: [],
    sceneRevision: 0,
    restorePhysics: false,
    announcement: "",
  }),
);

describe("plate skins", () => {
  it("changes appearance without changing the meal or restarting physics", () => {
    const actions = usePlate.getState();
    actions.add("rice");
    const before = usePlate.getState();
    actions.setPlateSkin("sage");
    const after = usePlate.getState();
    expect(after.plateSkin).toBe("sage");
    expect(after.items).toBe(before.items);
    expect(after.selectedItemId).toBe(before.selectedItemId);
    expect(after.plateDiameterCm).toBe(before.plateDiameterCm);
    expect(after.sceneRevision).toBe(before.sceneRevision);
    expect(summarize(after.items)).toEqual(summarize(before.items));
    actions.undo();
    expect(usePlate.getState().plateSkin).toBe("cream");
    expect(usePlate.getState().items).toEqual(before.items);
  });

  it("captures live food poses so undoing a skin restores the arrangement", () => {
    const actions = usePlate.getState();
    actions.add("rice");
    const id = usePlate.getState().items[0].instanceId;
    const pose: FoodPose = {
      position: [0.2, 0.4, 0.3],
      rotation: [0, 0, 0, 1],
    };
    const unregister = registerPoseReader(() => ({ [id]: pose }));
    try {
      actions.setPlateSkin("blue");
      actions.undo();
      expect(usePlate.getState().items[0].pose).toEqual(pose);
      expect(usePlate.getState().items[0].position).toEqual([0.2, 0.3]);
    } finally {
      unregister();
    }
  });

  it("retains the selected skin when clearing and across meal undo", () => {
    const actions = usePlate.getState();
    actions.setPlateSkin("blue");
    actions.add("egg");
    actions.reset();
    expect(usePlate.getState().plateSkin).toBe("blue");
    actions.undo();
    expect(usePlate.getState().plateSkin).toBe("blue");
    expect(usePlate.getState().items).toHaveLength(1);
    actions.undo();
    expect(usePlate.getState().plateSkin).toBe("blue");
    expect(usePlate.getState().items).toHaveLength(0);
    actions.undo();
    expect(usePlate.getState().plateSkin).toBe("cream");
  });

  it("does not add undo entries for selecting the current skin", () => {
    const before = usePlate.getState();
    before.setPlateSkin("cream");
    expect(usePlate.getState()).toBe(before);
  });
});
