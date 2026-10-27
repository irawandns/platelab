import type { FoodPart } from "./food-shapes";

// Small, deterministic recipes share silhouettes without textures or new assets.
function facet(
  color: string,
  position: FoodPart["position"],
  scale: FoodPart["scale"],
  decorative = false,
): FoodPart {
  return { kind: "facet", args: [1, 0], color, position, scale, decorative };
}

function chunks(color: string, highlight: string): FoodPart[] {
  return [
    facet(color, [0, 0.2, 0], [0.5, 0.2, 0.4]),
    facet(highlight, [-0.18, 0.24, -0.05], [0.23, 0.13, 0.24], true),
  ];
}

function mound(color: string, highlight: string, kernels: boolean): FoodPart[] {
  return [
    facet(color, [0, 0.16, 0], [0.5, 0.25, 0.43]),
    ...Array.from({ length: 18 }, (_, i) => {
      const angle = i * 2.399963;
      const radius = Math.sqrt(i / 18) * 0.38;
      return facet(
        i % 3 ? color : highlight,
        [
          Math.cos(angle) * radius,
          0.34 - radius * 0.35,
          Math.sin(angle) * radius,
        ],
        kernels ? [0.075, 0.055, 0.095] : [0.075, 0.075, 0.075],
        false,
      );
    }),
  ];
}

function tomatoSlice(): FoodPart[] {
  return [
    {
      kind: "cylinder",
      args: [0.5, 0.5, 0.15, 12],
      color: "#c74f3e",
      position: [0, 0.075, 0],
      scale: [1, 1, 1],
    },
    {
      kind: "cylinder",
      args: [0.44, 0.44, 0.125, 12],
      color: "#ec7660",
      position: [0, 0.09, 0],
      scale: [1, 1, 1],
      decorative: false,
    },
    ...Array.from({ length: 5 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 5;
      return facet(
        "#f6c18a",
        [Math.cos(angle) * 0.25, 0.155, Math.sin(angle) * 0.25],
        [0.045, 0.012, 0.075],
        false,
      );
    }),
  ];
}

function orangeWedge(): FoodPart[] {
  return [
    // A closed triangular prism represents edible flesh, excluding peel.
    {
      kind: "cylinder",
      args: [0.5, 0.5, 0.37, 3],
      color: "#ef9f3d",
      position: [0, 0.185, 0],
      scale: [1, 1, 0.7],
    },
    ...[-0.12, 0, 0.12].map((x): FoodPart => ({
      kind: "box",
      color: "#ffdc95",
      position: [x, 0.354, 0],
      scale: [0.012, 0.008, 0.26 - Math.abs(x)],
      decorative: true,
    })),
  ];
}

function strawberry(): FoodPart[] {
  return [
    {
      kind: "cylinder",
      args: [0.33, 0.12, 0.58, 7],
      color: "#cc514b",
      position: [0, 0.29, 0],
      scale: [1, 1, 0.8],
    },
    ...Array.from({ length: 7 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 7;
      return facet(
        "#f5c585",
        [Math.cos(angle) * 0.29, 0.43, Math.sin(angle) * 0.23],
        [0.014, 0.024, 0.014],
        true,
      );
    }),
    // Leaves are decorative; edible weight excludes them.
    ...Array.from({ length: 4 }, (_, i): FoodPart => ({
      kind: "box",
      color: "#608947",
      position: [0, 0.557, 0],
      rotation: [0, (i * Math.PI) / 4, 0],
      scale: [0.38, 0.015, 0.055],
      decorative: true,
    })),
  ];
}

export const familyFoodParts: Record<string, FoodPart[]> = {
  potato: chunks("#e5ce96", "#f4e3b8"),
  "sweet-potato": chunks("#de8d43", "#efb065"),
  corn: mound("#e8bc49", "#ffdf78", true),
  peas: mound("#739649", "#a3b869", false),
  "green-beans": Array.from({ length: 7 }, (_, i): FoodPart => ({
    kind: "cylinder",
    args: [0.055, 0.055, 0.96, 6],
    color: i % 2 ? "#789c50" : "#58834c",
    position: [
      ((i % 3) - 1) * 0.19,
      0.055 + Math.floor(i / 3) * 0.055,
      ((i % 2) - 0.5) * 0.16,
    ],
    rotation: [Math.PI / 2, 0, ((i % 3) - 1) * 0.18],
    scale: [1, 1, 1],
  })),
  tomato: tomatoSlice(),
  orange: orangeWedge(),
  strawberry: strawberry(),
};
