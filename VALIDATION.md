# MVP validation

## Tablet settlement and PR validation — 2026-10-13

- The merged PR #5 deployment failed its tablet/all-eleven-models settlement assertion. Its earlier local suite and PR workflow had passed; this distinction and the E2E-before-PR requirement are recorded in `AGENTS.md`, with links to both workflow runs.
- `npm test`: all 45 tests pass. New regressions compare actual instanced broccoli vertices with collision hull bounds at fractional, regular, large, and maximum portions, and exercise a demand loop that stops on the step that puts its food to sleep.
- `npm run build:pages`: passes with Node 24.19.0. Broccoli now uses seven instanced meshes per portion instead of 35 at 100 g or 105 at 300 g. Physics advances before pose readers and reports activity after stepping; collider calibration and simulation parameters are preserved.
- All 20 browser tests pass against the production `/platelab/` build. The tablet scenario, stack/removal/exact-image undo scenario, and each of four accessibility states also pass three consecutive targeted runs. Settlement assertions retain their 15-second deadlines, and undo still requires two identical consecutive captures matching the original byte for byte.
- Trace investigation found optional artifact captures exceeding the workflow budget and a nested screenshot poll expiring while its inner captures eventually matched. Redundant artifact captures were removed, screenshot polling now captures one frame per attempt, and stack edits wait for their current canvas revisions. Accessibility scans have separate cases with unchanged WCAG tags and assertions.
- Local browser execution uses Chromium 153 with SwiftShader, a temporary preview-host override to `127.0.0.1`, and a 60-second overall test budget for the fallback browser's capture overhead. Individual assertion deadlines, retry settings, and repository CI configuration are unchanged. The official Playwright browser download was unavailable in this environment; these local results do not establish equivalence to GitHub CI, which must pass at the exact PR head with the original configuration before merge.
- Reviewed the crowded-tablet rendering. Hardware frame-rate benchmarks and physical-device validation remain pending; the draw-call reduction is not a measured consumer-device performance result.

## Broccoli and mobile food picking — 2026-10-13

- `npm test`: all 43 tests pass. New checks verify that broccoli portions add florets without enlarging whole florets and preserve estimated volume for fractional portions. Existing checks verify matching model/collision bounds, settling on plates and trays, mass, portion changes, and undo. The two exhaustive physics sweeps have a 15-second runner timeout to accommodate the additional floret hulls; their assertions and simulation step limits are unchanged.
- `npm run build` and `npm run build:pages`: pass using Node 24.19.0. Formatting and whitespace checks pass.
- All 17 browser checks pass against the production `/platelab/` path using Chromium 153 and SwiftShader. A temporary local Playwright configuration overrides only the browser executable and the preview host (`127.0.0.1`), because this execution environment cannot resolve network interfaces for the default all-interface host. The repository's browser scenarios, viewport defaults, and production path are retained.
- Mobile checks cover 390 × 844 and 360 × 640 viewports, food picking from the initial screen without page scrolling, reachability after scrolling, search/filter/reset, close-on-add, Escape/backdrop dismissal, focus restoration, desktop resizing, and the non-WebGL cooking workflow. Automated WCAG A/AA scans pass with the mobile drawer open.
- Visually reviewed the original and updated broccoli, a 200 g cluster, and the mobile initial screen and shelf. Broccoli counts and dimensions remain artistic estimates. Hardware frame-rate/startup benchmarks and physical-device keyboard/screen-reader validation remain outside these automated checks.

## Stainless meal tray — 2026-10-12

- `npm test`: all 42 tests pass. Tray checks cover the five recessed wells and separators, outer footprint and estimated height, placement inside rounded wells, oversized portions, food/cooking/nutrition preservation, live-pose undo, corner wells beyond the previous circular bounds, transfer across dividers, all regular and maximum portions, and a mixed tray.
- `npm run build`: passes using Node 22.20.0. The tray is procedural, with a locally generated environment for metal reflections; it adds no remote runtime asset request.
- Browser suite: all 14 checks pass with local Chromium and SwiftShader. The tray scenario covers vessel selection, keyboard compartment movement, unchanged nutrition, switching back to the ceramic plate, undo, and a 390 px mobile viewport. Existing cooking, stacking, food dragging, size/skin controls, fallback, and automated accessibility checks also pass. The local preview server required approved execution outside the sandbox because sandboxed socket binding is blocked.
- Reviewed `test-results/stainless-tray-empty.png` and `stainless-tray-mobile.png` (ignored screenshot artifacts). The tray matches the supplied five-well layout and displays a thin metallic shell. Well footprints, depth, and material thickness are estimates; the photographed tray's actual dimensions are unknown. See [meal tray dimensions and limits](docs/meal-tray.md).

## Canvas undo checks in CI — 2026-10-12

- The PR #2 and subsequent main workflows passed unit tests, the production build, and formatting, but the browser job failed exact canvas comparisons after food-drag undo and plate-skin undo. CI attachments showed an intermediate empty plate instead of the expected food rendering. In local repetition, the original drag/undo check failed 3 of 6 runs.
- Physics settling is not a rendering-completion signal. The scene now publishes the simulation revision processed by a frame, and visual undo checks wait for the new revision. Baseline, changed, and restored canvas captures must be stable across two consecutive screenshots. Restoration is compared byte-for-byte to the reference with bounded polling. The same helpers cover food movement, stacked-food removal/undo, and plate skins.
- Both CI-failing checks pass all 6 targeted checks (each repeated three times) in the isolated main checkout. All 36 unit tests, the production Pages build, and formatting pass. All 13 production browser checks also pass with the follow-up fix at /platelab/.

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
