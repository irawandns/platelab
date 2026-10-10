import { create } from "zustand";
import { foodById } from "./nutrition";
import type { PlateItem } from "../types";
import {
  DEFAULT_PLATE_CM,
  MIN_PLATE_CM,
  MAX_PLATE_CM,
  placementRadius,
} from "./scale";
export const MAX_ITEMS = 24;
export function clampPosition(
  x: number,
  z: number,
  radius = placementRadius(DEFAULT_PLATE_CM),
): [number, number] {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return [0, 0];
  if (radius <= 0) return [0, 0];
  const length = Math.hypot(x, z);
  const factor = length > radius ? radius / length : 1;
  return [x * factor, z * factor];
}
interface Snapshot {
  plateDiameterCm: number;
  items: PlateItem[];
  selectedItemId: string | null;
}
interface State extends Snapshot {
  history: Snapshot[];
  announcement: string;
  add: (foodId: string, position?: [number, number]) => void;
  select: (id: string | null) => void;
  setPortion: (id: string, grams: number) => void;
  setPlateDiameter: (cm: number) => void;
  move: (id: string, position: [number, number], remember?: boolean) => void;
  beginMove: () => void;
  remove: (id: string) => void;
  reset: () => void;
  undo: () => void;
}
const remember = (state: State) => [
  ...state.history.slice(-29),
  {
    items: state.items,
    selectedItemId: state.selectedItemId,
    plateDiameterCm: state.plateDiameterCm,
  },
];
const fitItem = (item: PlateItem, diameterCm: number): PlateItem => ({
  ...item,
  position: clampPosition(
    ...item.position,
    placementRadius(
      diameterCm,
      item,
      foodById[item.foodId].defaultPortionGrams,
    ),
  ),
});
export const usePlate = create<State>((set) => ({
  plateDiameterCm: DEFAULT_PLATE_CM,
  items: [],
  selectedItemId: null,
  history: [],
  announcement: "",
  add: (foodId, position) =>
    set((state) => {
      const food = foodById[foodId];
      if (!food) return state;
      if (state.items.length >= MAX_ITEMS)
        return {
          announcement:
            "Your plate has 24 items. Remove one to make room for another.",
        };
      const n = state.items.length;
      const item: PlateItem = {
        instanceId: crypto.randomUUID(),
        foodId,
        portionGrams: food.defaultPortionGrams,
        position: position ?? [0, 0],
      };
      if (!position) {
        // Spread click-added portions around the eating area at their physical size.
        const angle = Math.PI / 2 + n * 2.399963;
        const radius =
          placementRadius(
            state.plateDiameterCm,
            item,
            food.defaultPortionGrams,
          ) * 0.93;
        item.position = [Math.cos(angle) * radius, Math.sin(angle) * radius];
      }
      return {
        history: remember(state),
        items: [...state.items, fitItem(item, state.plateDiameterCm)],
        selectedItemId: item.instanceId,
        announcement: `${food.name} added to your plate.`,
      };
    }),
  select: (id) => set({ selectedItemId: id }),
  setPortion: (id, grams) =>
    set((state) => {
      const item = state.items.find((i) => i.instanceId === id);
      if (!item || !Number.isFinite(grams)) return state;
      const food = foodById[item.foodId];
      const portionGrams = Math.min(
        food.maxPortionGrams,
        Math.max(food.minPortionGrams, grams),
      );
      if (Math.abs(portionGrams - item.portionGrams) < 1e-8) return state;
      return {
        history: remember(state),
        items: state.items.map((i) =>
          i.instanceId === id
            ? fitItem({ ...i, portionGrams }, state.plateDiameterCm)
            : i,
        ),
        announcement: `${food.name} portion updated.`,
      };
    }),
  setPlateDiameter: (cm) =>
    set((state) => {
      if (!Number.isFinite(cm)) return state;
      const plateDiameterCm =
        Math.round(Math.min(MAX_PLATE_CM, Math.max(MIN_PLATE_CM, cm)) * 10) /
        10;
      if (plateDiameterCm === state.plateDiameterCm) return state;
      return {
        history: remember(state),
        plateDiameterCm,
        items: state.items.map((item) => fitItem(item, plateDiameterCm)),
        announcement: `Plate diameter changed to ${plateDiameterCm} centimetres. Food portions stay the same.`,
      };
    }),
  beginMove: () => set((state) => ({ history: remember(state) })),
  move: (id, position, save = true) =>
    set((state) => ({
      history: save ? remember(state) : state.history,
      items: state.items.map((i) =>
        i.instanceId === id
          ? fitItem({ ...i, position }, state.plateDiameterCm)
          : i,
      ),
    })),
  remove: (id) =>
    set((state) => ({
      history: remember(state),
      items: state.items.filter((i) => i.instanceId !== id),
      selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
      announcement: "Food removed. Undo is available.",
    })),
  reset: () =>
    set((state) =>
      state.items.length
        ? {
            history: remember(state),
            items: [],
            selectedItemId: null,
            announcement: "Plate cleared. Undo is available.",
          }
        : state,
    ),
  undo: () =>
    set((state) => {
      const previous = state.history.at(-1);
      return previous
        ? {
            ...previous,
            history: state.history.slice(0, -1),
            announcement: "Last change undone.",
          }
        : state;
    }),
}));
