import { Color, ShapeUtils, Vector2 } from "three";
import type { FoodPart } from "./food-shapes";

// These meshes use the same calibrated vertices for rendering and physics.
// A small shared mesh also keeps surface details from becoming extra draw calls.
function meshPart(
  vertices: number[],
  indices: number[],
  colors: number[],
  decorative = false,
): FoodPart {
  return {
    kind: "mesh",
    vertices,
    indices,
    colors,
    color: "#ffffff",
    position: [0, 0, 0],
    scale: [1, 1, 1],
    decorative,
  };
}

function cucumberParts(): FoodPart[] {
  const vertices: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const add = (x: number, y: number, z: number, color: string) => {
    vertices.push(x, y, z);
    colors.push(...new Color(color).toArray());
    return vertices.length / 3 - 1;
  };
  // Three seed chambers, each with paired small seeds pointing toward the core.
  for (let lobe = 0; lobe < 3; lobe++) {
    const angle = (lobe * Math.PI * 2) / 3;
    const cx = Math.cos(angle) * 0.12,
      cz = Math.sin(angle) * 0.12;
    const center = add(cx, 0.122, cz, "#d4e5b2");
    for (let j = 0; j < 16; j++) {
      const a = (j * Math.PI * 2) / 16;
      const x = Math.cos(a) * 0.14,
        z = Math.sin(a) * 0.085;
      add(
        cx + x * Math.cos(angle) - z * Math.sin(angle),
        0.122,
        cz + x * Math.sin(angle) + z * Math.cos(angle),
        "#d4e5b2",
      );
    }
    for (let j = 0; j < 16; j++)
      indices.push(center, center + 1 + ((j + 1) % 16), center + 1 + j);
    for (const side of [-1, 1])
      for (let j = 0; j < 3; j++) {
        const distance = 0.085 + j * 0.055;
        const sx = Math.cos(angle) * distance - Math.sin(angle) * side * 0.035;
        const sz = Math.sin(angle) * distance + Math.cos(angle) * side * 0.035;
        const seed = add(sx, 0.1228, sz, "#fff8d8");
        for (let k = 0; k < 8; k++) {
          const a = (k * Math.PI * 2) / 8;
          const x = Math.cos(a) * 0.027,
            z = Math.sin(a) * 0.012;
          add(
            sx + x * Math.cos(angle) - z * Math.sin(angle),
            0.1226,
            sz + x * Math.sin(angle) + z * Math.cos(angle),
            "#f5f0cc",
          );
        }
        for (let k = 0; k < 8; k++)
          indices.push(seed, seed + 1 + ((k + 1) % 8), seed + 1 + k);
      }
  }
  const skin: number[] = [],
    skinFaces: number[] = [],
    skinColors: number[] = [];
  for (const [radius, y] of [
    [0.5, 0.124],
    [0.472, 0.121],
    [0.5, 0],
    [0.472, 0],
  ])
    for (let j = 0; j < 32; j++) {
      const a = (j * Math.PI * 2) / 32;
      skin.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
      skinColors.push(
        ...new Color(j % 4 === 0 ? "#527f3c" : "#356b35").toArray(),
      );
    }
  for (let j = 0; j < 32; j++) {
    const next = (j + 1) % 32;
    skinFaces.push(
      j,
      j + 32,
      next,
      next,
      j + 32,
      next + 32,
      j,
      next,
      j + 64,
      next,
      next + 64,
      j + 64,
      j + 32,
      j + 96,
      next + 32,
      next + 32,
      j + 96,
      next + 96,
      j + 64,
      next + 64,
      j + 96,
      next + 64,
      next + 96,
      j + 96,
    );
  }
  return [
    meshPart(skin, skinFaces, skinColors),
    {
      kind: "cylinder",
      args: [0.472, 0.472, 0.12, 32],
      color: "#e2edc9",
      position: [0, 0.06, 0],
      scale: [1, 1, 1],
    },
    meshPart(vertices, indices, colors, true),
  ];
}

// Rounded, slightly tapered cucumber with longitudinal pale mottling.
// The raw mesh is calibrated to its documented serving dimensions below.
function wholeCucumberParts(): FoodPart[] {
  const vertices: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const sections = [
    [-1.5, 0.018],
    [-1.46, 0.13],
    [-1.35, 0.29],
    [-1.16, 0.4],
    [-0.9, 0.45],
    [-0.55, 0.47],
    [-0.15, 0.47],
    [0.25, 0.455],
    [0.65, 0.43],
    [0.98, 0.39],
    [1.22, 0.31],
    [1.38, 0.19],
    [1.46, 0.025],
  ];
  const segments = 32;
  sections.forEach(([x, radius], ring) => {
    for (let j = 0; j < segments; j++) {
      const angle = (j * Math.PI * 2) / segments;
      const r = radius * (1 + 0.018 * Math.cos(angle * 8));
      vertices.push(x, 0.48 + Math.cos(angle) * r, Math.sin(angle) * r);
      const stripe = (Math.cos(angle * 7 + 0.18 * Math.sin(x * 2)) + 1) / 2;
      const mottle = (Math.sin(ring * 13.7 + j * 7.3) + 1) / 2;
      const pale = Math.max(0, -x / 1.5) * 0.25;
      const color = new Color("#477d32").lerp(
        new Color("#a8c66b"),
        stripe * 0.42 + mottle * 0.18 + pale,
      );
      colors.push(...color.toArray());
    }
  });
  for (let ring = 0; ring < sections.length - 1; ring++)
    for (let j = 0; j < segments; j++) {
      const a = ring * segments + j,
        b = ring * segments + ((j + 1) % segments);
      indices.push(a, b, a + segments, b, b + segments, a + segments);
    }
  for (let j = 1; j < segments - 1; j++) {
    const end = (sections.length - 1) * segments;
    indices.push(0, j + 1, j, end, end + j, end + j + 1);
  }
  return [
    meshPart(vertices, indices, colors),
    {
      kind: "facet",
      color: "#b8aa76",
      position: [1.445, 0.48, 0],
      scale: [0.012, 0.035, 0.035],
      decorative: true,
    },
  ];
}

// The top curls only near its edge. A gently puffed underside supplies a
// stable convex contact surface without following every tiny top ripple.
const crackerHeight = (r: number, a: number) => {
  const curl = Math.max(0, (r - 0.5) * 2);
  return (
    0.024 +
    curl ** 2 * 0.075 +
    (0.023 * Math.sin(3 * a + 0.6) + 0.012 * Math.cos(7 * a)) * curl ** 3
  );
};

function crackerParts(): FoodPart[] {
  const vertices: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const segments = 24,
    rings = 4,
    layerSize = 1 + segments * rings;
  for (let layer = 0; layer < 2; layer++) {
    const bottom = layer === 1;
    vertices.push(0, bottom ? -0.03 : crackerHeight(0, 0), 0);
    colors.push(...new Color(bottom ? "#dfc596" : "#f5e7c5").toArray());
    for (let ring = 1; ring <= rings; ring++)
      for (let j = 0; j < segments; j++) {
        const r = ring / rings,
          a = (j * Math.PI * 2) / segments;
        const edge =
          1 + 0.055 * Math.sin(3 * a + 0.4) + 0.035 * Math.cos(7 * a);
        vertices.push(
          Math.cos(a) * r * edge * 0.53,
          bottom
            ? -0.03 + 0.04 * Math.max(0, (r - 0.75) * 4)
            : crackerHeight(r, a),
          Math.sin(a) * r * edge * 0.44,
        );
        const tint = new Color(bottom ? "#dfc596" : "#f5e7c5");
        tint.lerp(
          new Color("#d8b47e"),
          (ring === rings ? 0.35 : 0.06) + 0.05 * Math.sin(j * 2.4),
        );
        colors.push(...tint.toArray());
      }
    const offset = layer * layerSize;
    const face = (a: number, b: number, c: number) =>
      indices.push(...(bottom ? [a, b, c] : [a, c, b]).map((i) => i + offset));
    for (let j = 0; j < segments; j++) {
      const next = (j + 1) % segments;
      face(0, 1 + j, 1 + next);
      for (let ring = 0; ring < rings - 1; ring++) {
        const a = 1 + ring * segments + j,
          b = a + segments;
        const c = 1 + (ring + 1) * segments + next,
          d = 1 + ring * segments + next;
        face(a, b, c);
        face(a, c, d);
      }
    }
  }
  for (let j = 0; j < segments; j++) {
    const a = 1 + (rings - 1) * segments + j;
    const b = 1 + (rings - 1) * segments + ((j + 1) % segments);
    indices.push(a, b, a + layerSize, b, b + layerSize, a + layerSize);
  }
  // Small raised pores share one decorative mesh; the shell controls contact.
  const bumps: number[] = [],
    bumpFaces: number[] = [],
    bumpColors: number[] = [];
  for (let i = 0; i < 19; i++) {
    const a = i * 2.399963,
      r = 0.16 + Math.sqrt(i / 19) * 0.62;
    const x = Math.cos(a) * r * 0.53,
      z = Math.sin(a) * r * 0.44;
    const base = bumps.length / 3;
    const y = crackerHeight(r, a) + 0.003;
    bumps.push(x, y + 0.008, z);
    bumpColors.push(...new Color("#fff3d5").toArray());
    for (let j = 0; j < 8; j++) {
      const angle = (j * Math.PI * 2) / 8;
      bumps.push(x + Math.cos(angle) * 0.023, y, z + Math.sin(angle) * 0.018);
      bumpColors.push(...new Color(i % 3 ? "#eddbb5" : "#e3cba0").toArray());
      bumpFaces.push(base, base + 1 + ((j + 1) % 8), base + 1 + j);
    }
  }
  return [
    meshPart(vertices, indices, colors),
    meshPart(bumps, bumpFaces, bumpColors, true),
  ];
}

// x, flank thickness, half-height: the whole fish lies on its side on the plate.
const fishSections = [
  [-0.87, 0.035, 0.045],
  [-0.7, 0.065, 0.095],
  [-0.45, 0.12, 0.22],
  [-0.12, 0.155, 0.285],
  [0.2, 0.15, 0.28],
  [0.46, 0.12, 0.225],
  [0.65, 0.085, 0.16],
  [0.83, 0.04, 0.075],
  [0.94, 0.009, 0.012],
];
function fishSurface(x: number, z: number) {
  const right = fishSections.findIndex((section) => section[0] >= x);
  const a = fishSections[Math.max(0, right - 1)],
    b = fishSections[Math.max(0, right)];
  const t = a === b ? 0 : (x - a[0]) / (b[0] - a[0]);
  const thickness = a[1] + (b[1] - a[1]) * t,
    width = a[2] + (b[2] - a[2]) * t;
  return 0.155 + thickness * Math.sqrt(Math.max(0, 1 - (z / width) ** 2));
}

function fishFin(outline: [number, number][], color: string): FoodPart {
  const vertices: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  for (const y of [0.168, 0.145])
    for (const [x, z] of outline) {
      vertices.push(x, y, z);
      colors.push(...new Color(color).toArray());
    }
  const n = outline.length;
  for (const [a, b, c] of ShapeUtils.triangulateShape(
    outline.map((p) => new Vector2(...p)),
    [],
  ))
    indices.push(c, b, a, a + n, b + n, c + n);
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    indices.push(i, next, i + n, next, next + n, i + n);
  }
  return meshPart(vertices, indices, colors);
}

function fishParts(): FoodPart[] {
  const vertices: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const segments = 16;
  for (const [x, thickness, width] of fishSections)
    for (let j = 0; j < segments; j++) {
      const a = (j * Math.PI * 2) / segments,
        dorsal = Math.cos(a);
      vertices.push(x, 0.155 + Math.sin(a) * thickness, dorsal * width);
      const color = new Color(
        dorsal < -0.6 ? "#426965" : dorsal > 0.5 ? "#e0e5d8" : "#afc5c2",
      );
      if (dorsal < -0.15 && dorsal >= -0.6)
        color.lerp(new Color("#809e93"), 0.4);
      colors.push(...color.toArray());
    }
  for (let ring = 0; ring < fishSections.length - 1; ring++)
    for (let j = 0; j < segments; j++) {
      const a = ring * segments + j,
        b = a + segments;
      const c = ring * segments + ((j + 1) % segments),
        d = c + segments;
      indices.push(a, b, c, c, b, d);
    }
  for (let j = 1; j < segments - 1; j++)
    indices.push(
      0,
      j,
      j + 1,
      vertices.length / 3 - segments,
      vertices.length / 3 - segments + j + 1,
      vertices.length / 3 - segments + j,
    );
  const markings: number[] = [],
    markingFaces: number[] = [],
    markingColors: number[] = [];
  const stroke = (points: [number, number][], width: number, color: string) => {
    const start = markings.length / 3;
    points.forEach(([x, z], i) => {
      const before = points[Math.max(0, i - 1)],
        after = points[Math.min(points.length - 1, i + 1)];
      const dx = after[0] - before[0],
        dz = after[1] - before[1];
      const length = Math.hypot(dx, dz);
      for (const side of [-1, 1]) {
        const px = x - ((side * dz) / length) * width,
          pz = z + ((side * dx) / length) * width;
        markings.push(px, fishSurface(px, pz) + 0.002, pz);
        markingColors.push(...new Color(color).toArray());
      }
    });
    for (let i = 0; i < points.length - 1; i++) {
      const a = start + i * 2;
      markingFaces.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  };
  // Curved gill cover and fine lengthwise markings, rather than grill-like bars.
  stroke(
    Array.from({ length: 9 }, (_, i): [number, number] => {
      const z = -0.15 + i * 0.0375;
      return [0.51 - 0.055 * (1 - (z / 0.16) ** 2), z];
    }),
    0.008,
    "#6d8881",
  );
  for (const z of [-0.155, -0.195])
    stroke(
      Array.from({ length: 10 }, (_, i): [number, number] => [
        -0.47 + i * 0.092,
        z,
      ]),
      0.004,
      "#68877a",
    );
  stroke(
    [
      [0.85, 0.033],
      [0.9, 0.016],
      [0.934, 0.008],
    ],
    0.003,
    "#6d827b",
  );
  return [
    meshPart(vertices, indices, colors),
    fishFin(
      [
        [-0.83, -0.04],
        [-1.3, -0.32],
        [-1.19, -0.09],
        [-1.05, 0],
        [-1.19, 0.09],
        [-1.3, 0.32],
        [-0.83, 0.04],
      ],
      "#718579",
    ),
    fishFin(
      [
        [-0.36, -0.23],
        [-0.28, -0.43],
        [0.05, -0.29],
        [0.18, -0.27],
      ],
      "#6e8574",
    ),
    fishFin(
      [
        [-0.62, -0.12],
        [-0.58, -0.23],
        [-0.42, -0.19],
      ],
      "#8b9681",
    ),
    fishFin(
      [
        [-0.43, 0.2],
        [-0.55, 0.33],
        [-0.16, 0.28],
      ],
      "#9fa58b",
    ),
    meshPart(markings, markingFaces, markingColors, true),
    {
      kind: "facet",
      color: "#91a391",
      position: [0.36, 0.278, 0.09],
      rotation: [0, -0.5, 0],
      scale: [0.16, 0.013, 0.047],
      decorative: true,
    },
    {
      kind: "cylinder",
      args: [0.061, 0.061, 0.008, 16],
      color: "#e4e7d6",
      position: [0.71, fishSurface(0.71, 0.01) + 0.005, 0.01],
      scale: [1, 1, 1],
      decorative: true,
    },
    {
      kind: "cylinder",
      args: [0.043, 0.043, 0.009, 16],
      color: "#b4a764",
      position: [0.71, fishSurface(0.71, 0.01) + 0.01, 0.01],
      scale: [1, 1, 1],
      decorative: true,
    },
    {
      kind: "cylinder",
      args: [0.03, 0.03, 0.01, 16],
      color: "#243a34",
      position: [0.71, fishSurface(0.71, 0.01) + 0.015, 0.01],
      scale: [1, 1, 1],
      decorative: true,
    },
  ];
}

export const indonesianFoodParts: Record<string, FoodPart[]> = {
  timun: cucumberParts(),
  "timun-whole": wholeCucumberParts(),
  kerupuk: crackerParts(),
  "ikan-kembung": fishParts(),
};
