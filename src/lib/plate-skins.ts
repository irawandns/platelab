export const plateSkins = {
  cream: {
    name: "Cream",
    base: "#e8d9ad",
    rim: "#532c20",
    band: "#936744",
  },
  sage: {
    name: "Sage",
    base: "#d6e0cb",
    rim: "#456047",
    band: "#7c9471",
  },
  blue: {
    name: "Blue",
    base: "#dce7ec",
    rim: "#34566e",
    band: "#7696aa",
  },
} as const;

export type PlateSkin = keyof typeof plateSkins;
export const DEFAULT_PLATE_SKIN: PlateSkin = "cream";
