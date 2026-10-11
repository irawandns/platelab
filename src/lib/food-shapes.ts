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
    [-0.21, 0, 0.12],
    [0.2, 0, 0.05],
    [0, 0.05, -0.18],
  ].flatMap((p, i): FoodPart[] => {
    const parent = {
      position: p as [number, number, number],
      rotation: [0, i, 0.15] as [number, number, number],
    };
    return [
      {
        kind: "cylinder",
        args: [0.07, 0.09, 0.45, 6],
        color: "#91ad6b",
        position: [0, 0.2, 0],
        scale: [1, 1, 1],
        parent,
        collisionGroup: i,
      },
      {
        kind: "facet",
        color: ["#658c4b", "#4f7c43", "#789953"][i],
        position: [0, 0.45, 0],
        scale: [0.28, 0.23, 0.26],
        parent,
        collisionGroup: i,
      },
      {
        kind: "facet",
        color: "#83a361",
        position: [-0.13, 0.44, 0.04],
        scale: [0.16, 0.15, 0.15],
        parent,
        collisionGroup: i,
      },
    ];
  }),
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
export function foodCollisionHulls(id: string, ratio: number): Float32Array[] {
  const cached = hullCache.get(id);
  if (cached)
    return portionPieces(id, ratio).flatMap((piece) =>
      cached.map((hull) =>
        Float32Array.from(
          hull,
          (value, i) => value * piece.scale + piece.position[i % 3],
        ),
      ),
    );
  const parent = new Matrix4().makeRotationFromEuler(
    new Euler(...physicsFoodRotation(id)),
  );
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
