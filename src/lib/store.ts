import { create } from "zustand";
import { foodById } from "./nutrition";
import type { PlateItem } from "../types";
export const MAX_ITEMS = 24;
// Leave space for the widest model at its largest portion.
export const PLACEMENT_RADIUS = 1.72;
export function clampPosition(x: number, z: number): [number, number] {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return [0, 0];
  const length = Math.hypot(x, z);
  const factor = length > PLACEMENT_RADIUS ? PLACEMENT_RADIUS / length : 1;
  return [x * factor, z * factor];
}
interface Snapshot {
  items: PlateItem[];
  selectedItemId: string | null;
}
interface State extends Snapshot {
  history: Snapshot[];
  announcement: string;
  add: (foodId: string, position?: [number, number]) => void;
  select: (id: string | null) => void;
  setPortion: (id: string, grams: number) => void;
  move: (id: string, position: [number, number], remember?: boolean) => void;
  beginMove: () => void;
  remove: (id: string) => void;
  reset: () => void;
  undo: () => void;
}
const remember = (state: State) => [
  ...state.history.slice(-29),
  { items: state.items, selectedItemId: state.selectedItemId },
];
export const usePlate = create<State>((set) => ({
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
      const angle = n * 2.399963;
      const radius = n === 0 ? 0 : Math.min(1.5, 0.7 + n * 0.065);
      const item: PlateItem = {
        instanceId: crypto.randomUUID(),
        foodId,
        portionGrams: food.defaultPortionGrams,
        position: clampPosition(
          ...(position ?? [Math.cos(angle) * radius, Math.sin(angle) * radius]),
        ),
      };
      return {
        history: remember(state),
        items: [...state.items, item],
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
          i.instanceId === id ? { ...i, portionGrams } : i,
        ),
        announcement: `${food.name} portion updated.`,
      };
    }),
  beginMove: () => set((state) => ({ history: remember(state) })),
  move: (id, position, save = true) =>
    set((state) => ({
      history: save ? remember(state) : state.history,
      items: state.items.map((i) =>
        i.instanceId === id
          ? { ...i, position: clampPosition(...position) }
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
