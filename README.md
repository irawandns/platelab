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

- Fifteen foods with procedural low-poly models and vector thumbnails.
- Search/category filtering; click, tap, keyboard, and drag-to-add.
- Select independent instances, reposition by dragging or buttons, rotate/zoom/reset the camera.
- Small/regular/large portions, a slider, serving increment/decrement, and edible-gram input.
- Live calorie, protein, carbohydrate, fat, and fiber estimates; inspect each food's preparation, serving conversion, and source.
- Remove, clear, and undo the last 30 changes; a 24-item plate capacity.
- Rule-based learning notes without health scores or daily targets.
- Responsive desktop/tablet/mobile layout, reduced motion, keyboard alternatives, accessible help dialog, and a non-WebGL fallback for the nutrition workflow.

The current implementation uses illustrative cube-root model scaling. Repeated-piece portion visuals, save/load, direct comparison, and guided lessons remain future improvements.

## Validate

```sh
npm test
npm run build
npm run test:e2e
npm run format:check
```

The browser suite uses `/usr/bin/chromium` if present; otherwise install Playwright's browser with `npx playwright install chromium`. You may set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to another Chromium path. It starts a production preview on port 4173; keep that port free. Chromium uses software rendering in cloud tests, which does not establish performance on consumer hardware.

Production build: `npm run build`. Static-host the generated `dist/` directory at the domain root. No server-side API is required. Use `npm run preview` to inspect the production bundle.

## Nutrition data

The app uses curated **USDA SR28 (2015)** records. See [source provenance and serving conversions](src/data/README.md), including a pinned mirror revision, file checksums, and the exact selected source rows. This is historical generic composition data, not a live database or brand-specific lookup.

Missing nutrients remain unknown. Cooked tempeh's fiber is unreported, so a plate containing it shows a known fiber subtotal with `+`. Calories come directly from the source; the separate energy-share bar uses the approximate 4/4/9 factors and is explicitly explained. No displayed bar is a daily target.

## Project structure

- `src/data/foods.json`: local food definitions and provenance.
- `src/lib/nutrition.ts`: portion conversion, totals, formatting, and learning rules.
- `src/lib/store.ts`: plate instances, bounded placement, portions, selection, and undo.
- `src/components/PlateScene.tsx`, `FoodModel.tsx`: demand-rendered scene, camera, selection, drag interactions, and procedural models.
- `src/components/`: food shelf, portion controls, nutrition dashboard, and illustrations.
- `tests/`: source/data, calculation, state, browser workflow, and accessibility checks.

## Remaining release validation

Read [VALIDATION.md](VALIDATION.md) for executed checks and limits. The 60 FPS target and sub-three-second broadband startup target need measurement on a named reference laptop. Automated accessibility checks are useful coverage, not a replacement for screen-reader and touch-device testing. The app is a working MVP implementation; no production deployment has been performed.
