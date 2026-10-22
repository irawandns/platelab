# Take a photo

Add food to your plate, then choose **Take photo** beside Save plate. For a neat
arrangement, let the food finish settling first.

- **Warm table** is the default: a cream surface and warm side light.
- **Studio** uses a neutral surface and balanced light.
- **Dark** uses a deep background and bright edges.

Choose **Angled**, **Top view**, or **Current view**. Current view copies your
editor camera into a square photo, so the crop can differ from the wider editor.
The preset angles fit the whole meal, including oversized portions or stacks.

Choose **Download PNG** for a 2048 × 2048 image. It contains the plate and food,
with no controls, selection rings, or nutrition text. Your actual low-poly models
are rendered with soft shadows and reflections; no AI image generation is used.

## Limits

Photo mode uses a separate copy of the meal captured when you open it. Lighting
and angle changes do not edit your plate, nutrition, or undo history. Close photo
mode to continue arranging food; open it again to capture your latest changes.
The separate kitchen playground is outside this feature.

Photo mode needs WebGL. If it cannot start, export is disabled and the meal
controls still work. Preview rendering is capped to reduce cost; export uses the
full resolution only when requested. Actual export speed depends on the browser,
device, number of food pieces, and shadows. No reference-device performance
benchmark or photorealistic food model quality is claimed.

No assets are fetched for backgrounds or studio lighting. Downloads happen
locally in the browser. Photo choices are temporary and are not saved with a meal.
Escape or the close button returns to the plate and restores keyboard focus.
