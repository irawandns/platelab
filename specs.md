# PlateLab — Product Specification

**Version:** 1.1  
**Status:** MVP implementation specification — reference-device validation pending  
**Platform:** Desktop-first responsive web application  
**Product Type:** Interactive 3D nutrition education playground  
**Visual Style:** Cozy Low-Poly 3D

---

## 1. Product Overview

### 1.1 Description

PlateLab is a playful, interactive 3D web application that helps users explore food and understand nutrition by building virtual meals.

Users select stylized low-poly food objects, place them onto a virtual 3D plate, adjust portion sizes, and instantly see estimated calories and nutritional information.

Unlike traditional calorie-tracking applications, PlateLab prioritizes **curiosity, experimentation, visual learning, and playful interaction** over dieting or food restriction.

### 1.2 Tagline

**Build a plate. Discover nutrition.**

### 1.3 Product Goals

- Make nutritional information easier to understand through visual interaction.
- Allow users to experiment with food combinations.
- Demonstrate how food portions affect nutritional values.
- Create an enjoyable, game-like educational experience.
- Deliver a lightweight, performant browser-based 3D application.

### 1.4 Non-Goals

PlateLab is not intended to:

- Prescribe diets or meal plans.
- Provide medical or personalized dietary advice.
- Judge food as inherently good or bad.
- Require users to track their daily calorie intake.
- Replace professional nutrition advice.

---

## 2. Target Users

### Primary Audience

**Nutrition-curious individuals**

People who want to understand the nutritional composition of familiar foods without using complicated tracking tools.

### Secondary Audience

**Students and casual learners**

People learning about calories, macronutrients, food portions, and meal composition.

### Primary User Motivation

> "I want to see what happens to the nutrition of my meal when I add, remove, or change portions of different foods."

---

## 3. Product Principles

| Principle      | Description                                             |
| -------------- | ------------------------------------------------------- |
| Playful        | Food interaction should feel like a small sandbox game. |
| Visual         | Use 3D objects and clear nutrition graphics.            |
| Immediate      | Nutritional feedback updates with every change.         |
| Educational    | Explain what nutritional values mean.                   |
| Lightweight    | Prioritize efficient models and rendering.              |
| Non-Judgmental | Encourage exploration without food shaming.             |
| Accessible     | Provide alternatives to mouse-driven 3D interactions.   |

---

## 4. MVP Feature Specifications

### 4.1 Interactive 3D Plate

**Priority:** P0 — Required

The plate is the primary interaction area.

#### Functional Requirements

- Display a stylized 3D plate in the center of the interface.
- Default to a 26 cm outer diameter. Offer 20/26/32 cm presets and a custom 18–36 cm diameter in 0.1 cm steps.
- Keep food dimensions and nutrient estimates unchanged when plate size changes. Make plate-size changes undoable.
- Support adding food items to the plate.
- Allow users to select individual food objects.
- Allow users to reposition food objects.
- Support removal of individual food items.
- Support resetting the entire plate.
- Provide basic camera rotation and optional zoom.
- Display smooth, lightweight placement animations.

#### Interaction Behavior

1. User selects food from the food library.
2. User drags food toward the plate.
3. The application highlights the valid placement area.
4. User drops the food onto the plate.
5. The food appears at the selected position.
6. Nutritional information updates immediately.

Provide click-to-add as an alternative to drag-and-drop.

#### Constraints

- Clamp food placement using the current plate's eating area and the selected portion's footprint. If a portion is larger than the eating area, center it and explain the overflow; never shrink food to fit a plate.
- Food objects must be individually selectable.
- Model scale should remain visually recognizable.
- Models should avoid expensive physics simulations.
- Food positions should not affect nutritional calculations.

### 4.2 Food Library

**Priority:** P0 — Required

A browsable library containing available 3D food objects.

#### Food Categories

- Carbohydrates
- Protein Sources
- Vegetables
- Fruits
- Dairy
- Other Foods

These are browsing categories, not strict nutritional classifications.

#### Initial Food Collection

| Food                   | Default Serving |
| ---------------------- | --------------- |
| White rice, cooked     | 100 g           |
| Bread                  | 1 slice         |
| Noodles, cooked        | 100 g           |
| Egg, boiled            | 1 egg           |
| Chicken breast, cooked | 100 g           |
| Salmon, cooked         | 100 g           |
| Tofu                   | 100 g           |
| Tempeh                 | 100 g           |
| Broccoli               | 100 g           |
| Carrot                 | 100 g           |
| Avocado                | 100 g           |
| Banana                 | 1 medium        |
| Apple                  | 1 medium        |
| Milk                   | 200 ml          |
| Cheese                 | 30 g            |

Serving quantities must be backed by explicit gram-weight or milliliter conversion data. Cooking states must be represented consistently.

#### Functional Requirements

- Display food thumbnails or small 3D previews.
- Show food names.
- Support category filtering.
- Support searching by food name.
- Allow a food to be added multiple times.
- Use consistent food IDs across the UI and data layer.

### 4.3 Portion Size Controls

**Priority:** P0 — Required

Users can adjust portions after adding food to the plate.

#### Controls

- Preset options: Small, Regular, Large.
- Optional numeric serving or gram-based input.
- Increment/decrement controls for countable foods.
- Real-time portion feedback.

#### Behavior

- Changing portions updates nutritional values immediately.
- Portion changes visually affect the food's appearance.
- Countable foods must use additional whole pieces rather than enlarging a single whole food. Fractional remainders may use estimated smaller pieces.
- Foods can define their own valid portion ranges.
- Portion changes must preserve nutrient calculation accuracy relative to the data source.

**Important:** Visual scale is a core educational requirement. Use shared centimetre coordinates and plausible dimensions for each default serving. Anchor dimensions to source household measures where available. Other food dimensions are explicit visual estimates, not measured physical volumes or weights; edible grams remain authoritative for nutrition.

### 4.4 Nutrition Dashboard

**Priority:** P0 — Required

A real-time dashboard displaying the estimated nutritional composition of the assembled plate.

#### Metrics

| Metric        | Unit |
| ------------- | ---- |
| Calories      | kcal |
| Protein       | g    |
| Carbohydrates | g    |
| Total Fat     | g    |
| Fiber         | g    |

#### Functional Requirements

- Calculate total nutritional values for the entire plate.
- Update when food is added, removed, or resized.
- Display calories prominently.
- Display macronutrients using labeled progress bars or charts.
- Provide food-level nutritional information when selected.
- Display an empty state when the plate contains no food.
- Clearly label all results as estimates.

#### Calculation Logic

For nutrients stored per 100 g:

`nutrient_total = Σ (nutrient_per_100g × portion_grams / 100)`

This calculation applies to calories, protein, carbohydrates, fat, and fiber independently.

For countable or volume-based serving sizes, convert the chosen serving to its corresponding weight using food-specific conversion data.

Use unrounded values internally and round only for display.

### 4.5 Food Information Panel

**Priority:** P0 — Required

When a food is selected, display:

- Food name
- Food category
- Selected portion
- Estimated calories
- Protein, carbohydrates, fat, and fiber
- Short educational description

#### Example

**Egg — Boiled**

- Portion: 1 egg
- Nutritional values: calculated from the food database
- Educational note: "Eggs contain protein and nutrients including choline."

Educational text should be factual, simple, and non-judgmental.

### 4.6 Meal Insights

**Priority:** P1 — Desired

Generate contextual learning messages based on the current meal composition.

#### Examples

- "This plate contains several sources of protein."
- "Try adding vegetables and see how the fiber value changes."
- "Notice what happens to the total energy when you double the rice portion."
- "Compare the nutrition of tofu and chicken."

#### Requirements

- Insights should explain relationships between foods and nutrients.
- Messages should respond to meal composition.
- Avoid arbitrary "healthy meal" scores.
- Avoid implying that a single meal determines overall dietary health.
- Use transparent, rule-based insights in the MVP.

### 4.7 Reset Plate

**Priority:** P0 — Required

Users can clear the current plate.

#### Behavior

- Reset removes all placed food objects.
- Nutritional totals return to zero.
- The application restores the default plate state.
- A simple undo action should be available for accidental removal or reset.

---

## 5. Core User Flow

### 5.1 First-Time Experience

1. User opens PlateLab.
2. A short introductory message explains the interaction.
3. User sees an empty 3D plate.
4. The food library displays available items.
5. User adds their first food.
6. The nutrition dashboard updates.
7. User experiments with portions and combinations.
8. User discovers nutritional relationships through interactive feedback.

### 5.2 Main Interaction Loop

**Discover → Add → Adjust → Observe → Compare → Experiment**

This loop is the foundation of the application experience.

### 5.3 Example Scenario

A user wants to understand the nutrition of a common meal.

1. Adds white rice.
2. Adds chicken breast.
3. Adds broccoli.
4. Observes the total calories and macronutrients.
5. Doubles the rice portion.
6. Notices how total calories and carbohydrates change.
7. Replaces chicken with tofu.
8. Compares the nutritional differences.

The objective is learning through experimentation, not logging consumption.

---

## 6. UI/UX Specification

### 6.1 Main Screen Layout

**Desktop Layout**

Three primary regions:

#### Left — Food Library

Contains:

- Food search
- Category filters
- Food items with thumbnail previews
- Food names
- Add-to-plate interactions

#### Center — 3D Playground

Contains:

- Interactive 3D plate
- Placed food objects
- Camera and zoom controls
- Selected food indicator
- Portion controls
- Empty plate instructions

#### Right — Nutrition Dashboard

Contains:

- Total calories
- Macronutrient breakdown
- Nutrient visualizations
- Selected food information
- Educational insights

### 6.2 Responsive Design

**Desktop (≥ 1024 px)**

- Three-column layout.
- 3D plate receives the largest available area.
- Food library and nutrition dashboard remain visible.

**Tablet (768–1023 px)**

- Plate remains the primary visible element.
- Food library may be collapsible.
- Nutrition information appears in a secondary panel.

**Mobile (under 768 px)**

- 3D plate appears at the top.
- Food library uses a bottom drawer or horizontal list.
- Nutrition information appears below the plate or in a tab.
- Support tap-to-add.
- Do not require precise 3D dragging.

### 6.3 Visual Style

**Art Direction:** Cozy Low-Poly 3D

#### Characteristics

- Simple geometric silhouettes
- Softly faceted food objects
- Rounded forms where useful
- Flat or lightly shaded materials
- Pastel and warm color combinations
- Minimal texture usage
- Soft lighting and subtle shadows
- Playful but restrained animation

#### Suggested Color Palette

| Usage      | Color     |
| ---------- | --------- |
| Primary    | `#77BFA3` |
| Secondary  | `#FFD38A` |
| Accent     | `#FF9478` |
| Background | `#F8F7F2` |
| Surface    | `#FFFFFF` |
| Text       | `#29332E` |

These values are initial design tokens and may change during visual exploration.

### 6.4 Animation Principles

- Food placement: gentle scale-up and settle.
- Food selection: subtle outline or lift.
- Nutrition changes: smooth value transitions.
- Food removal: short shrink or fade.
- Camera movement: controlled easing.

Avoid unnecessary particle effects and heavy simulations.

Respect the user's reduced-motion preference.

---

## 7. 3D Asset Specification

### 7.1 Asset Style

All food models should follow a consistent low-poly visual language.

#### Guidelines

- Use simple geometric forms.
- Prioritize recognizable silhouettes.
- Minimize polygon counts.
- Favor flat colors over large textures.
- Use shared materials where possible.
- Avoid photorealistic shaders.
- Reuse common geometry and materials.
- Maintain consistent proportions and orientation.
- Calibrate each default serving to documented dimensions against the plate, including matching one egg serving to one egg model.

### 7.2 Asset Formats

**Preferred:** GLB / glTF

Additional option: Procedural geometry generated directly in code.

### 7.3 Asset Performance Targets

Initial targets, subject to browser testing:

- Prefer approximately 300–1,500 triangles per food object.
- Keep food asset files small, ideally under 100 KB each when practical.
- Minimize materials and draw calls.
- Use geometry and material reuse.
- Load assets on demand when beneficial.
- Avoid high-resolution textures.

These are optimization targets, not strict artistic limits.

### 7.4 Asset Pipeline

1. Define a food's recognizable silhouette.
2. Create or generate its low-poly mesh.
3. Apply the shared material palette.
4. Set consistent size and origin.
5. Export to GLB if not procedural.
6. Optimize geometry and materials.
7. Validate rendering and appearance.
8. Associate the model with a food database ID.

### 7.5 Portion Visualization

Use food-specific portion strategies.

- **Piece-based:** Eggs, apples, bananas.
- **Stacked slices:** Bread.
- **Cluster-based:** Broccoli, strawberries.
- **Mound-based:** Rice, noodles.
- **Volume-based representation:** Milk, sauces.
- **Scale-based:** Chicken, tofu, salmon.

A numeric portion label remains the authoritative representation of quantity.
Whole pieces retain their dimensions when counts increase. Fractional pieces use cube-root estimated size. Mounds and weighed solid foods use cube-root scaling so doubling grams doubles estimated model volume. Milk uses a fixed-size glass with a changing liquid level.

---

## 8. Technical Specification

### 8.1 Recommended Technology Stack

| Layer                | Technology                            |
| -------------------- | ------------------------------------- |
| Framework            | React + TypeScript                    |
| Build Tool           | Vite                                  |
| 3D Rendering         | Three.js                              |
| React 3D Integration | React Three Fiber                     |
| 3D Utilities         | Drei                                  |
| Styling              | Tailwind CSS                          |
| State Management     | Zustand                               |
| Animation            | CSS / lightweight animation utilities |
| Data Storage         | Local JSON                            |
| Deployment           | Static hosting                        |

This is a suggested stack, not a mandatory dependency list.

### 8.2 Application Architecture

Separate the system into five logical parts:

**UI Layer**

Responsible for the food library, selected food controls, navigation, and nutritional dashboard.

**3D Scene Layer**

Responsible for rendering, picking, camera interactions, and visual representations.

**Application State**

Responsible for managing foods placed on the plate, their portions, selections, and positions.

**Nutrition Engine**

Responsible for nutritional calculations and aggregation.

**Food Data Layer**

Responsible for food definitions, portion conversions, educational descriptions, and model references.

### 8.3 Rendering Requirements

- Render the scene using WebGL.
- Avoid continuous rendering when the scene is idle where practical.
- Cap device pixel ratio on high-density screens.
- Prefer simple lighting.
- Minimize real-time shadow calculations.
- Dispose of unused geometries and materials.
- Avoid full React UI rerenders for every camera movement.

### 8.4 Performance Goals

Initial acceptance targets for a defined mid-range laptop/browser test environment:

- Interactive initial experience: target under 3 seconds on a typical broadband connection after measuring a production build.
- Smooth interaction: target 60 FPS on the reference desktop device.
- Avoid noticeable input delay when adding food.
- Keep memory usage stable during repeated add/remove actions.
- Maintain acceptable usability on mobile devices.

Record actual measurements and revise these targets after testing.

### 8.5 Offline and Backend Strategy

The MVP should not require a backend.

- Store food and nutrition data locally.
- Perform calculations on the client.
- Do not require user registration.
- Do not require cloud synchronization.
- Optionally preserve the current plate in browser local storage.

---

## 9. Data Models

### 9.1 Food Definition

```ts
interface Food {
  id: string;
  name: string;
  category: FoodCategory;

  modelId: string; // Stable procedural model key in the MVP; GLB paths may follow.

  defaultPortionGrams: number;
  minPortionGrams: number;
  maxPortionGrams: number;

  nutrientsPer100g: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number | null; // Unknown is distinct from zero.
  };

  nutritionSource: {
    database: string;
    id: string;
    description: string;
    url: string;
  };
  servingLabel: string;
  conversionNote: string;
  countable: boolean;
  preparation: string;
  educationalDescription: string;
}
```

### 9.2 Plate Item

```ts
interface PlateItem {
  instanceId: string;
  foodId: string;

  portionGrams: number;

  position: [number, number, number];
  rotation: [number, number, number];
}
```

### 9.3 Plate State

```ts
interface PlateState {
  items: PlateItem[];

  selectedItemId: string | null;
}
```

### 9.4 Nutrition Summary

```ts
interface NutritionSummary {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}
```

### 9.5 Data Quality Requirements

- Each food must include a documented nutrition source.
- Preparation state must be clear (raw, cooked, boiled, etc.).
- Nutrition values must use consistent units.
- Per-serving conversions must be verified.
- All numbers should be treated as estimates.
- Values should preferably come from established food-composition databases, such as USDA FoodData Central or applicable Indonesian food-composition data.
- When a food lacks sufficient data, it should not be silently assigned invented nutrient values.

---

## 10. Educational Experience

### 10.1 Learning Topics

The initial educational content should focus on:

- Understanding calories
- Understanding protein
- Understanding carbohydrates
- Understanding dietary fat
- Understanding fiber
- Comparing food portions
- Understanding how meal composition changes nutritional totals

### 10.2 Learning Through Interaction

Avoid long instructional pages.

Prefer contextual explanations triggered by actions.

**Example**

When a user doubles their rice portion:

"Your rice portion doubled. Notice how its carbohydrate contribution and estimated calories increased."

### 10.3 Feedback Guidelines

Use neutral educational language.

Preferred:

- "Explore what happens when..."
- "This food contributes..."
- "Compare these two portions..."
- "Try another combination."

Avoid:

- "Bad food"
- "Unhealthy choice"
- "Too many calories"
- "You should not eat this"

---

## 11. Accessibility Requirements

- Provide a keyboard-accessible method for adding food.
- Provide non-drag controls for item positioning and removal.
- Use visible focus indicators.
- Maintain readable contrast for text and controls.
- Do not rely on color alone for nutrient information.
- Show nutrient values as text in addition to charts.
- Respect reduced-motion settings.
- Provide accessible labels for food models and controls.
- Ensure core nutritional information remains accessible without interacting directly with the 3D scene.

---

## 12. MVP Scope

### P0 — Required for First Release

- Interactive low-poly 3D plate
- Initial 15-food library
- Add/remove foods
- Position foods on the plate
- Portion adjustment
- Real-time calorie calculation
- Protein, carbohydrate, fat, and fiber calculation
- Nutrition dashboard
- Food information panel
- Plate reset with basic undo for removal and reset
- Responsive interface
- Basic accessibility support
- Lightweight asset and rendering optimization

### P1 — After Core Experience Works

- Meal insights
- Extended undo/redo history (basic undo is P0)
- Food comparison
- Save/load plate (implemented: Save plate and Saved plates beside the plate)
- Improved animations
- Additional food models
- Guided first-time experience

### P2 — Future Exploration

- Nutrition mini-games
- Interactive challenges
- Educational quests
- Meal presets
- Plate sharing
- Expanded micronutrient data
- Food discovery collections
- Personalized learning progress

---

## 13. Acceptance Criteria

The MVP is considered functionally complete when:

- [x] Users can open the application and see an empty 3D plate.
- [x] Users can browse the food library.
- [x] Users can add a food to the plate through drag-and-drop or click-to-add.
- [x] Added food appears as a recognizable low-poly model.
- [x] Users can select and reposition an individual food.
- [x] Users can change food portions.
- [x] Portion changes affect estimated nutritional values correctly.
- [x] Nutrition totals reflect all foods currently on the plate.
- [x] Nutritional values update without a page reload.
- [x] Users can remove individual foods.
- [x] Users can reset the entire plate.
- [x] Users can inspect food-level nutrition information.
- [x] The experience is usable on desktop, tablet, and mobile.
- [x] Essential functionality is keyboard accessible.
- [x] The application operates without a backend.
- [x] No unsupported nutritional values are presented as factual.
- [ ] Performance is measured against the reference device and documented targets.

---

## 14. Success Metrics

### Usability

- Users can add their first food without substantial instruction.
- Users can understand how to adjust portions.
- Users can identify where calories and macronutrients are displayed.

### Engagement

- Average number of foods explored per session.
- Number of portion adjustments per session.
- Percentage of sessions with multiple food combinations.
- Number of nutrition detail interactions.

### Learning

- Users can explain how changing portions affects nutrient totals.
- Users can identify the main nutrient differences between two food combinations.
- Users report that the visualization helps them understand nutrition.

---

## 15. Implementation Phases

### Phase 1 — Core 3D Playground

Build the plate scene, camera, food placement, selection, and removal.

**Deliverable:** A usable 3D food sandbox.

### Phase 2 — Nutrition Engine

Implement the food database, portion calculations, and live nutrition dashboard.

**Deliverable:** An interactive nutritional visualizer.

### Phase 3 — Educational Layer

Add explanatory content, food details, and contextual insights.

**Deliverable:** A nutrition learning experience.

### Phase 4 — Polish and Optimization

Improve responsiveness, accessibility, visual consistency, animations, and rendering performance.

**Deliverable:** A release-ready MVP.

---

## 16. Future Vision

PlateLab can eventually evolve into a lightweight, browser-based learning environment where users understand nutrition by playing with food.

Future experiences may include educational challenges, food comparisons, and guided experiments.

The long-term direction should preserve the core principle:

**Learning nutrition should feel like exploration, not homework or dieting.**

---

## 17. Final Product Definition

**Product:** PlateLab  
**Category:** Interactive Nutrition Education  
**Platform:** Web  
**Experience:** 3D Sandbox / Semi-Game  
**Art Style:** Cozy Low-Poly  
**Core Mechanic:** Build and experiment with a virtual food plate  
**Primary Value:** Visualize and understand nutrition through interaction  
**MVP Priority:** Lightweight rendering, intuitive interaction, accurate nutritional estimates

**Product Statement:**

PlateLab is a lightweight, playful 3D nutrition playground where users build virtual meals using stylized low-poly food objects, adjust portions, and instantly explore estimated calories and nutritional composition through visual experimentation.

---

## 18. Implementation Clarifications (v1.2)

These refinements preserve the product's educational focus while resolving ambiguity in the original draft.

- **MVP implementation:** React + TypeScript + Vite, React Three Fiber/Three.js, Drei camera controls, Zustand, and ordinary CSS. Procedural geometry avoids an external model pipeline; vector thumbnails share its silhouettes. Fonts, food data, and models are bundled locally. No backend or API key is required.
- **Undo:** Basic undo is P0 because accidental removal/reset recovery was already a required behavior in §4.7. The implementation retains the last 30 changes; redo remains outside this release.
- **Portions:** Small = 0.5×, Regular = 1×, Large = 2× of the defined serving. Foods allow 0.25×–3×, including a gram input. Count controls adjust by one source-defined serving. Edible weight drives every calculation, including milk. Apples, eggs, bananas and bread repeat whole pieces, with a smaller estimated piece for fractional remainders. Mounds and weighed solids use cube-root volume scaling. A fixed-size glass changes fill level for milk.
- **Physical scale and plate size:** One scene unit equals 5 cm. The default plate is 26 cm across the outer rim. Presets are 20/26/32 cm; custom diameter is 18–36 cm in 0.1 cm steps. All food models use explicit regular-serving dimensions in `src/lib/scale.ts`. Apple's 7.62 cm diameter is source-backed; banana's curved dimensions approximate its source length. Other dimensions are visual estimates documented in `src/data/visual-scale.md`. Plate diameter affects geometry, drop acceptance and placement, never food size or nutrition. Camera framing fits the maximum supported diameter and stays fixed when changing plate size. Clear plate retains the chosen diameter; undo restores diameter and food positions together.
- **Source data:** Use the USDA SR28 (2015) records and household weights documented in `src/data/README.md`. This is a curated historical dataset, not a live FoodData Central feed. Tofu is raw firm calcium-set tofu; tempeh is cooked; noodles are cooked egg noodles with salt. Preparation labels remain visible when selected.
- **Missing nutrients:** The cooked-tempeh record has no fiber value. Keep that value `null`, show “Unknown” at food level, and label the meal fiber figure as a known subtotal with `+`. Do not infer zero or substitute a different preparation. The nutrition engine returns totals and an explicit set of incomplete nutrients.
- **Chart meaning:** Macronutrient bar segments represent approximate energy shares using 4/4/9 kcal per gram, not personalized targets or a health score. Total energy uses the independently sourced calorie value. Fiber is included in carbohydrates and is not added twice.
- **Data model:** The actual interfaces are in `src/types.ts`. Plate coordinates use `[x, z]` on a fixed-height plane; nutrition is independent of position. Model IDs match food IDs. Data source metadata and food-specific serving conversions are explicit.
- **Capacity:** Limit the plate to 24 independently selectable instances to bound render cost. The UI explains when the plate is full. Food positions are clamped with a conservative footprint for each current portion; larger portions and smaller plates reclamp existing positions. Oversized portions are centered and may extend past the eating area, with a visible explanation. Overlap is permitted; the food list always allows selecting obscured objects.
- **Accessibility:** Every canvas action has ordinary button/input alternatives. Use native controls and a modal dialog, visible focus styles, reduced-motion handling, and live action announcements. If WebGL fails, nutrition and non-canvas controls remain usable.
- **Session behavior:** Each page load starts with an empty plate. Save plate, above the 3D plate, stores a named copy of the current meal in browser storage. Saved plates lists up to ten meals and supports loading and confirmed deletion. Loading can be undone. Portions, oil settings, vessel, selection, forms, and live arrangements are retained; nutrition is recalculated. Existing saved experiments remain readable and load their changed plate. Unsupported entries and unreadable storage are preserved with an explanation. Clearing site data removes saved plates. No telemetry is collected.
- **Mobile food picking:** A persistent bottom Add food button opens the existing searchable, filterable food library in a modal bottom sheet. Its food grid scrolls independently, and choosing a food closes the sheet and restores focus to the trigger without scrolling the page. Desktop and tablet retain the sidebar shelf.
- **Broccoli portions:** Use a compact cluster of five illustrative florets per regular 100 g serving. Larger portions add full-size florets; fractional remainders use a smaller floret. Short branching stems and lobed crowns preserve the low-poly style. The five-floret conversion and dimensions are visual estimates; edible grams remain authoritative. Rendered pieces and their collision hulls share their layout, scale, and quarter-turn rotations.
- **Validation:** Automated functional and calculation checks are separate from usability studies and hardware benchmarks. A software-rendered cloud browser cannot establish the 60 FPS mid-range laptop target or the broadband startup target. Those release acceptance criteria remain open until measured on a named reference device.

## 19. Photo mode

Take photo sits beside Save plate. It opens a separate, lazy-loaded photo scene
from a copy of the current meal, including its live positions and rotations.
Warm table with Angled framing is the default. Warm table, Studio, and Dark
presets set the surface, lighting, and shadows; Angled, Top view, and Current
view set the camera. Preset cameras fit the entire meal; Current view uses the
editor camera position, target, and field of view in a square frame.

The photo contains no interface, selection ring, or nutrition labels. Download
PNG renders 2048 × 2048 pixels on demand and restores preview resolution after
capture. No meal state, portions, camera, or undo history is changed by photo
settings. Closing releases the photo scene. Without WebGL, explain the limit
and disable export rather than offering a blank photo. No external image or
lighting assets, account, or server are required.

## 20. Expanded food collection

The available catalog contains 23 foods, including eight additional SR28 records:
boiled potato, sweet potato, corn, peas and green beans, plus raw tomato, orange
and strawberries. Each defaults to 100 g edible food and supports 25–300 g.
The existing four archived foods remain unavailable. Source preparations,
explicit edible weights, and missing-data rules continue to govern nutrition.

The additions share reusable procedural recipes and vector shelf thumbnails.
All plate/photo models batch compatible parts using vertex colors and reuse
calibrated geometry and materials across servings. Repeated pieces use instancing;
each portion remains one rigid body. New regular servings stay below 1,500
triangles. Shared assets and instance buffers are released after use.

The on-demand renderer, capped pixel ratio, 24-item plate capacity and 30-step
undo history are retained. Device startup, frame times and sustained memory
behavior require measurement on named hardware. Implementation details and
visual estimates are documented in `docs/food-variety.md` and
`src/data/visual-scale.md`.
