export type PhotoLook = "warm-table" | "studio" | "dark";
export type PhotoAngle = "angled" | "top" | "current";
export type PhotoVector = [number, number, number];
export interface PhotoCamera {
  position: PhotoVector;
  target: PhotoVector;
  fov: number;
}
export const PHOTO_SIZE = 2048;
export const photoLooks = {
  "warm-table": {
    label: "Warm table",
    description: "Warm light, soft shadows",
    background: "#e8ddc8",
    key: "#ffe8c7",
    fill: "#fff6e8",
    ambient: 0.65,
    intensity: 3.6,
    rim: 0.6,
    shadow: 0.26,
  },
  studio: {
    label: "Studio",
    description: "Clean, balanced light",
    background: "#eef0ec",
    key: "#ffffff",
    fill: "#eaf1ff",
    ambient: 0.8,
    intensity: 3.2,
    rim: 0.9,
    shadow: 0.2,
  },
  dark: {
    label: "Dark",
    description: "Deep background, bright edges",
    background: "#252d2b",
    key: "#fff1dd",
    fill: "#c6dded",
    ambient: 0.35,
    intensity: 3.8,
    rim: 2.2,
    shadow: 0.45,
  },
} as const;
let cameraReader: (() => PhotoCamera) | undefined;
export function registerPhotoCameraReader(reader: () => PhotoCamera) {
  cameraReader = reader;
  return () => {
    if (cameraReader === reader) cameraReader = undefined;
  };
}
export function readPhotoCamera(): PhotoCamera | null {
  return cameraReader ? structuredClone(cameraReader()) : null;
}
export function framePhoto(
  center: PhotoVector,
  size: PhotoVector,
  angle: PhotoAngle,
  current: PhotoCamera | null,
): PhotoCamera {
  if (angle === "current" && current) return structuredClone(current);
  const fov = 35;
  // Fit every corner in the square frustum, with room for the cast shadow.
  const direction = angle === "top" ? [0, 1, 0.001] : [0, 0.82, 1];
  const length = Math.hypot(...direction);
  const back = direction.map((v) => v / length);
  const up = [0, back[2], -back[1]];
  const tangent = Math.tan((fov * Math.PI) / 360);
  let distance = 1;
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      for (const sz of [-1, 1]) {
        const corner = [
          (sx * size[0]) / 2,
          (sy * size[1]) / 2,
          (sz * size[2]) / 2,
        ];
        const toward = corner.reduce((sum, v, i) => sum + v * back[i], 0);
        const vertical = corner.reduce((sum, v, i) => sum + v * up[i], 0);
        distance = Math.max(
          distance,
          Math.max(Math.abs(corner[0]), Math.abs(vertical)) / tangent + toward,
        );
      }
  distance *= 1.12;
  return {
    position: center.map(
      (v, i) => v + (direction[i] / length) * distance,
    ) as PhotoVector,
    target: [...center],
    fov,
  };
}
