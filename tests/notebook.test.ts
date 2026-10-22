import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteExperiment,
  loadNotebook,
  MAX_EXPERIMENTS,
  NOTEBOOK_KEY,
  parseSnapshot,
  saveExperiment,
  savePlate,
  type ExperimentPlates,
  type NotebookStorage,
} from "../src/lib/notebook";
import { comparePlates } from "../src/lib/comparison";
import { registerPoseReader, usePlate, type Snapshot } from "../src/lib/store";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const plate = (foodId = "rice", grams = 100): Snapshot => ({
  plateType: "ceramic",
  plateSkin: "cream",
  plateDiameterCm: 26,
  selectedItemId: "first",
  items: [
    { instanceId: "first", foodId, portionGrams: grams, position: [0, 0] },
  ],
});
const plates = (): ExperimentPlates => ({
  original: plate(),
  current: plate("rice", 200),
});

describe("experiment notebook storage", () => {
  it("reopens both plates from a fresh storage read, preserving foods, oil, forms and poses", () => {
    const storage = memoryStorage();
    const pair = plates();
    pair.original = {
      ...plate("tofu"),
      plateType: "meal-tray",
      plateSkin: "blue",
      plateDiameterCm: 32,
      items: [
        {
          ...plate("tofu").items[0],
          cooking: {
            method: "pan-fry",
            oilId: "olive",
            oil: { grams: 10, basis: "used", retainedPercent: 50 },
          },
          pose: { position: [0.2, 0.5, -0.3], rotation: [0, 0, 0, 1] },
        },
        {
          instanceId: "second",
          foodId: "timun",
          form: "whole",
          portionGrams: 50,
          position: [1, 0],
        },
        {
          instanceId: "third",
          foodId: "tofu",
          portionGrams: 200,
          position: [-1, 0],
        },
      ],
    };
    saveExperiment("  Oil and cucumber  ", pair, storage);
    const reloaded = loadNotebook(storage);
    expect(reloaded[0].title).toBe("Oil and cucumber");
    expect(reloaded[0].plates).toEqual(pair);
    expect(reloaded[0].plates).not.toBe(pair);
    pair.original.items[0].portionGrams = 300;
    expect(
      loadNotebook(storage)[0].plates!.original.items[0].portionGrams,
    ).toBe(100);
    expect(storage.getItem(NOTEBOOK_KEY)).not.toContain("calories");
  });

  it("recalculates nutrition and keeps unknown fiber unknown after reopening", () => {
    const storage = memoryStorage();
    saveExperiment(
      "Tempeh",
      { original: plate("tempeh"), current: plate("broccoli") },
      storage,
    );
    const saved = loadNotebook(storage)[0].plates!;
    expect(
      comparePlates(saved.original.items, saved.current.items)[4],
    ).toMatchObject({ originalIncomplete: true, difference: null });
    expect(
      comparePlates(saved.original.items, saved.current.items)[0].current,
    ).toBe(35);
  });

  it("allows an empty changed plate but requires a nonempty original", () => {
    const storage = memoryStorage();
    const empty = { ...plate(), items: [], selectedItemId: null };
    saveExperiment(
      "Removed rice",
      { original: plate(), current: empty },
      storage,
    );
    expect(loadNotebook(storage)[0].plates?.current.items).toEqual([]);
    expect(() =>
      saveExperiment("Empty", { original: empty, current: plate() }, storage),
    ).toThrow("original");
  });

  it("preserves unsupported experiments alongside new ones and permits explicit deletion", () => {
    const storage = memoryStorage();
    const saved = saveExperiment("Older food", plates(), storage)[0];
    const raw = JSON.parse(storage.getItem(NOTEBOOK_KEY)!);
    raw.entries[0].original.items[0].foodId = "removed-food";
    storage.setItem(NOTEBOOK_KEY, JSON.stringify(raw));
    expect(loadNotebook(storage)[0].plates).toBeNull();
    const latest = saveExperiment("Still supported", plates(), storage);
    expect(latest).toHaveLength(2);
    expect(latest[1]).toMatchObject({ id: saved.id, plates: null });
    expect(JSON.parse(storage.getItem(NOTEBOOK_KEY)!).entries[1]).toEqual(
      raw.entries[0],
    );
    expect(deleteExperiment(saved.id, storage)).toHaveLength(1);
    expect(loadNotebook(storage)[0].title).toBe("Still supported");
  });

  it("leaves corrupt and future-version notebooks untouched", () => {
    for (const text of [
      "{broken",
      JSON.stringify({ version: 2, entries: [] }),
      JSON.stringify({ version: 1, entries: [{ id: "broken" }] }),
    ]) {
      const storage = memoryStorage();
      storage.setItem(NOTEBOOK_KEY, text);
      expect(() => loadNotebook(storage)).toThrow("left untouched");
      expect(() => saveExperiment("New", plates(), storage)).toThrow(
        "left untouched",
      );
      expect(() => deleteExperiment("broken", storage)).toThrow(
        "left untouched",
      );
      expect(storage.getItem(NOTEBOOK_KEY)).toBe(text);
    }
  });

  it("reports blocked reads and failed writes without losing saved experiments", () => {
    const storage = memoryStorage();
    saveExperiment("Keep this", plates(), storage);
    const before = storage.getItem(NOTEBOOK_KEY);
    const blocked: NotebookStorage = {
      ...storage,
      getItem: () => {
        throw new Error("denied");
      },
    };
    expect(() => loadNotebook(blocked)).toThrow("couldn’t be read");
    const full: NotebookStorage = {
      ...storage,
      setItem: () => {
        throw new Error("quota");
      },
    };
    expect(() => saveExperiment("New", plates(), full)).toThrow(
      "couldn’t be saved",
    );
    expect(() => deleteExperiment(loadNotebook(storage)[0].id, full)).toThrow(
      "couldn’t be saved",
    );
    expect(storage.getItem(NOTEBOOK_KEY)).toBe(before);
  });

  it("caps storage and validates titles without evicting earlier discoveries", () => {
    const storage = memoryStorage();
    expect(() => saveExperiment("   ", plates(), storage)).toThrow("name");
    expect(() => saveExperiment("x".repeat(81), plates(), storage)).toThrow(
      "name",
    );
    for (let n = 0; n < MAX_EXPERIMENTS; n++)
      saveExperiment(`Experiment ${n}`, plates(), storage);
    const before = storage.getItem(NOTEBOOK_KEY);
    expect(() => saveExperiment("One more", plates(), storage)).toThrow(
      "make room",
    );
    expect(storage.getItem(NOTEBOOK_KEY)).toBe(before);
    const entries = loadNotebook(storage);
    deleteExperiment(entries[0].id, storage);
    expect(saveExperiment("One more", plates(), storage)).toHaveLength(
      MAX_EXPERIMENTS,
    );
  });

  it("reads the latest stored collection before each change", () => {
    const storage = memoryStorage();
    const firstTab = saveExperiment("First tab", plates(), storage)[0];
    saveExperiment("Second tab", plates(), storage);
    const afterDelete = deleteExperiment(firstTab.id, storage);
    expect(afterDelete.map((entry) => entry.title)).toEqual(["Second tab"]);
  });

  it("rejects malformed snapshots before they can reach calculations or physics", () => {
    const mutations = [
      (p: any) => {
        p.items[0].foodId = "__proto__";
      },
      (p: any) => {
        p.items[0].portionGrams = 99999;
      },
      (p: any) => {
        p.items[0].position = [NaN, 0];
      },
      (p: any) => {
        p.items[0].pose = { position: [0, 0, 0], rotation: [0, 0, 0, 0] };
      },
      (p: any) => {
        p.items.push(p.items[0]);
      },
      (p: any) => {
        p.items = Array.from({ length: 25 }, (_, i) => ({
          ...p.items[0],
          instanceId: String(i),
        }));
      },
      (p: any) => {
        p.items[0].form = "whole";
      },
      (p: any) => {
        p.items[0].cooking = { method: "unknown", oilId: "olive" };
      },
      (p: any) => {
        p.selectedItemId = "missing";
      },
      (p: any) => {
        p.plateSkin = "__proto__";
      },
      (p: any) => {
        p.plateDiameterCm = Infinity;
      },
    ];
    for (const mutate of mutations) {
      const value = plate();
      mutate(value);
      expect(parseSnapshot(value)).toBeNull();
    }
    expect(parseSnapshot(null)).toBeNull();
    const tofu = plate("tofu");
    for (const oil of [
      null,
      { grams: -1, basis: "used", retainedPercent: 50 },
      { grams: 5, basis: "in-serving", retainedPercent: 20 },
    ]) {
      expect(
        parseSnapshot({
          ...tofu,
          items: [
            {
              ...tofu.items[0],
              cooking: { method: "pan-fry", oilId: "olive", oil },
            },
          ],
        }),
      ).toBeNull();
    }
  });
});

describe("opening and capturing saved experiments", () => {
  beforeEach(() => {
    usePlate.setState({
      ...plate(),
      items: [],
      selectedItemId: null,
      history: [],
      comparisonBaseline: null,
      sceneRevision: 0,
      restorePhysics: false,
    });
  });

  it("captures live poses without mutating either side of the comparison", () => {
    expect(usePlate.getState().captureExperiment()).toBeNull();
    usePlate.getState().add("rice");
    usePlate.getState().captureComparison();
    const id = usePlate.getState().items[0].instanceId;
    const pose = {
      position: [0.2, 0.5, -0.3] as [number, number, number],
      rotation: [0, 0, 0, 1] as [number, number, number, number],
    };
    const unregister = registerPoseReader(() => ({ [id]: pose }));
    let captured: ExperimentPlates;
    try {
      captured = usePlate.getState().captureExperiment()!;
    } finally {
      unregister();
    }
    expect(captured.current.items[0].pose).toEqual(pose);
    expect(captured.current.items[0].position).toEqual([0.2, -0.3]);
    pose.position[0] = 99;
    expect(captured.current.items[0].pose!.position[0]).toBe(0.2);
    expect(captured.original).toEqual(usePlate.getState().comparisonBaseline);
  });

  it("undoes opening back to the previous meal AND comparison after further edits", () => {
    usePlate.getState().add("chicken");
    usePlate.getState().captureComparison();
    const id = usePlate.getState().items[0].instanceId;
    usePlate.getState().setPortion(id, 200);
    const previous = usePlate.getState().captureExperiment()!;
    const saved = plates();
    usePlate.getState().openExperiment(saved);
    expect(usePlate.getState().items).toEqual(saved.current.items);
    expect(usePlate.getState().comparisonBaseline).toEqual(saved.original);
    expect(usePlate.getState().restorePhysics).toBe(true);
    usePlate.getState().setPortion("first", 300);
    usePlate.getState().undo();
    expect(usePlate.getState().items[0].portionGrams).toBe(200);
    usePlate.getState().undo();
    expect(usePlate.getState().captureExperiment()).toEqual(previous);
    saved.current.items[0].portionGrams = 25;
    expect(usePlate.getState().items[0].portionGrams).toBe(200);
  });

  it("restores the absence of a previous comparison when undoing an open", () => {
    usePlate.getState().add("broccoli");
    usePlate.getState().openExperiment(plates());
    usePlate.getState().undo();
    expect(usePlate.getState().items[0].foodId).toBe("broccoli");
    expect(usePlate.getState().comparisonBaseline).toBeNull();
  });
});

describe("saving the current plate directly", () => {
  it("saves without capturing a comparison and loads a plate with undo", () => {
    const storage = memoryStorage();
    usePlate.setState({ ...plate(), comparisonBaseline: null, history: [] });
    const current = usePlate.getState().capturePlate();
    savePlate("Rice", current, storage);
    usePlate.getState().add("broccoli");
    const previous = usePlate.getState().capturePlate();
    const saved = loadNotebook(storage)[0].plates!.current;
    usePlate.getState().openPlate(saved);
    expect(usePlate.getState().items).toEqual(current.items);
    expect(usePlate.getState().comparisonBaseline).toBeNull();
    usePlate.getState().undo();
    expect(usePlate.getState().capturePlate()).toEqual(previous);
  });
});
