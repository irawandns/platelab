# MVP validation

Validated in the cloud workspace on 2026-10-10 using Node 24.19.0, Linux, and Chromium 151.0.7922.173 with SwiftShader software rendering.

## Automated checks

- `npm test`: 14 passing tests covering all 15 source records, source-backed household weights, milk conversion, meal totals, missing fiber, rounding, duplicate instances, undo/reset, invalid portions, movement bounds, capacity/history limits, physical dimensions, repeated whole pieces, fractional volume scaling, custom plate size, portion-dependent placement, and undo of size plus arrangement.
- `npm run build`: TypeScript checking and production bundling pass.
- `npm run test:e2e`: 8 browser checks against the production bundle cover meal construction, portions, removal/reset/undo, filtering/search, keyboard adding, duplicate instances, source disclosure, missing-fiber display, mobile/reduced motion, modal focus, library drag-and-drop, rejection of off-plate drops, direct 3D movement and undo, no-WebGL fallback, all fifteen models at tablet width, and custom plate diameters with unchanged nutrition, overflow messaging, input bounds and size undo.
- Axe WCAG A/AA scans cover empty, selected-food, and help-dialog states with no automated violations. This is not a declaration of complete accessibility conformance.
- Screenshots are generated under ignored `test-results/` for the empty desktop plate, assembled desktop meal, mobile meal, tablet containing all foods, and two full-sized apples on 26 cm and 36 cm plates. Viewports: 1440×1100, 390×844, and 900×1100. Visual review confirmed the default food-to-plate proportions and repeated whole-piece appearance; food dimensions remain estimates rather than validated physical volume conversions.

## Measured build size

The production JS is split into the UI (~265 kB), scene (~203 kB), and Three.js (~704 kB). Together these are approximately **328 kB gzip**, plus approximately **9.5 kB gzip CSS**. The two Latin variable font files total approximately **62 kB**. Configure compression on the static host; a compressed build-size estimate does not prove network startup performance.

Rendering uses an on-demand frame loop, capped pixel ratio (1.75), simple lighting, no real-time shadows or physics, bounded undo history, and a 24-item capacity. All food assets are procedural and local.

## Open release checks

- Define a reference mid-range laptop, operating system, GPU, and browser version. Measure cold production startup on a specified broadband profile; target <3 seconds.
- Measure frame times while orbiting and dragging typical and 24-item plates; target 60 FPS on that reference device. Do not infer this from SwiftShader results.
- Profile WebGL/JS memory across repeated add/remove/reset cycles on the reference browser.
- Manually evaluate recognizable food silhouettes, touch dragging, screen-reader announcements, keyboard navigation, and zoomed text on real devices. Automated desktop/mobile emulation does not replace that review.
- Consider validating the historical USDA mirror against the official release when the USDA host is reachable. Exact mirrored records, source IDs, checksums, and missing-data behavior are already documented and tested.

A GitHub Pages deployment workflow is included. Local production-path validation uses `/platelab/` to exercise bundled assets and the lazy 3D scene. A public deployment is only confirmed when its Actions run and live URL have been checked. There is no save/load persistence, telemetry, or user study in this implementation.
