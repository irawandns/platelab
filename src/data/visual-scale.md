# Food and plate scale

One scene unit equals **5 cm**. Plate diameter is measured across the outer rim: default **26 cm**, presets **20/26/32 cm**, custom **18–36 cm** in 0.1 cm steps. The eating area is approximately 82% of the outer diameter. Camera framing fits the largest supported plate at each viewport size and does not change when selecting a new diameter.

The procedural models are normalized to the following regular-serving bounding dimensions, including decorations such as stems. Width and depth lie along the plate; height is vertical. Except for the apple diameter, these are **visual estimates**, not USDA measurements or validated gram-to-volume conversions. Different real foods can have different shapes, packing, and densities at the same edible weight.

| Food           | Regular serving          | Width × height × depth (cm) |
| -------------- | ------------------------ | --------------------------- |
| White rice     | 100 g cooked             | 9 × 3.5 × 8                 |
| Bread          | 25 g slice               | 10 × 1.2 × 10               |
| Egg noodles    | 100 g cooked             | 10 × 3.5 × 9                |
| Boiled egg     | 50 g, one large egg      | 4.4 × 5.7 × 4.4             |
| Chicken breast | 100 g cooked             | 10 × 2.8 × 6                |
| Salmon         | 100 g cooked             | 9 × 2.5 × 4.5               |
| Firm tofu      | 100 g                    | 7 × 4.5 × 6                 |
| Tempeh         | 100 g cooked             | 8 × 2.5 × 5                 |
| Broccoli       | 100 g cooked             | 10 × 6 × 9                  |
| Carrot         | 100 g raw                | 15 × 3.5 × 3.5              |
| Avocado        | 100 g edible flesh       | 7 × 4 × 10                  |
| Banana         | 118 g, one medium banana | 14.6 × 3 × 6                |
| Apple          | 182 g, one medium apple  | 7.62 × 8.2 × 7.2            |
| Whole milk     | 200 ml                   | Fixed glass: 8.4 × 13 × 8.4 |
| Cheddar        | 30 g                     | 5 × 2 × 4                   |

USDA's retained household measure gives a **3-inch (7.62 cm) diameter** for a medium apple and **7–7⅞ inches** for a medium banana. The banana's curved model has an estimated 14.6 cm chord, based on a nominal 18.8 cm length. Other dimensions are chosen to depict plausible servings; the nutrition data does not establish these dimensions.

Apples, eggs, bananas and bread retain their whole-piece dimensions when quantity increases. Bread stacks; other pieces form a small group. Fractional remainders use cube-root scaling of a smaller model, an approximate quantity cue rather than a physically cut portion. For weighed solids and mounds, multiplying grams by two multiplies model volume by two using cube-root scaling in each axis. Milk uses a fixed glass with a 3.9 cm inner radius and a liquid height of `volume / (π × radius²)`; the full allowed 50–600 ml range fits inside it.

Placement uses a conservative circular bound around each model or piece group, with a 2 mm margin. Changing diameter or increasing a portion reclamps positions without changing the food's dimensions. A portion whose bound exceeds the eating area is centered and the interface explains that it extends beyond the eating area. Food overlap remains allowed. Nutrition depends only on edible grams; changing diameter, position or camera cannot change it. Undo restores plate size and arrangement together, while clearing retains the chosen diameter.
