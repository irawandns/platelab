import {
  BufferGeometry,
  Float32BufferAttribute,
  Path,
  Shape,
  ShapeGeometry,
} from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  TRAY_BOTTOM_Y,
  TRAY_FLOOR_Y,
  TRAY_RIM_Y,
  TRAY_SHEET_THICKNESS,
  trayOutline,
  trayWells,
  trayWellProfile,
  type TrayWell,
} from "./meal-tray";

export function trayContour(w: TrayWell, inset = 0): [number, number][] {
  const r = Math.max(0.005, w.radius - inset);
  const dx = w.width / 2 - inset - r;
  const dz = w.depth / 2 - inset - r;
  const centers = [
    [dx, dz],
    [-dx, dz],
    [-dx, -dz],
    [dx, -dz],
  ];
  return centers.flatMap(([cx, cz], corner) =>
    Array.from({ length: 17 }, (_, i) => {
      const angle = (corner * Math.PI) / 2 + (i * Math.PI) / 32;
      return [
        w.x + cx + Math.cos(angle) * r,
        w.z + cz + Math.sin(angle) * r,
      ] as [number, number];
    }),
  );
}

function path(contour: [number, number][], shape: Shape | Path) {
  contour.forEach(([x, z], i) =>
    i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
  );
  shape.closePath();
  return shape;
}

// One shared triangle surface for the visual model and the Rapier collider.
// The top sheet has real holes; each hole continues into a rounded recessed well.
export function mealTrayGeometry() {
  const positions: number[] = [];
  const triangle = (...points: [number, number, number][]) =>
    points.forEach((p) => positions.push(...p));
  const sheet = (
    contour: [number, number][],
    y: number,
    holes: [number, number][][] = [],
    reverse = false,
  ) => {
    const shape = path(contour, new Shape()) as Shape;
    shape.holes = holes.map((c) => path(c, new Path()));
    const geometry = new ShapeGeometry(shape);
    const points = geometry.attributes.position;
    const indices = geometry.index!;
    for (let i = 0; i < indices.count; i += 3) {
      const face = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
      if (reverse) face.reverse();
      triangle(
        ...face.map(
          (j) =>
            [points.getX(j), y, -points.getY(j)] as [number, number, number],
        ),
      );
    }
    geometry.dispose();
  };
  const ring = (
    outer: [number, number][],
    outerY: number,
    inner: [number, number][],
    innerY: number,
    reverse = false,
  ) => {
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      const a: [number, number, number] = [outer[i][0], outerY, outer[i][1]];
      const b: [number, number, number] = [inner[i][0], innerY, inner[i][1]];
      const c: [number, number, number] = [outer[j][0], outerY, outer[j][1]];
      const d: [number, number, number] = [inner[j][0], innerY, inner[j][1]];
      if (reverse) {
        triangle(c, b, a);
        triangle(c, d, b);
      } else {
        triangle(a, b, c);
        triangle(b, d, c);
      }
    }
  };
  const outer = trayContour(trayOutline);
  const lip = trayContour(trayOutline, 0.045);
  sheet(
    lip,
    TRAY_RIM_Y,
    trayWells.map((w) => trayContour(w)),
  );
  ring(outer, TRAY_RIM_Y - 0.015, lip, TRAY_RIM_Y);
  ring(outer, TRAY_RIM_Y - TRAY_SHEET_THICKNESS, outer, TRAY_RIM_Y - 0.015);
  sheet(
    outer,
    TRAY_RIM_Y - TRAY_SHEET_THICKNESS,
    trayWells.map((w) => trayContour(w)),
    true,
  );
  for (const w of trayWells) {
    const profile = trayWellProfile;
    for (let i = 1; i < profile.length; i++) {
      ring(
        trayContour(w, profile[i - 1][0]),
        profile[i - 1][1],
        trayContour(w, profile[i][0]),
        profile[i][1],
      );
      ring(
        trayContour(w, profile[i - 1][0]),
        profile[i - 1][1] - TRAY_SHEET_THICKNESS,
        trayContour(w, profile[i][0]),
        profile[i][1] - TRAY_SHEET_THICKNESS,
        true,
      );
    }
    sheet(trayContour(w, 0.16), TRAY_FLOOR_Y);
    sheet(trayContour(w, 0.16), TRAY_BOTTOM_Y, [], true);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  const smooth = mergeVertices(geometry, 1e-5);
  smooth.computeVertexNormals();
  const result = smooth.toNonIndexed();
  result.computeBoundingBox();
  geometry.dispose();
  smooth.dispose();
  return result;
}
