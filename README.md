# PlateLab

**Build a plate. Discover nutrition.** A cozy, browser-based 3D nutrition playground built from [the product specification](specs.md).

## Run locally

Use Node **24.19.0** (`.nvmrc`), or Node 22.12+.

```sh
npm ci
npm run dev
```

The app has no backend, required credentials, analytics, or runtime data requests. Models, fonts, and nutrition data are bundled. A fresh page starts with an empty plate; reloading clears the current session. This is not yet an installable offline PWA.

## What works

- Fifteen available foods with procedural low-poly models and vector thumbnails. Carrot, banana, apple, and whole milk are disabled for now; their source records are retained.
- A 26 cm default plate, 20/26/32 cm presets, and custom 18–36 cm outer diameters. Plate changes preserve food size and nutrition and support undo.
- Collapsible Plate options with size presets, custom diameter, and Cream, Sage, or Blue ceramic skins. The compact summary shows your current size and skin. Skin changes support undo and preserve food positions, portions, and nutrition.
- A selectable stainless meal tray with five recessed compartments and a fixed 29 × 23 cm footprint. Foods settle against its wells and dividers; a compartment selector provides keyboard movement. Vessel changes preserve portions, cooking settings, and nutrition, and support undo. See the [meal tray guide](docs/meal-tray.md) for dimensions and limits.
- Controlled Rapier physics for every available food: drag onto the curved plate or another food, release to settle/tilt/stack, and undo restores positions and rotations. Removing a support lets upper food fall. Collision shapes follow the food geometry, with separate hulls for tofu blocks, broccoli florets, bread slices, and multiple eggs.
- Search/category filtering; click, tap, keyboard, and drag-to-add.
- Select independent instances, reposition by dragging or buttons, rotate/zoom/reset the camera.
- Small/regular/large portions, a slider, serving increment/decrement, and edible-gram input.
- Broccoli uses compact, lobed florets with short branching stems. Portions add florets instead of enlarging a fixed trio: five illustrative florets at 100 g, ten at 200 g, with a smaller fractional floret between steps. This is a visual quantity cue, not a measured floret-weight conversion.
- Live calorie, protein, carbohydrate, fat, and fiber estimates; inspect each food's preparation, serving conversion, and source.
- Cooking oil experiments for tofu and chicken: As prepared, Sear, Pan-fry, Deep-fry, and Air-fry. Compare reference-food energy with added oil, or expand the details for grams/teaspoons/tablespoons, oil type, and how much of the oil used stays with your serving. Presets are editable example oil amounts, not measured frying absorption or full cooked-food nutrition. Custom oil stays fixed per serving; presets scale with food weight. Cooking changes support undo.
- Remove, clear, and undo the last 30 changes; a 24-item plate capacity.
- Rule-based learning notes without health scores or daily targets.
- Responsive desktop/tablet/mobile layout, reduced motion, keyboard alternatives, accessible help dialog, and a non-WebGL fallback for the nutrition workflow. On mobile, a persistent Add food button opens the searchable shelf in a bottom sheet; picking food closes it and returns to the plate without page scrolling. The sheet supports keyboard dismissal, focus restoration, and its own scroll area.

Food models share a centimetre scale and plausible regular-serving dimensions. Eggs and bread repeat whole pieces; fractional pieces use estimated size. Mounds and weighed solids grow by volume. See [visual dimensions and limits](src/data/visual-scale.md). Save/load, direct comparison, and guided lessons remain future improvements.

To try stacking, drag two or three tofu portions from the shelf onto the same spot, place cheese on bread, or drag chicken onto rice. Every portion moves as one rigid group, including its repeated pieces. Rice and noodles stay cohesive mounds; soft-food deformation and independently tumbling pieces remain future improvements.

Read the [changelog](CHANGELOG.md) for recent changes and the [plate and food physics guide](docs/plate-and-food-physics.md) for local examples, collision behavior, undo, and implementation details.

## Validate

```sh
npm test
npm run build
npm run test:e2e
npm run format:check
```

The browser suite uses `/usr/bin/chromium` if present; otherwise install Playwright's browser with `npx playwright install chromium`. You may set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to another Chromium path. It starts a production preview on port 4173; keep that port free. Chromium uses software rendering in cloud tests, which does not establish performance on consumer hardware.

Production build: `npm run build`. Static-host the generated `dist/` directory at the domain root. No server-side API is required. Use `npm run preview` to inspect the production bundle.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds, tests, and deploys `main` to GitHub Pages. In repository **Settings → Pages**, select **GitHub Actions** as the build source. The intended site address is **https://irawandns.github.io/platelab/**. The workflow can also be launched manually from the repository's Actions tab.

`npm run build:pages` uses `/platelab/` as the asset base, including fonts, the favicon, and the lazy-loaded 3D scene. To verify that production path locally:

```sh
npm run build:pages
PLAYWRIGHT_BASE_PATH=/platelab/ npm run test:e2e
```

Deployments run unit tests, all browser checks, and formatting validation before publishing. Actions are pinned to commit hashes. The build job has read-only repository access; the deployment job has Pages and OIDC permissions. Future pushes to `main` automatically update the site. If Pages is not enabled, enable it in Settings and rerun the workflow. This workflow does not require a personal token or any app secrets.

## Nutrition data

The app uses curated **USDA SR28 (2015)** records plus four **TKPI 2017** Indonesian food records: timun, fried shrimp kerupuk, fresh/raw ikan kembung, and bakwan sayur. See [source provenance and serving conversions](src/data/README.md), including a pinned mirror revision, file checksums, and the exact selected source rows. The data describe historical generic food composition, not a live database or brand-specific lookup.

Missing nutrients remain unknown. Cooked tempeh and fresh/raw ikan kembung have unreported fiber, so a plate containing either shows a known fiber subtotal with `+`. Calories come directly from the source; the separate energy-share bar uses the approximate 4/4/9 factors and is explicitly explained. No displayed bar is a daily target.

## Project structure

- `src/data/foods.json`: local food definitions and provenance.
- `src/lib/nutrition.ts`: portion conversion, totals, formatting, and learning rules.
- `src/lib/store.ts`: plate instances, bounded placement, portions, selection, and undo.
- `src/lib/scale.ts`: physical units, plate diameters, regular-serving dimensions, piece layouts and footprints.
- `src/lib/physics.ts`, `food-shapes.ts`: fixed plate collision surface, shared food geometry/collision hulls, gravity, controlled dragging, and settling.
- `src/components/PlateScene.tsx`, `FoodModel.tsx`: demand-rendered scene, camera, selection, drag interactions, and procedural models.
- `src/components/`: food shelf, portion controls, nutrition dashboard, and illustrations.
- `tests/`: source/data, calculation, state, browser workflow, and accessibility checks.

## Remaining release validation

Read [VALIDATION.md](VALIDATION.md) for executed checks and limits. The 60 FPS target and sub-three-second broadband startup target need measurement on a named reference laptop. Automated accessibility checks are useful coverage, not a replacement for screen-reader and touch-device testing. The app is a working MVP implementation; check the repository's Actions tab to confirm GitHub Pages deployment status.
