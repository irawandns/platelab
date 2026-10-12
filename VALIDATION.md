# MVP validation

## Cooking oil experiments — 2026-10-12

- `npm test`: all 36 tests pass. New coverage audits the three oils against retained USDA nutrient and household-weight rows, checks canonical gram/spoon conversions, reference-plus-oil totals, preset replacement without double counting, preset versus custom portion behavior, retention at 0/50/100%, missing reference nutrients, independent instances, bounded/invalid inputs, live-pose capture, unchanged physics revision, and undo after portion/remove/reset.
- `npm run build` and `npm run build:pages`: pass using Node 22.20.0. `npm run format:check` and `git diff --check`: pass. The `/platelab/` production path is exercised by the browser suite.
- `npm run test:e2e`: all 13 browser checks pass locally in WSL2, with Chromium and SwiftShader software rendering. The preview server and browser required approved execution outside the sandbox because sandboxed preview startup is blocked. New checks cover method presets, collapsed details, grams/teaspoons/tablespoons, oil selection, retained oil including zero, input normalization, fixed custom amounts on portion edits, reset and undo, duplicate foods, clear/undo, mobile width, and the non-WebGL workflow. Automated WCAG A/AA scans also pass with cooking details and retention controls expanded. Existing food movement, stacking, plate size, skin, help, and meal workflows remain passing.
- Reviewed desktop and mobile screenshots (`test-results/cooking-desktop.png` and `cooking-mobile.png`, ignored artifacts). Layout fits the tested 1440 px desktop and 390 px mobile viewports. Consumer-device performance and manual assistive-technology checks remain open.
- Method presets are editable example oil scenarios, not measured absorption rates or complete fried-food records. The reference food preparation remains visible. Water loss, coatings, and other cooking changes are outside this milestone; see the data provenance notes. No new deployment has been made for this feature.

## All-food physics and shelf update — 2026-10-11

- `npm test`: 24 tests pass. The shelf and runtime lookup exclude carrot, banana, apple, and whole milk. Their source records remain archived. Real Rapier simulations cover all eleven available foods on 18/21/26/36 cm plates, minimum and maximum portions with correct edible mass, compound geometry, bread/cheese and tofu stacks, support removal, portion/diameter changes, and pose restoration. A crowded plate containing every available food settles with plate and food contacts within a 0.75 mm penetration tolerance; nutrition is unchanged.
- Every available food is dynamic. Broccoli florets and tofu blocks have separate collision hulls, as do repeated bread slices and eggs; each portion still moves as one rigid group. Visual models and hulls use the same vertex calibration. The plate collider now matches the visible shell's 128 radial segments. Sixteen solver iterations improve crowded contact stability. Dragged food does not impart pointer-speed impulses into its supports; normal contact resumes on release.
- `npm run build`, `npm run build:pages`, `npm run format:check`, and `git diff --check`: pass using Node 22.20.0. The lazy scene chunk is 2.26 MB / 821 kB gzip; total production JavaScript is approximately 1.09 MB gzip. Device startup and frame-rate measurement remain pending.
- `npm run test:e2e`: blocked before browser tests start. The preview server cannot open port 4173 (`listen EPERM: operation not permitted 0.0.0.0:4173`). Browser tests were updated for the eleven-food shelf, avocado search/source disclosure, and crowded-plate settling, but their execution and visual review remain unverified in this sandbox. Soft-food deformation and independently tumbling pieces remain outside this update.

## Controlled physics pilot — 2026-10-11

- `npm test`: 22 tests pass, including real Rapier WASM simulation of calibrated collision hulls, flat-well and shoulder contact on 18/21/26/36 cm plates, three-portion tofu stacking, removal of a support, chicken dragged and settled on rice, non-penetrating food contact within solver tolerance, unchanged nutrition, live-pose capture, portion/diameter resettling, and exact sleeping-pose undo restoration. Non-pilot foods retain the conservative-clearance tests.
- `npm run build`: passes using Node 22.20.0. Rapier 0.12.0 is now an explicit dependency, reusing the version already in the lockfile via Drei. WASM is embedded and adds no remote runtime data request. The lazy scene chunk is approximately 2.26 MB / 821 kB gzip; total production JS is approximately 1.09 MB gzip. This is a material increase over the previous MVP and needs startup/performance measurement on a real device.
- The browser suite now includes a stacked-tofu removal/undo scenario and waits for physics to settle before comparing restored screenshots. Browser execution is still blocked at preview-server startup by the sandbox socket restrictions described below. These new browser checks, touch dragging, visual fidelity, and consumer-device frame rates are **not verified**.
- Scope: rice, chicken breast, and tofu are dynamic; other foods are fixed with approximate piece-box colliders. Rice is a rigid mound and tofu's three blocks remain one rigid portion. There is no soft-food deformation or per-piece simulation in this milestone.

## Ceramic plate update — 2026-10-11

- `npm test`: 15 tests pass, including footprint clearance sampled across all foods at minimum/default/maximum portions on 18/21/26/36 cm plates. Fitting portions remain in the flat well; oversized portions clear the curved ceramic without changing food dimensions or nutrition.
- `npm run build` and `npm run format:check`: pass using Node 22.20.0.
- Browser checks and visual review of the new ceramic model remain pending. The current sandbox rejects preview-server sockets (`listen EPERM`) and Chromium startup (`setsockopt: Operation not permitted`), including a server-free rendering attempt. Earlier screenshots and browser results below apply to the previous plate geometry.

## Previous MVP validation

Validated in the cloud workspace on 2026-10-10 using Node 24.19.0, Linux, and Chromium 151.0.7922.173 with SwiftShader software rendering.

### Automated checks

- `npm test`: 14 passing tests covering all 15 source records, source-backed household weights, milk conversion, meal totals, missing fiber, rounding, duplicate instances, undo/reset, invalid portions, movement bounds, capacity/history limits, physical dimensions, repeated whole pieces, fractional volume scaling, custom plate size, portion-dependent placement, and undo of size plus arrangement.
- `npm run build`: TypeScript checking and production bundling pass.
- `npm run test:e2e`: 8 browser checks against the production bundle cover meal construction, portions, removal/reset/undo, filtering/search, keyboard adding, duplicate instances, source disclosure, missing-fiber display, mobile/reduced motion, modal focus, library drag-and-drop, rejection of off-plate drops, direct 3D movement and undo, no-WebGL fallback, all fifteen models at tablet width, and custom plate diameters with unchanged nutrition, overflow messaging, input bounds and size undo.
- Axe WCAG A/AA scans cover empty, selected-food, and help-dialog states with no automated violations. This is not a declaration of complete accessibility conformance.
- Screenshots are generated under ignored `test-results/` for the empty desktop plate, assembled desktop meal, mobile meal, tablet containing all foods, and two full-sized apples on 26 cm and 36 cm plates. Viewports: 1440×1100, 390×844, and 900×1100. Visual review confirmed the default food-to-plate proportions and repeated whole-piece appearance; food dimensions remain estimates rather than validated physical volume conversions.

### Measured build size

The production JS is split into the UI (~265 kB), scene (~203 kB), and Three.js (~704 kB). Together these are approximately **328 kB gzip**, plus approximately **9.5 kB gzip CSS**. The two Latin variable font files total approximately **62 kB**. Configure compression on the static host; a compressed build-size estimate does not prove network startup performance.

Rendering uses an on-demand frame loop, capped pixel ratio (1.75), simple lighting, no real-time shadows or physics, bounded undo history, and a 24-item capacity. All food assets are procedural and local.

## Open release checks

- Define a reference mid-range laptop, operating system, GPU, and browser version. Measure cold production startup on a specified broadband profile; target <3 seconds.
- Measure frame times while orbiting and dragging typical and 24-item plates; target 60 FPS on that reference device. Do not infer this from SwiftShader results.
- Profile WebGL/JS memory across repeated add/remove/reset cycles on the reference browser.
- Manually evaluate recognizable food silhouettes, touch dragging, screen-reader announcements, keyboard navigation, and zoomed text on real devices. Automated desktop/mobile emulation does not replace that review.
- Consider validating the historical USDA mirror against the official release when the USDA host is reachable. Exact mirrored records, source IDs, checksums, and missing-data behavior are already documented and tested.

A GitHub Pages deployment workflow is included. Local production-path validation uses `/platelab/` to exercise bundled assets and the lazy 3D scene. A public deployment is only confirmed when its Actions run and live URL have been checked. There is no save/load persistence, telemetry, or user study in this implementation.
