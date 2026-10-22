import { foodById } from "./nutrition";
import { MAX_PLATE_CM, MIN_PLATE_CM } from "./scale";
import { normalizeCooking, MAX_OIL_GRAMS } from "./cooking";
import { plateSkins } from "./plate-skins";
import type { Snapshot } from "./store";
import type { CookingSettings, PlateItem } from "../types";

export const NOTEBOOK_KEY = "platelab.experiments.v1";
export const MAX_EXPERIMENTS = 10;
export const MAX_TITLE_LENGTH = 80;
export interface ExperimentPlates {
  original: Snapshot;
  current: Snapshot;
}
export interface NotebookEntry {
  id: string;
  title: string;
  createdAt: string;
  // Unsupported experiments stay listed and can be deleted explicitly.
  plates: ExperimentPlates | null;
}
interface StoredEntry {
  id: string;
  title: string;
  createdAt: string;
  original: unknown;
  current: unknown;
}
export type NotebookStorage = Pick<Storage, "getItem" | "setItem">;
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const vector = (value: unknown, size: number): value is number[] =>
  Array.isArray(value) &&
  value.length === size &&
  value.every((n) => finite(n) && Math.abs(n) <= 1000);

export function parseSnapshot(value: unknown): Snapshot | null {
  if (
    !record(value) ||
    !["ceramic", "meal-tray"].includes(String(value.plateType)) ||
    typeof value.plateSkin !== "string" ||
    !Object.hasOwn(plateSkins, value.plateSkin) ||
    !finite(value.plateDiameterCm) ||
    value.plateDiameterCm < MIN_PLATE_CM ||
    value.plateDiameterCm > MAX_PLATE_CM ||
    !Array.isArray(value.items) ||
    value.items.length > 24
  )
    return null;
  const items: PlateItem[] = [];
  const ids = new Set<string>();
  for (const raw of value.items) {
    if (
      !record(raw) ||
      typeof raw.instanceId !== "string" ||
      !raw.instanceId ||
      raw.instanceId.length > 100 ||
      ids.has(raw.instanceId) ||
      typeof raw.foodId !== "string" ||
      !Object.hasOwn(foodById, raw.foodId) ||
      !finite(raw.portionGrams) ||
      !vector(raw.position, 2)
    )
      return null;
    const food = foodById[raw.foodId];
    if (
      raw.portionGrams < food.minPortionGrams ||
      raw.portionGrams > food.maxPortionGrams
    )
      return null;
    const item: PlateItem = {
      instanceId: raw.instanceId,
      foodId: raw.foodId,
      portionGrams: raw.portionGrams,
      position: [...raw.position] as [number, number],
    };
    if (raw.pose !== undefined) {
      if (
        !record(raw.pose) ||
        !vector(raw.pose.position, 3) ||
        !vector(raw.pose.rotation, 4) ||
        Math.abs(Math.hypot(...raw.pose.rotation) - 1) > 0.001
      )
        return null;
      item.pose = {
        position: [...raw.pose.position] as [number, number, number],
        rotation: [...raw.pose.rotation] as [number, number, number, number],
      };
    }
    if (raw.form !== undefined) {
      if (
        raw.foodId !== "timun" ||
        (raw.form !== "sliced" && raw.form !== "whole")
      )
        return null;
      item.form = raw.form;
    }
    if (raw.cooking !== undefined) {
      if (!record(raw.cooking)) return null;
      const oil = raw.cooking.oil;
      if (
        oil !== undefined &&
        (!record(oil) ||
          !finite(oil.grams) ||
          oil.grams < 0 ||
          oil.grams > MAX_OIL_GRAMS ||
          !finite(oil.retainedPercent) ||
          oil.retainedPercent < 0 ||
          oil.retainedPercent > 100 ||
          (oil.basis === "in-serving" && oil.retainedPercent !== 100))
      )
        return null;
      const cooking = normalizeCooking(
        raw.foodId,
        raw.cooking as unknown as CookingSettings,
      );
      if (!cooking) return null;
      item.cooking = cooking;
    }
    ids.add(item.instanceId);
    items.push(item);
  }
  if (
    value.selectedItemId !== null &&
    (typeof value.selectedItemId !== "string" || !ids.has(value.selectedItemId))
  )
    return null;
  return {
    plateType: value.plateType as Snapshot["plateType"],
    plateSkin: value.plateSkin as Snapshot["plateSkin"],
    plateDiameterCm: value.plateDiameterCm,
    selectedItemId: value.selectedItemId,
    items,
  };
}

function browserStorage(): NotebookStorage {
  try {
    return window.localStorage;
  } catch {
    throw new Error(
      "Saved plates are unavailable. Allow storage for this site and try again.",
    );
  }
}
function readEntries(storage: NotebookStorage): StoredEntry[] {
  let text: string | null;
  try {
    text = storage.getItem(NOTEBOOK_KEY);
  } catch {
    throw new Error(
      "Saved plates couldn’t be read. Please try again. Your current plate is safe.",
    );
  }
  if (text === null) return [];
  const unreadable = () =>
    new Error(
      "Saved plates couldn’t be read. Your saved data has been left untouched.",
    );
  let document: unknown;
  try {
    if (text.length > 1_000_000) throw unreadable();
    document = JSON.parse(text);
  } catch {
    throw unreadable();
  }
  if (
    !record(document) ||
    document.version !== 1 ||
    !Array.isArray(document.entries) ||
    document.entries.length > MAX_EXPERIMENTS
  )
    throw unreadable();
  const ids = new Set<string>();
  for (const entry of document.entries) {
    if (
      !record(entry) ||
      typeof entry.id !== "string" ||
      !entry.id ||
      entry.id.length > 100 ||
      ids.has(entry.id) ||
      typeof entry.title !== "string" ||
      !entry.title.trim() ||
      entry.title.length > MAX_TITLE_LENGTH ||
      typeof entry.createdAt !== "string" ||
      !Number.isFinite(Date.parse(entry.createdAt))
    )
      throw unreadable();
    ids.add(entry.id);
  }
  return document.entries as StoredEntry[];
}
function viewEntries(entries: StoredEntry[]): NotebookEntry[] {
  return entries.map((entry) => {
    const original = parseSnapshot(entry.original);
    const current = parseSnapshot(entry.current);
    return {
      id: entry.id,
      title: entry.title,
      createdAt: entry.createdAt,
      plates:
        original && original.items.length && current
          ? { original, current }
          : null,
    };
  });
}
function writeEntries(storage: NotebookStorage, entries: StoredEntry[]) {
  try {
    storage.setItem(NOTEBOOK_KEY, JSON.stringify({ version: 1, entries }));
  } catch {
    throw new Error(
      "Changes couldn’t be saved. Storage may be full or blocked. Your plates are safe.",
    );
  }
}
export function loadNotebook(storage = browserStorage()): NotebookEntry[] {
  return viewEntries(readEntries(storage));
}
export function saveExperiment(
  title: string,
  plates: ExperimentPlates,
  storage = browserStorage(),
): NotebookEntry[] {
  title = title.trim();
  if (!title || title.length > MAX_TITLE_LENGTH)
    throw new Error("Enter a plate name (up to 80 characters).");
  const original = parseSnapshot(plates.original);
  const current = parseSnapshot(plates.current);
  if (!original?.items.length || !current)
    throw new Error("Capture a valid original plate before saving.");
  const entries = readEntries(storage);
  if (entries.length >= MAX_EXPERIMENTS)
    throw new Error("You have 10 saved plates. Delete one to make room.");
  entries.unshift({
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    original,
    current,
  });
  writeEntries(storage, entries);
  return viewEntries(entries);
}
export function deleteExperiment(
  id: string,
  storage = browserStorage(),
): NotebookEntry[] {
  const entries = readEntries(storage).filter((entry) => entry.id !== id);
  writeEntries(storage, entries);
  return viewEntries(entries);
}

// Keep the existing storage format so previously saved experiments remain available.
export function savePlate(
  title: string,
  plate: Snapshot,
  storage = browserStorage(),
) {
  return saveExperiment(title, { original: plate, current: plate }, storage);
}
