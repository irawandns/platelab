import { describe, expect, it } from "vitest";
import {
  framePhoto,
  PHOTO_SIZE,
  readPhotoCamera,
  registerPhotoCameraReader,
  type PhotoCamera,
} from "../src/lib/photo";
import { PerspectiveCamera, Vector3 } from "three";

describe("photo framing", () => {
  it("fits even tall or oversized meals into a square photo from the preset angles", () => {
    for (const radius of [0.5, 2.6, 5, 12])
      for (const angle of ["angled", "top"] as const) {
        const center: [number, number, number] = [0.5, 1.4, -0.3];
        const view = framePhoto(
          center,
          [radius * 2, radius * 2, radius * 2],
          angle,
          null,
        );
        const camera = new PerspectiveCamera(view.fov, 1, 0.1, 500);
        camera.position.fromArray(view.position);
        camera.lookAt(...view.target);
        camera.updateMatrixWorld();
        for (let i = 0; i < 64; i++) {
          const t = (i * Math.PI) / 32;
          const point = new Vector3(
            center[0] + Math.cos(t) * radius,
            center[1] + Math.sin(t) * radius,
            center[2],
          ).project(camera);
          expect(Math.abs(point.x)).toBeLessThan(1);
          expect(Math.abs(point.y)).toBeLessThan(1);
          expect(point.z).toBeGreaterThan(-1);
          expect(point.z).toBeLessThan(1);
        }
      }
    expect(PHOTO_SIZE).toBe(2048);
  });
  it("preserves the actual camera and returns independent values for current view", () => {
    const current: PhotoCamera = {
      position: [3, 7, 5],
      target: [0.2, 0.1, 0.4],
      fov: 39,
    };
    const view = framePhoto([0, 0, 0], [6, 1, 6], "current", current);
    expect(view).toEqual(current);
    view.position[0] = 99;
    expect(current.position[0]).toBe(3);
  });
  it("cleans up camera readers without removing a newer scene’s registration", () => {
    expect(readPhotoCamera()).toBeNull();
    const current: PhotoCamera = {
      position: [0, 8, 10],
      target: [0, 0, 0],
      fov: 39,
    };
    const first = registerPhotoCameraReader(() => current);
    const second = registerPhotoCameraReader(() => ({ ...current, fov: 35 }));
    first();
    expect(readPhotoCamera()?.fov).toBe(35);
    const saved = readPhotoCamera()!;
    saved.position[0] = 50;
    expect(readPhotoCamera()?.position[0]).toBe(0);
    second();
    expect(readPhotoCamera()).toBeNull();
  });
});
