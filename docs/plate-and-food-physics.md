# Ceramic plate and food physics

This update replaces fixed food placement with controlled stacking on a shallow ceramic plate. It also reduces the shelf to eleven foods. It extends the original MVP specification; the current behavior is described here and in the [changelog](../CHANGELOG.md).

## Plate and shelf

The plate follows the supplied Indonesian household plate reference: cream glaze, a brown rolled rim, a fine inner band, and a curved shoulder around a flat eating area. It is one continuous revolved shell with an underside foot ring. The default outer diameter is 26 cm; presets are 20, 26, and 32 cm, and custom diameters range from 18 to 36 cm. Height stays 3.5 cm when diameter changes. The flat eating area spans 70% of the outer diameter.

The available foods are white rice, bread, egg noodles, boiled egg, chicken breast, salmon, firm tofu, tempeh, broccoli, avocado, and cheddar. Carrot, banana, apple, and whole milk have `available: false` in `src/data/foods.json`; their source records remain for later restoration. Disabled foods are excluded from the shelf, runtime lookup, and add actions. Counts and category filters use the available catalog.

Restoring an archived food also requires its visible model, physical dimensions, collision definitions, and tests. Its nutrition record alone does not provide those assets.

## Try it locally

From the project directory, use Node 22.12 or newer:

```sh
npm ci
npm run dev
```

Open `http://localhost:5173`, or the address Vite prints if that port is occupied. After pulling this update, restart the dev server and refresh. The app starts with an empty plate; refreshing clears the session.

1. Drag a bread portion from the shelf onto the plate, then drop cheddar at the same spot. Release and let it settle.
2. Add rice and chicken, then drag the chicken onto the rice. The grabbed portion stays above its destination support and settles when released.
3. Drop two or three tofu portions at the same spot to build a taller stack.
4. Select a lower portion through the food list and remove it. Foods above it fall and settle again. Undo restores the prior positions and rotations.
5. Change a portion or the plate diameter. Foods settle with their updated geometry; undo restores the previous arrangement and values.

Click-to-add, the food list, and movement buttons remain available. Plate diameter, camera position, and food orientation do not affect nutrition; edible grams determine the totals.

## Collision and simulation

One scene unit equals 5 cm. The plate collider combines a fixed flat-well cylinder with a triangle-mesh shoulder following the visible top profile. The shoulder uses 128 radial segments, matching the visible shell. Placement bounds use the outer rim so foods can reach the curved shoulder. Oversized portions are centered.

The visible food meshes and collision hulls share procedural definitions and calibration from their actual vertices. This keeps rotated and irregular models consistent with their collision geometry. Collision mass totals the edible portion weight in kilograms and is distributed among hulls by volume.

| Food shape                         | Collision representation                      |
| ---------------------------------- | --------------------------------------------- |
| Tofu                               | Three block hulls, preserving gaps            |
| Broccoli                           | Three floret hulls, preserving gaps           |
| Multiple eggs or bread slices      | One hull per repeated piece                   |
| Other foods                        | A convex envelope around the portion geometry |
| Flat decorative markings on cheese | Excluded from collision obstacles             |

Each portion is one selectable rigid body. Its blocks, florets, eggs, or slices stay together when moved. Eggs and bread repeat whole pieces as quantity increases; fractional pieces use an estimated smaller model. Other solids and mounds grow by cube-root scaling, so visual volume follows the portion ratio. Regular-serving dimensions are [documented separately](../src/data/visual-scale.md) and remain estimates.

Rapier runs at a fixed 120 Hz timestep with sixteen solver iterations, gravity converted to scene units, friction, damping, and continuous collision detection. Catch-up is capped at 0.1 seconds per rendered frame. Bodies sleep when settled, and the scene stops requesting simulation frames. Portions that fall below or leave the plate are returned to a supported position.

Before adding or moving a portion, its hulls sweep downward from above the existing foods to find support. The starting height accounts for the reach of tilted portions. Dragging temporarily uses sensor colliders so pointer movement does not push other foods; normal solid contact resumes on release. This provides controlled placement while gravity handles the resulting arrangement.

## State and undo

User edits capture live physics positions and quaternions before changing the plate. Undo restores those poses asleep, along with the prior portions, selection, and plate diameter. Portion edits recalculate the affected collision shapes; plate resizing rebuilds the support surface. Removing a portion wakes the remaining arrangement so unsupported food can fall.

Simulation frames do not add undo entries. The existing limits remain: 30 user changes in undo history and 24 portions on the plate. The non-WebGL fallback retains the nutrition workflow.

## Code locations

- [`PlateModel.tsx`](../src/components/PlateModel.tsx): ceramic shell and glaze bands.
- [`scale.ts`](../src/lib/scale.ts): physical units, plate profile, food dimensions, repeated pieces, and placement bounds.
- [`food-shapes.ts`](../src/lib/food-shapes.ts): shared food geometry and calibrated convex hulls.
- [`physics.ts`](../src/lib/physics.ts): Rapier initialization, plate colliders, bodies, support sweeps, dragging, and settling.
- [`PhysicsFood.tsx`](../src/components/PhysicsFood.tsx) and [`PlateScene.tsx`](../src/components/PlateScene.tsx): pointer interaction, live transforms, and demand rendering.
- [`store.ts`](../src/lib/store.ts): live-pose snapshots, edits, and undo restoration.
- [`nutrition.ts`](../src/lib/nutrition.ts) and [`foods.json`](../src/data/foods.json): the available catalog and nutrition records.

## Validation and limits

`npm test` runs 24 tests, including real Rapier WASM simulations. Coverage includes all eleven foods on four plate diameters, minimum and maximum portions, compound mass, a crowded mixed plate, stacked tofu, cheese on bread, support removal, dragging chicken onto rice without shoving the rice, and pose restoration. Contact tests allow up to 0.75 mm penetration as a numerical solver tolerance.

The production build and formatting checks pass. Browser scenarios were updated, but the local sandbox prevents the preview server from opening port 4173, so these browser checks could not run here. The existing GitHub Pages workflow runs the browser suite before deployment. See [VALIDATION.md](../VALIDATION.md) for historical and current results.

Convex hulls approximate uneven surfaces. Rice and noodles remain cohesive rigid mounds; there is no soft-food deformation, loose-grain simulation, or independently tumbling piece simulation. Automated checks do not establish frame rate, memory use, touch behavior, or startup speed on a consumer device. The physics-enabled production JavaScript is approximately 1.09 MB gzip, so those measurements remain release work.
