# Performance notes and possible improvements

Measured on 2026-10-15 against source commit
`b11848c26dce74ac25c352d88cc49c187cfb131a`. These notes record a baseline and
possible follow-up work; the proposed optimizations have not been implemented.

The main opportunities are reducing physics startup cost, avoiding complete
physics-world reconstruction on edits, and reducing food draw calls. Low-poly
geometry helps with vertex processing, but does not bound engine download size,
draw-call overhead, collision complexity, or pixel shading cost.

## Environment and measurement limits

- Production command: `npm run build:pages`, using Node **24.19.0** from
  `.nvmrc`. Installed direct dependency versions matched `package-lock.json`.
- CPU probes: AMD Ryzen 7 8700F under WSL2, using the application's real Rapier
  runtime in Node, without rendering. Timings are indicative local samples,
  not a controlled reference-device benchmark.
- Browser probes: headless Chromium from Playwright's `chromium-1248` cache,
  SwiftShader software rendering, a 1440 × 1100 viewport, and reduced motion.
  The production preview used `127.0.0.1:4173/platelab/`; Chromium required
  execution outside the sandbox because sandbox socket operations were blocked.
- Focused browser probes ran successfully. The full browser E2E suite was not
  run for this analysis. These probes do not establish hardware FPS, mobile
  performance, or the sub-three-second broadband startup target.
- The measurements below cover the ceramic plate. The stainless tray needs its
  own rendering and physics benchmark.

## Production bundle baseline

Sizes use decimal kB and MB. Gzip and Brotli sizes describe compressed asset
bodies, excluding HTTP headers and protocol overhead.

| Asset                             | Minified size |          Gzip size |
| --------------------------------- | ------------: | -----------------: |
| UI and application JavaScript     |        299 kB |              93 kB |
| Three.js JavaScript               |        704 kB |             181 kB |
| Scene, physics, and supporting JS |      2,340 kB |             849 kB |
| **Total JavaScript**              |  **3,344 kB** |       **1,124 kB** |
| CSS                               |         39 kB |              11 kB |
| Two requested Latin WOFF2 fonts   |         62 kB | Already compressed |

The complete initial experience transfers approximately **1.20 MB with gzip**,
including the two Latin fonts, CSS, HTML, and favicon. Other font subsets exist
in the build but were not requested for the observed English interface. Brotli
compresses the JavaScript to approximately **872 kB**, if the host serves it.
These sizes do not establish the deployed host's compression or cache behavior.

Rapier's embedded physics runtime is the largest module contributor to the scene
chunk. Food meshes are procedural; there are no separate GLB downloads. The
scene is split through `React.lazy`, but is mounted immediately, so its download
still occurs during startup. Physics initializes even when the plate is empty.

To refresh the size baseline, build with the repository Node version and lockfile,
then record Vite's per-file size output. For Brotli, compress each emitted JS
file separately with Node's `brotliCompressSync` and sum the results. Compression
totals depend on the compressor settings and emitted source state.

## Rendering baseline

The browser probe counted WebGL draw submissions and submitted triangles,
including instanced draws, after the scene settled:

| Scene                                             | Draw calls per frame | Triangles per frame |
| ------------------------------------------------- | -------------------: | ------------------: |
| Empty ceramic plate                               |                    4 |               6,736 |
| All 15 foods, regular portions, one item selected |                  109 |              19,522 |

The mixed scene used the normal shelf buttons in catalog order. The selected
item's ring contributes to the reported counts. After settling, the empty scene
produced **zero additional frames during a 1.5-second observation**. Demand
rendering works in that case.

Food-only counts derived from the shared procedural geometry are:

| Food portion                  | Draw calls | Triangles | Collision hulls |
| ----------------------------- | ---------: | --------: | --------------: |
| Rice, regular                 |         23 |     1,840 |               1 |
| Tempeh, regular               |         16 |     1,212 |               1 |
| Broccoli, regular             |          7 |     2,220 |               5 |
| Broccoli, maximum (300 g)     |          7 |     6,660 |              15 |
| Timun slices, maximum (150 g) |          3 |     8,640 |              15 |

Twenty-four regular rice portions imply **552 food draw calls** and 44,160 food
triangles before vessel and selection rendering. Rice details use separate
meshes and materials. Broccoli already batches repeated florets through
instancing, keeping its draw count fixed as the portion grows. Collision hull
count still grows with the number of florets. See the
[Three.js instancing documentation](https://threejs.org/docs/pages/InstancedMesh.html).

## Physics baseline

The simulation runs at **120 Hz**, with **16 solver iterations**, extra solver
iterations for bread, and continuous collision detection enabled for every food
body. A nominal 60 Hz render update therefore performs two physics steps.
Catch-up is capped at 0.1 seconds of simulation per rendered frame.

The CPU probe created all bodies together on a 26 cm ceramic plate, placing item
`i` at `[((i % 5) - 2) * 0.65, (Math.floor(i / 5) - 2) * 0.65]` in scene units.
These synthetic dense grids differ from the application's normal click-add
layout and did not go through store placement clamping. Each call to
`FoodPhysics.step(1 / 60)` was timed until sleep or 1,800 calls. An isolated
repeat produced:

| Synthetic configuration      | World construction | Physics update p95 | Result within 30 simulated seconds |
| ---------------------------- | -----------------: | -----------------: | ---------------------------------- |
| 15 mixed regular foods       |              41 ms |             5.9 ms | Settled                            |
| 24 regular rice portions     |              83 ms |            11.0 ms | Settled                            |
| 24 maximum broccoli portions |             383 ms |            45.5 ms | Still active                       |

Here p95 means 95% of measured update calls took no longer than that value.
The maximum broccoli case creates **362 colliders**, including the two vessel
colliders. A 60 FPS frame has **16.7 ms for all work**, so physics alone exceeds
that budget in this stress case. These CPU timings are not browser frame times
and do not prove that a normal mixed plate misses the FPS target.

`PlateScene` reconstructs the entire `FoodPhysics` world whenever `sceneRevision`
changes. Adding, removing, or resizing one portion consequently rebuilds the
vessel and the other food colliders as well. This is a likely source of edit-time
work to profile separately from steady-state rendering.

The synthetic settlement result does not establish the cause of the historical
PR #5 browser failure. Preserve meaningful settlement assertions and investigate
render speed, simulation progress, and interaction timing as described in
[`AGENTS.md`](../AGENTS.md).

## Memory observations

A focused probe added broccoli, sliced timun, kerupuk, and bakwan, then cleared
the plate, across five cycles. After explicit garbage collection, live WebGL
buffer handles returned to the empty-scene baseline of eight on each cycle.
No unbounded buffer growth was observed in this limited scenario.

An initial probe held strong references to buffer handles and falsely suggested
retention. The corrected probe used weak references so the measurement did not
keep those handles alive. This is not evidence of complete memory stability:
long sessions, portion changes, vessel switching, undo, WASM memory, and native
GPU allocations still need measurement.

## Possible improvements, in priority order

1. **Update physics bodies incrementally.** Preserve the world and existing
   bodies when adding, removing, or resizing one food. Cache reusable collider
   construction data where safe. Preserve live-pose undo and wake unsupported
   foods after support removal. Measure edit latency and construction time
   before and after the change.
2. **Merge decorative meshes and share geometry.** Start with rice and tempeh.
   Vertex colors can preserve color variation while reducing meshes and
   materials. Reuse geometry across servings; consider broader instancing for
   repeated foods while preserving independent selection. Compare draw counts,
   appearance, and input latency on typical and 24-item plates.
3. **Defer the physics download and initialization.** Render the empty plate
   first and investigate idle prewarming before the first food interaction.
   Evaluate separately cached WASM instead of embedding it in JavaScript.
   Splitting a chunk alone leaves the total payload unchanged; measure both
   cold startup and first-food latency before choosing a loading strategy.
4. **Profile physics settings and collision complexity.** Investigate selective
   CCD, solver work, hull complexity, and contact handling under dense loads.
   Preserve stacking, thin-food contact, portion scale, and settlement assertions;
   reducing iterations without checking those behaviors could regress accuracy.
   Rapier documents these controls in its
   [simulation structures guide](https://rapier.rs/docs/user_guides/javascript/simulation_structures/).
5. **Evaluate adaptive rendering quality.** The current DPR cap of 1.75 still
   renders about 3.06 times as many pixels as DPR 1 at the same CSS dimensions.
   A lower resolution during interaction may help weaker devices. Measure
   hardware frame times and visual quality before changing defaults.

Keep the current strengths: demand rendering, no real-time shadows, bounded
24-item capacity and 30-entry history, and existing instancing. Optimization
should preserve edible-gram nutrition, physical scale, collision alignment,
selection, accessibility alternatives, and undo behavior.

## Follow-up measurement

Use a named laptop and mobile device with recorded OS, GPU, browser version,
viewport, DPR, and power settings. Measure cold production startup under a
defined network profile, first-food latency, add/remove/resize latency, orbit
and drag frame times, settlement duration, and repeated edit/clear/undo memory.
Include typical meals and 24-item plates on both vessels. Compare frame-time
percentiles and long tasks as well as average FPS, and record host compression
and caching. The specification's 60 FPS and broadband startup targets remain
open until that reference-device validation is complete.
