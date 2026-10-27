# More food variety with bounded rendering cost

The shelf now contains 23 foods. Eight additions use small reusable procedural
recipes: boiled potato, boiled sweet potato, boiled yellow corn kernels, boiled
green peas, boiled green beans, raw tomato, raw orange flesh, and raw strawberries.
No texture downloads, new libraries, or external model files are required.

Nutrition uses the same pinned USDA SR28 tables as the original collection.
Selected source descriptions, nutrient rows, and household weights are retained
for auditing. Each new food defaults to 100 g of edible food and allows 25–300 g.
These are example weighed servings, not database piece weights. Preparation and
source details remain available beside the plate. See the
[data provenance](../src/data/README.md) for the record mapping.

## Reusable models

`src/lib/food-families.ts` defines shared recipes for chunks and kernel mounds,
plus sliced tomato, orange wedges, berries, and a bean cluster. Layouts and
colors are deterministic. Potato and sweet potato use three illustrative chunks,
tomato three slices, orange four wedges, and strawberries five berries per
regular serving. Increasing portions adds pieces; fractional pieces use cube-root
scaling. Corn, peas, and beans remain cohesive servings scaled by volume.
Piece counts and dimensions are visual estimates; grams drive nutrition.

The eight new regular servings each stay below 1,500 triangles. Every serving
remains one selectable rigid body. Corn and pea kernels share one convex
collision envelope; there is no physics body or separate collider per kernel.

## Shared rendering

All plate and photo foods use the same calibrated, instanced renderer. Compatible
parts are combined with vertex colors, preserving their original transforms,
normals, shading groups, and colors. A serving uses at most three food draw
batches before shadow passes, regardless of its repeated piece count. For
example, rice uses one batch instead of 23 separate meshes; broccoli uses two
instead of seven instanced meshes. Duplicate servings and the photo canvas share
geometry and materials. Individual instance buffers are released on portion
changes and removal; shared assets are released after their last user closes.

The food shelf keeps lightweight SVG illustrations rather than live 3D previews.
The existing on-demand scene, pixel-ratio cap, and 24-item capacity remain in use.
Model definitions still load with the existing scene modules. The first eight
additions do not justify a separate download per food; larger future collections
can be split after measuring their contribution to startup.

## Physics and measurement

Thin tomato slices use explicit convex faces to avoid a second nearly-coplanar
hull reconstruction. The new grouped foods use stronger damping to dissipate
motion. Spilled portions return farther inward so they do not repeatedly fall
from the same crowded rim. These settings tune interaction rather than model
measured physical food properties. Settlement assertions and contact tolerances
remain meaningful and unchanged.

Compare production startup, dragging and orbiting frame times, settling duration,
and repeated add/remove memory on named laptop and phone hardware. Include a
normal meal and a full 24-item plate. Compressed bundle sizes and software-rendered
browser results do not establish the project's real-device frame-rate or startup
targets. See [validation](../VALIDATION.md) for executed checks and limits.

The solver retains sixteen iterations for ordinary meals and uses twenty-four
above fifteen portions. Thin bread and crackers, and the bean cluster, receive
additional local iterations to handle crowded contact. This costs more during
active settling; the sleeping scene still stops requesting frames. Consumer
hardware profiling remains necessary to judge the full interaction cost.
