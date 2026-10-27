import {
  Color,
  Float32BufferAttribute,
  MeshStandardMaterial,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  foodPartGeometry,
  foodPartTransforms,
  physicsFoodParts,
} from "./food-shapes";

export interface FoodRenderBatch {
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
}
interface FoodRenderResource {
  id: string;
  batches: FoodRenderBatch[];
  users: number;
}
const resources = new Map<string, FoodRenderResource>();

// Bake each part's color and calibrated transform into shared geometry. Parts
// with compatible shading become one draw call, including repeated portions.
export function foodRenderResource(id: string): FoodRenderResource {
  const existing = resources.get(id);
  if (existing) return existing;
  const groups = new Map<
    string,
    { geometries: BufferGeometry[]; flatShading: boolean; roughness: number }
  >();
  const transforms = foodPartTransforms(id);
  physicsFoodParts[id].forEach((part, index) => {
    const source = foodPartGeometry(part).applyMatrix4(transforms[index]);
    const geometry = source.index ? source.toNonIndexed() : source;
    if (geometry !== source) source.dispose();
    const color = new Color(part.color);
    const vertices = geometry.getAttribute("position");
    const original = geometry.getAttribute("color");
    const colors = new Float32Array(vertices.count * 3);
    for (let i = 0; i < vertices.count; i++) {
      colors[i * 3] = color.r * (original ? original.getX(i) : 1);
      colors[i * 3 + 1] = color.g * (original ? original.getY(i) : 1);
      colors[i * 3 + 2] = color.b * (original ? original.getZ(i) : 1);
    }
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
    // UVs differ between procedural mesh kinds; these foods have no textures.
    geometry.deleteAttribute("uv");
    const flatShading = part.kind !== "torus" && part.kind !== "circle";
    const roughness = part.kind === "facet" ? 0.95 : 0.9;
    const key = `${flatShading}:${roughness}`;
    const group = groups.get(key) ?? { geometries: [], flatShading, roughness };
    group.geometries.push(geometry);
    groups.set(key, group);
  });
  const batches = [...groups.values()].map(
    ({ geometries, flatShading, roughness }) => {
      const geometry = mergeGeometries(geometries);
      geometries.forEach((part) => part.dispose());
      if (!geometry) throw new Error(`Cannot merge food geometry: ${id}`);
      return {
        geometry,
        material: new MeshStandardMaterial({
          vertexColors: true,
          flatShading,
          roughness,
        }),
      };
    },
  );
  const resource = { id, batches, users: 0 };
  resources.set(id, resource);
  return resource;
}

export function retainFoodRenderResource(resource: FoodRenderResource) {
  resource.users++;
  return () => {
    resource.users--;
    // React StrictMode reattaches effects synchronously. Wait until it has done
    // so before releasing assets shared by the editor and photo canvases.
    queueMicrotask(() => {
      if (resource.users || resources.get(resource.id) !== resource) return;
      for (const { geometry, material } of resource.batches) {
        geometry.dispose();
        material.dispose();
      }
      resources.delete(resource.id);
    });
  };
}
