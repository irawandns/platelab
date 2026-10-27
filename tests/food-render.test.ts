import { describe, expect, it, vi } from "vitest";
import { Box3, Vector3 } from "three";
import { foods } from "../src/lib/nutrition";
import {
  foodPartGeometry,
  foodPartTransforms,
  physicsFoodParts,
} from "../src/lib/food-shapes";
import {
  foodRenderResource,
  retainFoodRenderResource,
} from "../src/lib/food-render-resources";
import { familyFoodParts } from "../src/lib/food-families";
import { portionPieces } from "../src/lib/scale";

describe("shared food rendering", () => {
  it("preserves calibrated model vertices, normals, and colors while reducing draw batches", () => {
    for (const id of [...foods.map((food) => food.id), "timun-whole"]) {
      const resource = foodRenderResource(id);
      const release = retainFoodRenderResource(resource);
      try {
        const original = new Box3();
        let vertexCount = 0;
        physicsFoodParts[id].forEach((part, index) => {
          const geometry = foodPartGeometry(part).applyMatrix4(
            foodPartTransforms(id)[index],
          );
          const positions = geometry.getAttribute("position");
          vertexCount += geometry.index
            ? geometry.index.count
            : positions.count;
          for (let i = 0; i < positions.count; i++)
            original.expandByPoint(
              new Vector3().fromBufferAttribute(positions, i),
            );
          geometry.dispose();
        });
        const merged = new Box3();
        let mergedCount = 0;
        for (const { geometry } of resource.batches) {
          geometry.computeBoundingBox();
          merged.union(geometry.boundingBox!);
          const positions = geometry.getAttribute("position");
          mergedCount += positions.count;
          expect(geometry.getAttribute("normal").count).toBe(positions.count);
          const colors = geometry.getAttribute("color");
          expect(colors.count).toBe(positions.count);
          expect(
            Array.from(colors.array).every(
              (value) => Number.isFinite(value) && value >= 0 && value <= 1,
            ),
          ).toBe(true);
        }
        expect(mergedCount).toBe(vertexCount);
        for (const axis of ["x", "y", "z"] as const) {
          expect(merged.min[axis]).toBeCloseTo(original.min[axis], 6);
          expect(merged.max[axis]).toBeCloseTo(original.max[axis], 6);
        }
        expect(resource.batches.length).toBeLessThanOrEqual(3);
        if (id === "rice") expect(resource.batches).toHaveLength(1);
      } finally {
        release();
      }
    }
  });

  it("shares assets across servings and canvases, survives effect remounts, and disposes after the last user", async () => {
    const resource = foodRenderResource("rice");
    const editor = retainFoodRenderResource(resource);
    const photo = retainFoodRenderResource(resource);
    const geometryDispose = vi.spyOn(resource.batches[0].geometry, "dispose");
    const materialDispose = vi.spyOn(resource.batches[0].material, "dispose");
    expect(foodRenderResource("rice")).toBe(resource);
    editor();
    await Promise.resolve();
    expect(geometryDispose).not.toHaveBeenCalled();
    photo();
    const remount = retainFoodRenderResource(resource);
    await Promise.resolve();
    expect(materialDispose).not.toHaveBeenCalled();
    remount();
    await Promise.resolve();
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    const replacement = foodRenderResource("rice");
    expect(replacement).not.toBe(resource);
    retainFoodRenderResource(replacement)();
  });

  it("keeps each new regular serving under 1500 triangles and preserves fractional visual volume", () => {
    for (const id of Object.keys(familyFoodParts)) {
      const resource = foodRenderResource(id);
      const release = retainFoodRenderResource(resource);
      const triangles = resource.batches.reduce(
        (sum, batch) => sum + batch.geometry.getAttribute("position").count / 3,
        0,
      );
      expect(triangles * portionPieces(id, 1).length, id).toBeLessThanOrEqual(
        1500,
      );
      const regularVolume = portionPieces(id, 1).reduce(
        (sum, piece) => sum + piece.scale ** 3,
        0,
      );
      for (const ratio of [0.25, 1, 1.37, 2, 3])
        expect(
          portionPieces(id, ratio).reduce(
            (sum, piece) => sum + piece.scale ** 3,
            0,
          ) / regularVolume,
        ).toBeCloseTo(ratio);
      release();
    }
  });
});
