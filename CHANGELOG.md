# Changelog

## 2026-10-13 — Indonesian food objects

- Add timun, fried shrimp kerupuk, fresh/raw ikan kembung, and bakwan sayur with procedural models, vector thumbnails, edible-gram portions, and TKPI provenance.
- Add illustrative pieces as timun, kerupuk, and bakwan portions grow, using the existing instanced rendering and calibrated collision geometry.
- Show TKPI links and source codes in food details. Preserve unreported fish fiber and name every food contributing to the known fiber subtotal.
- Extend nutrition, scale, physics, desktop, mobile, and tray checks to cover the expanded fifteen-food shelf.
- Apply initial camera framing before the first ready render and read reduced motion before mounting controls. Screenshot baselines wait for fonts; undo retains exact image assertions with diagnostic captures and three fresh browser regression runs.

## 2026-10-13 — What if? comparison

- Capture a session-only original plate and compare its nutrition with the current meal, including portions and cooking oil. Show signed differences and neutral labels; missing data produces an unknown difference.
- Inspect the original food list, replace the baseline, restore foods, cooking settings, vessel, and arrangement with undo, or finish while keeping the current meal. Comparison capture and finish do not consume undo history or restart physics.
- Add calculation, snapshot restoration, desktop, mobile, non-WebGL, keyboard, and accessibility regression coverage.
- Validate feature branches before opening a PR using the existing production-path workflow; deployment remains limited to main.

## 2026-10-13 — Tablet settlement and PR validation

- Batch repeated broccoli florets into seven instanced meshes per portion, sharing the same calibrated vertices as their collision hulls. This reduces draw calls from 35 at 100 g (105 at 300 g) while preserving the food's appearance and physical dimensions.
- Publish physics activity after stepping the simulation, so the demand render loop commits sleeping poses on the final frame instead of scheduling another frame to discover settlement.
- Wait for the current canvas revision in the tablet regression before checking settlement. Keep its 15-second assertion deadline, overflow, input normalization, and runtime-error checks. Remove optional tablet and stacked-tofu artifact captures from the timed workflows; byte-for-byte undo comparisons, failure screenshots, and traces remain available.
- Give the existing empty, selected-food, plate-options, and help-dialog accessibility scans separate test cases, preserving their WCAG tags and assertions without making four scans compete for one test's runtime budget.
- Synchronize each stack edit with its canvas revision and avoid nesting screenshot polling loops. Undo still requires two consecutive identical captures that match the original image byte for byte, with the original assertion deadlines.
- Add regression checks for render/collision alignment across broccoli portions and final-frame settlement. Record the requirement to pass full production-path E2E tests before creating a PR in `AGENTS.md`.

## 2026-10-13 — Broccoli and mobile food picking

- Replaced the fixed three-piece broccoli with compact florets featuring shorter branching stems and lobed crowns. Larger portions add florets, while fractional portions use a smaller final floret. The count is a visual estimate; nutrient calculations still use edible grams.
- Matched each floret's rendered position, quarter-turn rotation, and scale to its collision hull. The whole portion remains one selectable, undoable rigid body.
- Added an always-reachable mobile Add food button and meal summary. The existing searchable shelf opens in a bottom sheet, scrolls independently, and closes after picking a food without changing the page scroll position. Escape, backdrop dismissal, focus restoration, and resizing back to the desktop shelf are supported.
- Added portion-volume, mobile interaction, and drawer accessibility regression checks, and updated the existing mobile workflow.

## 2026-10-12 — Stainless meal tray

- Added a selectable 29 × 23 cm stainless meal tray with three top wells, a large lower-left well, and a round lower-right well based on the supplied reference. Well dimensions and depth are visual estimates.
- Added tray placement, physical separators and well floors, keyboard compartment selection, and an oversized-portion note. Food retains its physical scale and nutrition.
- Vessel switching captures the previous arrangement for undo, preserves cooking settings and portions, and refits foods to settle on the selected vessel. Ceramic size and color choices are retained.
- Added tray geometry, placement, physics, switching, undo, and mobile browser checks. See the [meal tray guide](docs/meal-tray.md).

## 2026-10-12 — Stable canvas undo checks

- Wait for the simulation revision processed after undo, and use stable canvas captures for visual comparison of dragging, stacked-food removal, and plate skins.
- Keep restoration comparisons byte-for-byte exact while allowing the browser compositor to finish the frame. This fixes the rendering race that blocked CI after the cooking feature merged.

## 2026-10-12 — Cooking oil experiments

- Added cooking method controls for tofu and chicken, with editable example oil amounts for searing, pan-frying, deep-frying, and air-frying. As prepared restores the reference food.
- Added a reference-food / added-oil / with-oil energy comparison and updated selected-food and plate nutrition totals. Oil is added once; method changes replace the previous assumption.
- Added expandable details for soybean, olive, and palm oil, grams/teaspoons/tablespoons, and a user-specified retained percentage for oil used for this portion. Nutrition and spoon weights use audited USDA SR28 rows.
- Presets scale with food weight; custom oil stays fixed for the serving. Duplicate foods have independent settings, and undo restores both settings and food poses. Oil edits preserve the arrangement and do not restart physics.
- Removed the redundant empty-plate prompt and three-step tutorial section; instructions remain in How it works.
- Presets are example scenarios, not measured absorption predictions. Existing reference preparations stay visible; cooking yield, water loss, coatings, and other preparation changes are not estimated.

## 2026-10-11 — Ceramic plate and food stacking

- Replaced the plate with a cream ceramic model inspired by Indonesian household plates, with a curved shoulder, brown rim, fine inner band, and underside foot ring. Outer diameter remains configurable from 18 to 36 cm.
- Added controlled Rapier physics for all eleven available foods. Portions settle, tilt, and stack on the plate and each other. Removing a support allows the foods above it to fall.
- Matched collision hulls to the visible food geometry. Broccoli florets, tofu blocks, repeated bread slices, and multiple eggs have separate hulls within one movable portion.
- Improved crowded-plate contact stability and prevented fast pointer dragging from shoving the food underneath. Undo restores the arrangement, including positions and rotations.
- Removed carrot, banana, apple, and whole milk from the shelf for now. Their nutrition records remain archived; shelf counts and category filters reflect the available foods.
- Preserved nutrition calculations based on edible grams, independent of stacking, rotation, and plate size.
- Added Rapier simulation tests and updated browser scenarios. Twenty-four unit tests, the production build, and formatting checks pass. Browser execution is blocked by this workspace's preview-server socket restrictions.

See the [plate and food physics guide](docs/plate-and-food-physics.md) for usage, implementation, and limits, and [VALIDATION.md](VALIDATION.md) for the executed checks.
