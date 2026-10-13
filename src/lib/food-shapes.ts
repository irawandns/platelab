import {
  Box3,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  Euler,
  IcosahedronGeometry,
  Matrix4,
  Quaternion,
  TorusGeometry,
  Vector3,
} from "three";
import { CM_PER_UNIT, foodDimensionsCm, portionPieces } from "./scale";

export interface FoodPart {
  kind: "facet" | "box" | "torus" | "cylinder" | "circle";
  args?: number[];
  parent?: {
    position: [number, number, number];
    rotation: [number, number, number];
  };
  collisionGroup?: number;
  decorative?: boolean;
  color: string;
  position: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
}
// Shared definitions keep collision hulls and visible models in the same scale.
export const physicsFoodParts: Record<string, FoodPart[]> = {
  timun: [
    {
      kind: "cylinder",
      args: [0.36, 0.36, 0.1, 12],
      color: "#477747",
      position: [0, 0.05, 0],
      scale: [1, 1, 1],
    },
    {
      kind: "cylinder",
      args: [0.32, 0.32, 0.024, 12],
      color: "#dce6ad",
      position: [0, 0.104, 0],
      scale: [1, 1, 1],
    },
    ...Array.from({ length: 3 }, (_, i): FoodPart => ({
      kind: "facet",
      color: "#f3eed0",
      position: [
        Math.cos((i * Math.PI * 2) / 3) * 0.12,
        0.11,
        Math.sin((i * Math.PI * 2) / 3) * 0.12,
      ],
      rotation: [0, (i * Math.PI * 2) / 3, 0],
      scale: [0.055, 0.006, 0.024],
      decorative: true,
    })),
  ],
  kerupuk: [
    {
      kind: "facet",
      color: "#eacfa0",
      position: [0, 0.07, 0],
      scale: [0.5, 0.07, 0.4],
    },
    ...Array.from({ length: 4 }, (_, i): FoodPart => ({
      kind: "facet",
      color: i % 2 ? "#f7e7c5" : "#efdbb6",
      position: [
        Math.cos((i * Math.PI) / 2) * 0.26,
        0.075 + (i % 2) * 0.025,
        Math.sin((i * Math.PI) / 2) * 0.22,
      ],
      scale: [0.23, 0.07, 0.19],
    })),
  ],
  "ikan-kembung": [
    {
      kind: "facet",
      color: "#8ca9a0",
      position: [0, 0.18, 0],
      scale: [0.7, 0.18, 0.24],
    },
    {
      kind: "facet",
      color: "#d5ded0",
      position: [0.02, 0.29, 0],
      scale: [0.61, 0.065, 0.19],
    },
    {
      kind: "facet",
      color: "#738d84",
      position: [0.6, 0.18, 0],
      scale: [0.25, 0.15, 0.21],
    },
    ...[-1, 1].map((side): FoodPart => ({
      kind: "cylinder",
      args: [0.22, 0.22, 0.06, 3],
      color: "#6d8c81",
      position: [-0.83, 0.18, side * 0.15],
      rotation: [0, side * 0.5, 0],
      scale: [1, 1, 1],
    })),
    {
      kind: "cylinder",
      args: [0.2, 0.2, 0.04, 3],
      color: "#6d8c81",
      position: [-0.04, 0.18, -0.27],
      rotation: [0, 0.5, 0],
      scale: [1, 1, 1],
    },
    {
      kind: "facet",
      color: "#263b35",
      position: [0.64, 0.3, 0.07],
      scale: [0.035, 0.02, 0.035],
      decorative: true,
    },
    ...[-0.3, -0.05, 0.2].map((x): FoodPart => ({
      kind: "box",
      color: "#577a70",
      position: [x, 0.345, 0],
      rotation: [0, 0.25, 0],
      scale: [0.025, 0.008, 0.17],
      decorative: true,
    })),
  ],
  "bakwan-sayur": [
    {
      kind: "facet",
      color: "#c58a43",
      position: [0, 0.12, 0],
      scale: [0.42, 0.12, 0.36],
    },
    ...Array.from({ length: 4 }, (_, i): FoodPart => ({
      kind: "facet",
      color: i % 2 ? "#d9a552" : "#e2b362",
      position: [
        Math.cos((i * Math.PI) / 2) * 0.24,
        0.11,
        Math.sin((i * Math.PI) / 2) * 0.2,
      ],
      scale: [0.19, 0.09, 0.18],
    })),
    ...Array.from({ length: 4 }, (_, i): FoodPart => ({
      kind: "box",
      color: i % 2 ? "#77934b" : "#dd8141",
      position: [-0.18 + i * 0.11, 0.215, (i % 2 ? 1 : -1) * 0.09],
      rotation: [0, i * 0.7, 0],
      scale: [0.03, 0.014, 0.16],
      decorative: true,
    })),
  ],
  rice: [
    {
      kind: "facet",
      color: "#f0e7d3",
      position: [0, 0.18, 0],
      scale: [0.53, 0.29, 0.44],
    },
    ...Array.from({ length: 22 }, (_, i): FoodPart => ({
      kind: "facet",
      color: i % 2 ? "#fff7e3" : "#e9ddc5",
      position: [
        Math.sin(i * 2.4) * 0.4 * Math.sqrt(i / 22),
        0.19 + 0.18 * (1 - i / 28),
        Math.cos(i * 2.4) * 0.34 * Math.sqrt(i / 22),
      ],
      rotation: [0, i, 0],
      scale: [0.095, 0.065, 0.055],
    })),
  ],
  chicken: [
    {
      kind: "facet",
      color: "#d29968",
      position: [0, 0.2, 0],
      scale: [0.54, 0.23, 0.38],
    },
    {
      kind: "facet",
      color: "#e7b482",
      position: [-0.1, 0.23, -0.05],
      scale: [0.43, 0.2, 0.33],
    },
    ...[-0.2, 0, 0.2].map((x): FoodPart => ({
      kind: "box",
      color: "#ae754c",
      position: [x, 0.403, 0],
      rotation: [0, 0.4, 0],
      scale: [0.026, 0.012, 0.4],
    })),
  ],
  tofu: [
    ...[
      [-0.19, 0.14, 0.16],
      [0.2, 0.14, 0.06],
      [0, 0.4, -0.08],
    ].map((p, i): FoodPart => ({
      kind: "box",
      color: i === 2 ? "#f6edd5" : "#e9dfc3",
      position: p as [number, number, number],
      rotation: [0, i * 0.35, 0],
      scale: [0.36, 0.27, 0.34],
      collisionGroup: i,
    })),
  ],
  bread: [
    {
      kind: "box",
      color: "#b77c47",
      scale: [0.65, 0.16, 0.66],
      position: [0, 0.1, 0.02],
    },
    {
      kind: "facet",
      color: "#b77c47",
      scale: [0.39, 0.1, 0.25],
      position: [0, 0.1, -0.3],
    },
    {
      kind: "box",
      color: "#f3dbaa",
      scale: [0.54, 0.035, 0.57],
      position: [0, 0.2, 0.02],
    },
    {
      kind: "facet",
      color: "#f3dbaa",
      scale: [0.32, 0.026, 0.18],
      position: [0, 0.2, -0.27],
    },
  ],
  noodles: [
    {
      kind: "facet",
      color: "#dfb253",
      position: [0, 0.13, 0],
      scale: [0.49, 0.19, 0.42],
    },
    ...Array.from({ length: 7 }, (_, i): FoodPart => ({
      kind: "torus",
      color: i % 2 ? "#eac06a" : "#f8da8a",
      args: [0.16 + i * 0.034, 0.035, 5, 13, Math.PI * 1.85],
      rotation: [Math.PI / 2 + (i % 2) * 0.15, 0, i * 0.6],
      position: [Math.sin(i) * 0.07, 0.2 + i * 0.012, Math.cos(i) * 0.06],
      scale: [1, 0.75, 1],
    })),
  ],
  egg: [
    {
      kind: "facet",
      color: "#f5ede0",
      position: [0, 0.34, 0],
      scale: [0.24, 0.34, 0.24],
    },
  ],
  salmon: [
    {
      kind: "box",
      color: "#697565",
      position: [0, 0.07, 0],
      scale: [0.75, 0.1, 0.49],
    },
    {
      kind: "box",
      color: "#eb9676",
      position: [0, 0.19, 0],
      scale: [0.76, 0.22, 0.48],
    },
    ...[-0.26, -0.08, 0.1, 0.28].map((x): FoodPart => ({
      kind: "box",
      color: "#ffd4b2",
      position: [x, 0.305, 0],
      rotation: [0, 0.28, 0],
      scale: [0.025, 0.012, 0.47],
    })),
  ],
  tempeh: [
    {
      kind: "box",
      color: "#c29768",
      position: [0, 0.15, 0],
      scale: [0.72, 0.26, 0.46],
    },
    ...Array.from({ length: 15 }, (_, i): FoodPart => ({
      kind: "facet",
      color: i % 2 ? "#e5d1a3" : "#f0dcad",
      scale: [0.056, 0.025, 0.043],
      position: [
        -0.28 + (i % 5) * 0.14,
        0.29,
        -0.15 + Math.floor(i / 5) * 0.15,
      ],
    })),
  ],
  broccoli: [
    {
      kind: "cylinder",
      args: [0.065, 0.095, 0.3, 6],
      color: "#94b775",
      position: [0.025, 0.14, 0.015],
      rotation: [0.12, 0, -0.22],
      scale: [1, 1, 1],
    },
    {
      kind: "cylinder",
      args: [0.04, 0.055, 0.2, 5],
      color: "#a2c184",
      position: [-0.065, 0.24, 0.025],
      rotation: [0, 0, 0.6],
      scale: [1, 1, 1],
    },
    ...[
      [-0.13, 0.33, 0.02, 0.16, 0.14, 0.17],
      [0.12, 0.35, 0.03, 0.18, 0.15, 0.17],
      [0.01, 0.4, -0.1, 0.18, 0.16, 0.17],
      [-0.04, 0.36, 0.15, 0.16, 0.14, 0.16],
      [0.04, 0.46, 0.04, 0.17, 0.13, 0.16],
    ].map(([x, y, z, sx, sy, sz], i): FoodPart => ({
      kind: "facet",
      color: ["#477b42", "#568a46", "#3e703c", "#648f4b", "#739d53"][i],
      position: [x, y, z],
      rotation: [0, i * 0.7, 0],
      scale: [sx, sy, sz],
    })),
  ],
  avocado: [
    {
      kind: "facet",
      color: "#607845",
      position: [0, 0.17, 0],
      scale: [0.33, 0.2, 0.46],
    },
    {
      kind: "facet",
      color: "#cdd78a",
      position: [0, 0.27, -0.01],
      scale: [0.285, 0.08, 0.405],
    },
    {
      kind: "facet",
      color: "#a47747",
      position: [0, 0.34, 0.09],
      scale: [0.16, 0.11, 0.17],
    },
  ],
  cheese: [
    {
      kind: "cylinder",
      args: [0.47, 0.47, 0.3, 3],
      color: "#edc159",
      position: [0, 0.19, 0],
      rotation: [0, Math.PI / 6, 0],
      scale: [1, 1, 1],
    },
    ...[
      [-0.08, 0.348, -0.07],
      [0.15, 0.348, 0.05],
      [-0.19, 0.348, 0.09],
    ].map((p, i): FoodPart => ({
      kind: "circle",
      args: [0.055 + i * 0.01, 8],
      color: "#cfa044",
      position: p as [number, number, number],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [1, 1, 1],
      decorative: true,
    })),
  ],
};
export const physicsFoodRotation = (id: string): [number, number, number] =>
  (
    ({
      chicken: [0, -0.3, 0],
      bread: [0, 0.25, 0],
      salmon: [0, 0.2, 0],
      tempeh: [0, 0.3, 0],
      avocado: [0.2, 0, 0],
      cheese: [0, 0.4, 0],
    }) as Record<string, [number, number, number]>
  )[id] ?? [0, 0, 0];

export function foodPartGeometry(part: FoodPart) {
  switch (part.kind) {
    case "facet":
      return new IcosahedronGeometry(1, 1);
    case "box":
      return new BoxGeometry();
    case "torus":
      return new TorusGeometry(
        ...(part.args as ConstructorParameters<typeof TorusGeometry>),
      );
    case "cylinder":
      return new CylinderGeometry(
        ...(part.args as ConstructorParameters<typeof CylinderGeometry>),
      );
    case "circle":
      return new CircleGeometry(
        ...(part.args as ConstructorParameters<typeof CircleGeometry>),
      );
  }
}

const hullCache = new Map<string, Float32Array[]>();
const transformCache = new Map<string, Matrix4[]>();

// Instances use the same vertex-derived calibration as the collision hulls.
// Keep cached matrices immutable; compose each instance into a new matrix.
export function foodPartTransforms(id: string): readonly Matrix4[] {
  if (!transformCache.has(id)) foodCollisionHulls(id, 1);
  return transformCache.get(id)!;
}

export function foodCollisionHulls(id: string, ratio: number): Float32Array[] {
  const cached = hullCache.get(id);
  if (cached)
    return portionPieces(id, ratio).flatMap((piece) => {
      const transform = new Matrix4().compose(
        new Vector3(...piece.position),
        new Quaternion().setFromEuler(new Euler(0, piece.rotationY ?? 0, 0)),
        new Vector3().setScalar(piece.scale),
      );
      const point = new Vector3();
      return cached.map((hull) => {
        const vertices = new Float32Array(hull.length);
        for (let i = 0; i < hull.length; i += 3) {
          point.fromArray(hull, i).applyMatrix4(transform).toArray(vertices, i);
        }
        return vertices;
      });
    });
  const parent = new Matrix4().makeRotationFromEuler(
    new Euler(...physicsFoodRotation(id)),
  );
  const transforms: Matrix4[] = [];
  const parts = physicsFoodParts[id].map((part) => {
    const geometry = foodPartGeometry(part);
    const transform = new Matrix4().compose(
      new Vector3(...part.position),
      new Quaternion().setFromEuler(new Euler(...(part.rotation ?? [0, 0, 0]))),
      new Vector3(...part.scale),
    );
    if (part.parent)
      transform.premultiply(
        new Matrix4().compose(
          new Vector3(...part.parent.position),
          new Quaternion().setFromEuler(new Euler(...part.parent.rotation)),
          new Vector3(1, 1, 1),
        ),
      );
    transform.premultiply(parent);
    transforms.push(transform);
    const vertices = geometry.getAttribute("position");
    const points = Array.from({ length: vertices.count }, (_, i) =>
      new Vector3().fromBufferAttribute(vertices, i).applyMatrix4(transform),
    );
    geometry.dispose();
    return points;
  });
  const bounds = new Box3().setFromPoints(parts.flat());
  const center = bounds.getCenter(new Vector3());
  const scale = new Vector3(...foodDimensionsCm[id])
    .divideScalar(CM_PER_UNIT)
    .divide(bounds.getSize(new Vector3()));
  const offset = new Vector3(center.x, bounds.min.y, center.z);
  const calibration = new Matrix4()
    .makeScale(scale.x, scale.y, scale.z)
    .multiply(new Matrix4().makeTranslation(-offset.x, -offset.y, -offset.z));
  transformCache.set(
    id,
    transforms.map((transform) => calibration.clone().multiply(transform)),
  );
  const normalized = parts.map((points) =>
    points.map((point) => point.sub(offset).multiply(scale)),
  );
  // Preserve gaps between tofu blocks, broccoli florets and repeated pieces;
  // decorative surface markings never become collision obstacles.
  const groups = new Map<number, Vector3[]>();
  normalized.forEach((points, i) => {
    const part = physicsFoodParts[id][i];
    if (part.decorative) return;
    const group = part.collisionGroup ?? 0;
    groups.set(group, [...(groups.get(group) ?? []), ...points]);
  });
  const hulls = [...groups.values()];
  const calibrated = hulls.map(
    (points) => new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])),
  );
  hullCache.set(id, calibrated);
  return foodCollisionHulls(id, ratio);
}
