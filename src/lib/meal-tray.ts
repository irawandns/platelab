import type { PlateItem } from "../types";
import { CM_PER_UNIT, foodDimensionsCm, portionPieces } from "./scale";

export type PlateType = "ceramic" | "meal-tray";
export const TRAY_LENGTH_CM = 29;
export const TRAY_WIDTH_CM = 23;
export const TRAY_RIM_Y = 0.8;
export const TRAY_SHEET_THICKNESS = 0.04;
export const TRAY_BOTTOM_Y = 0.14;
export const TRAY_FLOOR_Y = 0.18;
export const trayWellProfile: [number, number][] = [
  [0, TRAY_RIM_Y],
  [0.025, TRAY_RIM_Y - 0.025],
  [0.06, 0.6],
  [0.1, 0.3],
  [0.16, TRAY_FLOOR_Y],
];
export interface TrayWell {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  radius: number;
}
const well = (
  id: string,
  x: number,
  z: number,
  width: number,
  depth: number,
  radius: number,
): TrayWell => ({
  id,
  x: x / CM_PER_UNIT,
  z: z / CM_PER_UNIT,
  width: width / CM_PER_UNIT,
  depth: depth / CM_PER_UNIT,
  radius: radius / CM_PER_UNIT,
});
// The supplied photograph establishes the layout. Well footprints are estimates;
// the 29 × 23 cm footprint follows the researched comparable product. The
// shallow pressed-metal profile is estimated from the supplied photograph.
export const trayWells: TrayWell[] = [
  well("large", -5.25, 5.25, 15.5, 9.5, 1.7),
  well("top-center", 0, -5.25, 10, 9.5, 1.9),
  well("round", 8, 5.25, 9.5, 9.5, 4.75),
  well("top-left", -9.5, -5.25, 7, 9.5, 1.7),
  well("top-right", 9.5, -5.25, 7, 9.5, 1.7),
];
export const trayOutline = well("outer", 0, 0, 29, 23, 1.5);

export function insideWell(w: TrayWell, x: number, z: number, inset = 0) {
  const radius = Math.max(0, w.radius - inset);
  const halfX = w.width / 2 - inset;
  const halfZ = w.depth / 2 - inset;
  if (halfX < 0 || halfZ < 0) return false;
  const dx = Math.max(0, Math.abs(x - w.x) - (halfX - radius));
  const dz = Math.max(0, Math.abs(z - w.z) - (halfZ - radius));
  return dx * dx + dz * dz <= radius * radius + 1e-9;
}

export function traySurfaceHeight(x: number, z: number) {
  const w = trayWells.find((w) => insideWell(w, x, z));
  if (!w) return TRAY_RIM_Y;
  const dx = Math.max(0, Math.abs(x - w.x) - (w.width / 2 - w.radius));
  const dz = Math.max(0, Math.abs(z - w.z) - (w.depth / 2 - w.radius));
  const inset = w.radius - Math.hypot(dx, dz);
  for (let i = 1; i < trayWellProfile.length; i++) {
    const [r0, y0] = trayWellProfile[i - 1],
      [r1, y1] = trayWellProfile[i];
    if (inset <= r1) return y0 + ((inset - r0) / (r1 - r0)) * (y1 - y0);
  }
  return TRAY_FLOOR_Y;
}

export function trayFootprint(
  item: PlateItem,
  defaultGrams: number,
): [number, number] {
  const [width, , depth] = foodDimensionsCm[item.foodId];
  const pieces = portionPieces(item.foodId, item.portionGrams / defaultGrams);
  return [
    Math.max(
      ...pieces.map(
        (p) => Math.abs(p.position[0]) + (width * p.scale) / CM_PER_UNIT / 2,
      ),
    ),
    Math.max(
      ...pieces.map(
        (p) => Math.abs(p.position[2]) + (depth * p.scale) / CM_PER_UNIT / 2,
      ),
    ),
  ];
}

export function fitsTrayWell(
  w: TrayWell,
  x: number,
  z: number,
  extent: [number, number],
) {
  return [-1, 1].every((a) =>
    [-1, 1].every((b) =>
      insideWell(w, x + a * extent[0], z + b * extent[1], 0.025),
    ),
  );
}

export function trayPosition(
  position: [number, number],
  item: PlateItem,
  defaultGrams: number,
): [number, number] {
  const [x, z] = position.every(Number.isFinite) ? position : [0, 0];
  const extent = trayFootprint(item, defaultGrams);
  const fitting = trayWells.filter((w) => fitsTrayWell(w, w.x, w.z, extent));
  // Oversized portions remain at their actual size over the largest well.
  if (!fitting.length) return [trayWells[0].x, trayWells[0].z];
  const candidates = fitting.map((w) => {
    let px = Math.max(
      w.x - w.width / 2 + extent[0] + 0.025,
      Math.min(w.x + w.width / 2 - extent[0] - 0.025, x),
    );
    let pz = Math.max(
      w.z - w.depth / 2 + extent[1] + 0.025,
      Math.min(w.z + w.depth / 2 - extent[1] - 0.025, z),
    );
    if (!fitsTrayWell(w, px, pz, extent)) {
      // Project towards the well center to clear rounded corners.
      let low = 0,
        high = 1;
      for (let i = 0; i < 24; i++) {
        const t = (low + high) / 2;
        if (fitsTrayWell(w, w.x + (px - w.x) * t, w.z + (pz - w.z) * t, extent))
          low = t;
        else high = t;
      }
      px = w.x + (px - w.x) * low;
      pz = w.z + (pz - w.z) * low;
    }
    return {
      position: [px, pz] as [number, number],
      distance: Math.hypot(px - x, pz - z),
    };
  });
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0].position;
}

export function trayAddPosition(
  item: PlateItem,
  defaultGrams: number,
  index: number,
): [number, number] {
  const extent = trayFootprint(item, defaultGrams);
  const fitting = trayWells.filter((w) => fitsTrayWell(w, w.x, w.z, extent));
  const target = fitting.length
    ? fitting[index % fitting.length]
    : trayWells[0];
  return [target.x, target.z];
}

export function trayPortionFits(item: PlateItem, defaultGrams: number) {
  const extent = trayFootprint(item, defaultGrams);
  return trayWells.some((w) => fitsTrayWell(w, w.x, w.z, extent));
}

export function traySupportHeight(item: PlateItem, defaultGrams: number) {
  const extent = trayFootprint(item, defaultGrams);
  // Used only while physics starts up. The live simulation sweeps actual hulls.
  return trayWells.some((w) =>
    [-1, 1].every((a) =>
      [-1, 1].every((b) =>
        insideWell(
          w,
          item.position[0] + a * extent[0],
          item.position[1] + b * extent[1],
          0.16,
        ),
      ),
    ),
  )
    ? TRAY_FLOOR_Y + 0.005
    : TRAY_RIM_Y + 0.005;
}
