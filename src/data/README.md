# Nutrition data provenance

The 15 food records in `foods.json` use the **USDA National Nutrient Database for Standard Reference, Release 28 (2015)**. Values are per 100 g of edible food, in the preparation state shown in each record. This is historical reference data, not live FoodData Central data or brand-specific advice.

Eleven foods are currently available. Carrot, banana, apple, and whole milk have `available: false` and are excluded from the shelf and runtime food lookup. Their records and source rows remain here for later restoration; the fruit weights and milk conversion below describe those archived records.

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
