# Nutrition data provenance

The original 15 food records in `foods.json` use the **USDA National Nutrient Database for Standard Reference, Release 28 (2015)**. Values are per 100 g of edible food, in the preparation state shown in each record. This is historical reference data, not live FoodData Central data or brand-specific advice.

Twenty-three foods are currently available, including eight additional USDA foods and four TKPI additions described below. Carrot, banana, apple, and whole milk have `available: false` and are excluded from the shelf and runtime food lookup. Their records and source rows remain here for later restoration; the fruit weights and milk conversion below describe those archived records.

Original documentation: https://www.ars.usda.gov/ARSUserFiles/80400525/Data/SR/SR28/sr28_doc.pdf

The SR28 ASCII tables were obtained from the public [alyssaq/usda-sqlite mirror](https://github.com/alyssaq/usda-sqlite/tree/1e457b599af101ce463a195867574eba16c81acb/data), pinned to commit `1e457b599af101ce463a195867574eba16c81acb`. That repository identifies the included files as SR28. The original USDA host was blocked by the setup environment's egress proxy; the mirror was accessible. No missing values were invented.

Downloaded table SHA-256 digests:

| File         | SHA-256                                                          |
| ------------ | ---------------------------------------------------------------- |
| FOOD_DES.txt | bb2047218cdad1d830da69e760386409fde3b7afabceae604c5479f280d4fa2e |
| NUT_DATA.txt | 506c9ee39a276ac8f53565d270597e430944ec3363adb53a91cc6ee8c061fac5 |
| WEIGHT.txt   | 98484d7e26b3803467e65a9ab2ad8094bc94ed0c50375efb7e26a8bd60b1afae |

The selected rows are retained verbatim by field in `usda-food_des.json`, `usda-nut_data.json`, and `usda-weight.json` for offline auditing. They are not included in the runtime bundle. `tests/nutrition.test.ts` compares every implemented nutrient against these source rows.

## Record mapping

| Food                                       | NDB ID | Serving                                                         |
| ------------------------------------------ | ------ | --------------------------------------------------------------- |
| Cooked long-grain white rice               | 20045  | 100 g                                                           |
| Commercially prepared white bread          | 18069  | 25 g slice (WEIGHT sequence 6; other slices have other weights) |
| Cooked enriched egg noodles with salt      | 20310  | 100 g                                                           |
| Hard-boiled egg                            | 01129  | 50 g large egg, without shell                                   |
| Roasted skinless chicken breast            | 05064  | 100 g                                                           |
| Cooked farmed Atlantic salmon, dry heat    | 15237  | 100 g                                                           |
| Raw firm tofu, calcium sulfate             | 16426  | 100 g                                                           |
| Cooked tempeh                              | 16174  | 100 g                                                           |
| Boiled drained broccoli, without salt      | 11091  | 100 g                                                           |
| Raw carrots                                | 11124  | 100 g                                                           |
| Raw avocado, all commercial varieties      | 09037  | 100 g flesh                                                     |
| Raw banana                                 | 09040  | 118 g medium banana, without peel                               |
| Raw apple with skin                        | 09003  | 182 g medium apple                                              |
| Whole milk, 3.25% milkfat, vitamin D added | 01077  | 200 ml ≈ 206.27 g                                               |
| Cheddar cheese                             | 01009  | 30 g                                                            |

Nutrient codes: 208 = energy (kcal), 203 = protein (g), 205 = carbohydrate by difference (g), 204 = total lipid/fat (g), 291 = total dietary fiber (g).

## Conversions and unknowns

- Milk uses the USDA household weight of **244 g per US cup**, with **236.5882365 ml per US customary cup**. The full ratio is retained; rounding is only for display. Milk density is an estimate based on that household measure.
- Apple, banana, egg, and bread servings use explicit USDA household gram weights. Edible amounts exclude peel, shell, and other inedible material where applicable.
- Cooked tempeh has no nutrient 291 row. Its fiber remains `null`; whole-plate fiber is labeled as an incomplete known subtotal whenever tempeh is present.
- Generic food values vary by cultivar, brand, water content, and preparation. “Unknown” never means “none.”
- The 4/4/9 energy-share chart is illustrative; USDA energy is retained independently and may differ due to food-specific factors and fiber.

USDA federal food-composition data is public domain. The source mirror is only used to retrieve the data; no application code from it is included.

## Cooking oil experiments

`cooking-oils.json` adds soybean oil (NDB 04044), olive oil (04053), and palm oil (04055) from the same pinned SR28 mirror and table checksums above. The selected nutrient and household-weight rows are retained by field in `usda-oils.json`; the cooking tests compare every oil nutrient and spoon conversion against those rows. All three records provide 884 kcal and 100 g fat per 100 g, with zero protein, carbohydrate, and fiber. Teaspoons weigh 4.5 g in these records. Tablespoons weigh 13.6 g for soybean/palm and 13.5 g for olive. These are USDA household measures; users with a scale can enter grams directly.

The first cooking experiment supports firm tofu and chicken breast. Their existing reference preparations remain raw calcium-set tofu and roasted skinless chicken; selecting a method **does not substitute a cooked-food record or model cooking yield**. The calculation is reference-food nutrition plus explicitly counted oil. It preserves unknown reference nutrients and adds the oil contribution once. The food weight control still refers to the original food, excluding added oil.

Method presets are deliberately labeled **example oil amounts**, not measured absorption factors, food-specific research results, or predictions of an actual fried meal:

| Method   | Example oil in the serving per 100 g reference food |
| -------- | --------------------------------------------------- |
| Sear     | 2 g                                                 |
| Pan-fry  | 5 g                                                 |
| Deep-fry | 10 g                                                |
| Air-fry  | 1 g                                                 |

These amounts are editable starting scenarios for comparing oil contributions. They do not establish a universal ranking between cooking methods. Actual frying can change water and fat content; see [FAO's food-composition discussion of cooking methods](https://www.fao.org/4/y4705e/Y4705E08.htm). Water loss, fat loss from the food, coatings, and other preparation changes are outside this oil-only experiment. A method name alone cannot establish oil absorption.

In details, the default input is oil in the serving. Alternatively, the user may enter oil used **for this portion** and specify the percentage ending up in the serving. That percentage is a user assumption, displayed alongside the counted grams; switching to this mode starts at an explicit 100%, and the control allows 0–100%. It is not a default empirical absorption estimate. Whole-pan or batch amounts must be allocated to the portion before entering them.

Preset oil scales with reference-food weight. A custom oil amount stays fixed for this serving when the portion changes. Unit changes only change the display, retaining canonical gram precision. Changing oil type preserves the canonical gram amount. Switching methods or resetting to the method preset replaces the custom assumption; As prepared clears the oil experiment. Every food instance has its own settings and participates in the existing undo history. The 3D geometry and physics mass represent the reference food; editing oil does not restart physics or change the arrangement.

## Indonesian foods

Four records use Kemenkes **TKPI 2017**, published in 2018. The [Poltekkes
Palembang library PDF](https://lib.poltekkespalembang.ac.id/index.php?bid=15003&fid=94&p=fstream-pdf)
is the inspected source; selected values are retained in `tkpi-foods.json`.

| ID           | TKPI code | PDF page (1-based) | kcal | Protein g | Carbs g | Fat g | Fiber g |
| ------------ | --------- | ------------------ | ---- | --------- | ------- | ----- | ------- |
| timun        | DR109     | 38                 | 8    | 0.2       | 1.4     | 0.2   | 0.3     |
| kerupuk      | BP045     | 25                 | 477  | 4.7       | 68.5    | 20.5  | 5       |
| ikan-kembung | GR050     | 58                 | 125  | 21.3      | 2.2     | 3.4   | Unknown |
| bakwan-sayur | AP031     | 18                 | 280  | 8.2       | 39      | 10.2  | 3.4     |

All values are per 100 g edible food. GR050's fiber cell is blank; 1.7 is
the adjacent ash value, not fiber. TKPI notes that its fiber measurements
are not uniformly identifiable as total or dietary fiber (PDF page 11).
The generic Fiber display preserves the source values with that limitation.

AP031's glossary (PDF page 100) identifies a fried flour-and-vegetable
fritter. BP045 specifically describes fried shrimp crackers. Their oil is
already part of the record; no extra oil experiment is applied. GR050 is a
fresh/raw fish record, displayed as such, with edible flesh grams excluding
discarded bones. It must not stand in for fried fish.

Default weights are app examples: timun 50 g, kerupuk 10 g, fish 100 g,
and bakwan 50 g. Piece counts and whole-fish dimensions are visual estimates,
not database household conversions. Users enter edible grams; increasing
timun, kerupuk, or bakwan portions adds illustrative pieces. Nutrition remains
weight-based. Timun also offers a whole form that scales by estimated volume; switching forms preserves edible grams and nutrition. Its silhouette is not a measured whole-cucumber weight. Prepared recipes and individual piece weights vary.

## Additional food families — 2026-10-22

Eight new records use the same pinned SR28 mirror and table checksums above.
All five tracked nutrient rows are present for each food; values are retained
without intermediate rounding and verified against the source rows in tests.

| Food         | NDB ID | Preparation                                  | Default serving    |
| ------------ | ------ | -------------------------------------------- | ------------------ |
| Potato       | 11367  | Boiled flesh, without skin or salt           | 100 g              |
| Sweet potato | 11510  | Boiled, without skin or salt                 | 100 g              |
| Sweet corn   | 11168  | Boiled yellow kernels, drained, without salt | 100 g kernels      |
| Green peas   | 11305  | Boiled, drained, without salt                | 100 g              |
| Green beans  | 11053  | Boiled, drained, without salt                | 100 g              |
| Tomato       | 11529  | Raw, red and ripe                            | 100 g              |
| Orange       | 09200  | Raw, all commercial varieties                | 100 g edible flesh |
| Strawberries | 09316  | Raw                                          | 100 g edible fruit |

Default servings are weighed app examples. Piece counts and dimensions are
artistic estimates, not household gram conversions. The retained household
weight rows document the original source but are not used to claim a measured
weight for the models. Orange excludes peel, corn excludes the cob, and
strawberries exclude discarded leaves and stems. Boiled foods have no added
salt or oil in these records.
