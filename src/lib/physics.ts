import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import type { FoodPose, PlateItem } from "../types";
import { foodById } from "./nutrition";
import {
  CM_PER_UNIT,
  placementRadius,
  plateRadius,
  plateTopProfile,
  PLATE_SURFACE_Y,
  wellRadius,
} from "./scale";
import { foodCollisionHulls } from "./food-shapes";
import {
  insideWell,
  trayOutline,
  trayPosition,
  trayWells,
  TRAY_FLOOR_Y,
  type PlateType,
} from "./meal-tray";
import { mealTrayGeometry } from "./tray-geometry";

let initialization: Promise<void> | undefined;
export const initializePhysics = () => (initialization ??= RAPIER.init());
const identity = { x: 0, y: 0, z: 0, w: 1 };
const zero = { x: 0, y: 0, z: 0 };
const clearance = 0.025;
interface Entry {
  body: RAPIER.RigidBody;
  item: PlateItem;
  hulls: Float32Array[];
  reach: number;
}

export class FoodPhysics {
  world: RAPIER.World;
  entries = new Map<string, Entry>();
  private dragged: string | null = null;
  private accumulator = 0;
  constructor(
    readonly diameterCm: number,
    items: PlateItem[],
    restore = false,
    readonly plateType: PlateType = "ceramic",
  ) {
    // One scene unit is 5 cm. Gravity is converted from metres/s².
    this.world = new RAPIER.World({
      x: 0,
      y: (-9.81 * 100) / CM_PER_UNIT,
      z: 0,
    });
    this.world.timestep = 1 / 120;
    // Compound foods and thin bread need extra iterations in crowded stacks.
    this.world.numSolverIterations = 16;
    this.world.integrationParameters.erp = 0.7;
    const plate = this.world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
    if (plateType === "meal-tray") {
      const geometry = mealTrayGeometry();
      const vertices = geometry.attributes.position.array as Float32Array;
      const indices: number[] = [];
      for (let i = 0; i < vertices.length / 3; i += 3) {
        // Primitive floor slabs avoid internal triangle-edge contacts under thin food.
        if (
          [i, i + 1, i + 2].every(
            (j) => Math.abs(vertices[j * 3 + 1] - TRAY_FLOOR_Y) < 1e-6,
          )
        )
          continue;
        indices.push(i, i + 1, i + 2);
      }
      this.world.createCollider(
        RAPIER.ColliderDesc.trimesh(
          vertices,
          new Uint32Array(indices),
        ).setFriction(0.9),
        plate,
      );
      for (const w of trayWells) {
        const radius = w.radius - 0.16;
        const dx = w.width / 2 - w.radius;
        const dz = w.depth / 2 - w.radius;
        const y = TRAY_FLOOR_Y - 0.04;
        const floor = (shape: RAPIER.ColliderDesc, x = w.x, z = w.z) =>
          this.world.createCollider(
            shape.setTranslation(x, y, z).setFriction(0.9),
            plate,
          );
        if (dx > 0) floor(RAPIER.ColliderDesc.cuboid(dx, 0.04, dz + radius));
        if (dz > 0) floor(RAPIER.ColliderDesc.cuboid(dx + radius, 0.04, dz));
        if (dx === 0 && dz === 0)
          floor(RAPIER.ColliderDesc.cylinder(0.04, radius));
        else
          for (const a of [-1, 1])
            for (const b of [-1, 1])
              floor(
                RAPIER.ColliderDesc.cylinder(0.04, radius),
                w.x + a * dx,
                w.z + b * dz,
              );
      }
      geometry.dispose();
    } else {
      this.world.createCollider(
        RAPIER.ColliderDesc.cylinder(0.04, wellRadius(diameterCm))
          .setTranslation(0, PLATE_SURFACE_Y - 0.04, 0)
          .setFriction(0.9),
        plate,
      );
      const profile = plateTopProfile.slice(1);
      const vertices: number[] = [],
        indices: number[] = [];
      const segments = 128,
        radius = plateRadius(diameterCm);
      for (let angle = 0; angle <= segments; angle++) {
        const theta = (angle * Math.PI * 2) / segments;
        profile.forEach(([r, y]) =>
          vertices.push(
            r * radius * Math.cos(theta),
            y,
            r * radius * Math.sin(theta),
          ),
        );
      }
      for (let a = 0; a < segments; a++)
        for (let p = 0; p < profile.length - 1; p++) {
          const i = a * profile.length + p,
            j = i + profile.length;
          indices.push(i, j, i + 1, i + 1, j, j + 1);
        }
      this.world.createCollider(
        RAPIER.ColliderDesc.trimesh(
          new Float32Array(vertices),
          new Uint32Array(indices),
        ).setFriction(0.9),
        plate,
      );
    }
    for (const item of items
      .slice()
      .sort((a, b) => Number(Boolean(b.pose)) - Number(Boolean(a.pose))))
      this.add(item, restore);
    this.world.propagateModifiedBodyPositionsToColliders();
    this.world.updateSceneQueries();
  }

  private add(item: PlateItem, restore: boolean) {
    const food = foodById[item.foodId];
    const ratio = item.portionGrams / food.defaultPortionGrams;
    const hulls = foodCollisionHulls(item.foodId, ratio);
    const descriptor = RAPIER.RigidBodyDesc.dynamic()
      .setLinearDamping(2)
      .setAngularDamping(4)
      .setCcdEnabled(true);
    const pose = item.pose;
    descriptor.setTranslation(
      pose?.position[0] ?? item.position[0],
      pose?.position[1] ?? PLATE_SURFACE_Y,
      pose?.position[2] ?? item.position[1],
    );
    if (pose)
      descriptor.setRotation({
        x: pose.rotation[0],
        y: pose.rotation[1],
        z: pose.rotation[2],
        w: pose.rotation[3],
      });
    if (restore && pose) descriptor.setSleeping(true);
    const body = this.world.createRigidBody(descriptor);
    for (const hull of hulls) {
      const collider = RAPIER.ColliderDesc.convexHull(hull);
      if (!collider)
        throw new Error(`Unable to create ${item.foodId} collision hull`);
      this.world.createCollider(
        collider.setFriction(0.9).setRestitution(0),
        body,
      );
    }
    // Distribute edible mass by collider volume, including fractional pieces.
    const colliders = Array.from({ length: body.numColliders() }, (_, i) =>
      body.collider(i),
    );
    const volume = colliders.reduce(
      (sum, collider) => sum + collider.volume(),
      0,
    );
    colliders.forEach((collider) =>
      collider.setMass(
        ((item.portionGrams / 1000) * collider.volume()) / volume,
      ),
    );
    const reach = Math.max(
      ...hulls.flatMap((hull) =>
        Array.from({ length: hull.length / 3 }, (_, i) =>
          Math.hypot(hull[i * 3], hull[i * 3 + 1], hull[i * 3 + 2]),
        ),
      ),
    );
    this.entries.set(item.instanceId, { body, item, hulls, reach });
    if (!pose) {
      const y = this.dropHeight(
        item.instanceId,
        item.position[0],
        item.position[1],
      );
      body.setTranslation(
        { x: item.position[0], y: y + clearance, z: item.position[1] },
        true,
      );
    }
  }

  /** Sweep each hull down onto the plate/food; do not use a bounding circle for contact. */
  dropHeight(id: string, x: number, z: number) {
    const entry = this.entries.get(id)!;
    this.world.propagateModifiedBodyPositionsToColliders();
    this.world.updateSceneQueries();
    let start = 1;
    for (const [otherId, other] of this.entries)
      if (otherId !== id) {
        start = Math.max(start, other.body.translation().y + other.reach + 0.5);
      }
    let height = PLATE_SURFACE_Y;
    for (let i = 0; i < entry.body.numColliders(); i++) {
      const shape = entry.body.collider(i).shape;
      const hit = this.world.castShape(
        { x, y: start, z },
        identity,
        { x: 0, y: -1, z: 0 },
        shape,
        start + 1,
        true,
        undefined,
        undefined,
        undefined,
        entry.body,
      );
      if (hit) height = Math.max(height, start - hit.toi);
    }
    return height;
  }

  beginDrag(id: string) {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.dragged = id;
    entry.body.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased, true);
    entry.body.setRotation(identity, true);
    entry.body.setLinvel(zero, true);
    entry.body.setAngvel(zero, true);
    // The pointer places food above its support. Kinematic travel must not
    // inject a large impulse into that support between pointer positions.
    for (let i = 0; i < entry.body.numColliders(); i++)
      entry.body.collider(i).setSensor(true);
    const p = entry.body.translation();
    this.dragTo(id, p.x, p.z);
  }
  dragTo(id: string, x: number, z: number) {
    const entry = this.entries.get(id);
    if (!entry || this.dragged !== id || !Number.isFinite(x + z)) return;
    const [targetX, targetZ] = this.fitPosition(entry.item, x, z);
    x = targetX;
    z = targetZ;
    const y = this.dropHeight(id, x, z) + clearance;
    // Keep the grabbed food above its destination support before releasing it.
    entry.body.setNextKinematicTranslation({ x, y, z });
    entry.body.setNextKinematicRotation(identity);
  }
  private fitPosition(item: PlateItem, x: number, z: number): [number, number] {
    if (this.plateType === "meal-tray")
      return trayPosition(
        [x, z],
        item,
        foodById[item.foodId].defaultPortionGrams,
      );
    const limit = placementRadius(
      this.diameterCm,
      item,
      foodById[item.foodId].defaultPortionGrams,
    );
    const factor = Math.min(1, limit / (Math.hypot(x, z) || 1));
    return [x * factor, z * factor];
  }
  endDrag() {
    if (!this.dragged) return;
    const body = this.entries.get(this.dragged)!.body;
    // Honour the final target even when pointer-up arrives between frames.
    body.setTranslation(body.nextTranslation(), true);
    body.setRotation(identity, true);
    for (let i = 0; i < body.numColliders(); i++)
      body.collider(i).setSensor(false);
    body.setBodyType(RAPIER.RigidBodyType.Dynamic, true);
    body.setLinvel(zero, true);
    body.setAngvel(zero, true);
    this.dragged = null;
    this.wake();
  }
  wake() {
    for (const entry of this.entries.values())
      if (entry.body.isDynamic()) entry.body.wakeUp();
  }
  hasActivity() {
    return [...this.entries.values()].some(
      ({ body }) =>
        body.isKinematic() || (body.isDynamic() && !body.isSleeping()),
    );
  }
  step(delta: number) {
    this.accumulator = Math.min(this.accumulator + delta, 0.1);
    while (this.accumulator >= this.world.timestep) {
      this.world.step();
      this.accumulator -= this.world.timestep;
      for (const [id, entry] of this.entries) {
        const p = entry.body.translation();
        // Controlled placement keeps spilled bodies on the plate, rather than
        // losing selectable food below the scene after an unstable collision.
        if (
          entry.body.isDynamic() &&
          (p.y < -0.5 ||
            (this.plateType === "meal-tray"
              ? !insideWell(trayOutline, p.x, p.z)
              : Math.hypot(p.x, p.z) > plateRadius(this.diameterCm)))
        ) {
          const [x, z] = this.fitPosition(entry.item, p.x, p.z);
          entry.body.setRotation(identity, true);
          entry.body.setTranslation(
            { x, y: this.dropHeight(id, x, z) + clearance, z },
            true,
          );
          entry.body.setLinvel(zero, true);
          entry.body.setAngvel(zero, true);
        }
      }
    }
  }
  pose(id: string): FoodPose | undefined {
    const entry = this.entries.get(id);
    if (!entry) return;
    const p = entry.body.translation(),
      q = entry.body.rotation();
    return { position: [p.x, p.y, p.z], rotation: [q.x, q.y, q.z, q.w] };
  }
  poses(): Record<string, FoodPose> {
    return Object.fromEntries(
      [...this.entries].map(([id]) => [id, this.pose(id)!]),
    );
  }
  bounds(id: string) {
    const e = this.entries.get(id)!,
      p = e.body.translation(),
      q = e.body.rotation();
    const rotation = new Quaternion(q.x, q.y, q.z, q.w);
    return e.hulls.flatMap((hull) =>
      Array.from({ length: hull.length / 3 }, (_, i) =>
        new Vector3(hull[i * 3], hull[i * 3 + 1], hull[i * 3 + 2])
          .applyQuaternion(rotation)
          .add(new Vector3(p.x, p.y, p.z)),
      ),
    );
  }
  dispose() {
    this.world.free();
  }
}
