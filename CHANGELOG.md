# Changelog

## 2026-10-11 — Ceramic plate and food stacking

- Replaced the plate with a cream ceramic model inspired by Indonesian household plates, with a curved shoulder, brown rim, fine inner band, and underside foot ring. Outer diameter remains configurable from 18 to 36 cm.
- Added controlled Rapier physics for all eleven available foods. Portions settle, tilt, and stack on the plate and each other. Removing a support allows the foods above it to fall.
- Matched collision hulls to the visible food geometry. Broccoli florets, tofu blocks, repeated bread slices, and multiple eggs have separate hulls within one movable portion.
- Improved crowded-plate contact stability and prevented fast pointer dragging from shoving the food underneath. Undo restores the arrangement, including positions and rotations.
- Removed carrot, banana, apple, and whole milk from the shelf for now. Their nutrition records remain archived; shelf counts and category filters reflect the available foods.
- Preserved nutrition calculations based on edible grams, independent of stacking, rotation, and plate size.
- Added Rapier simulation tests and updated browser scenarios. Twenty-four unit tests, the production build, and formatting checks pass. Browser execution is blocked by this workspace's preview-server socket restrictions.

See the [plate and food physics guide](docs/plate-and-food-physics.md) for usage, implementation, and limits, and [VALIDATION.md](VALIDATION.md) for the executed checks.
