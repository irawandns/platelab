import { ArrowUpRight, Leaf, Lightbulb, Info } from "lucide-react";
import {
  foodById,
  forItem,
  format,
  getInsight,
  summarize,
  portionLabel,
} from "../lib/nutrition";
import { usePlate } from "../lib/store";
import type { Nutrient } from "../types";
import { cookingMethods, oilForItem, retainedOilGrams } from "../lib/cooking";
const macroRows = [
  { key: "protein", label: "Protein", color: "protein", factor: 4 },
  { key: "carbohydrates", label: "Carbs", color: "carbs", factor: 4 },
  { key: "fat", label: "Fat", color: "fat", factor: 9 },
] as const;
export function NutritionDashboard() {
  const items = usePlate((s) => s.items);
  const selectedItemId = usePlate((s) => s.selectedItemId);
  const { totals, incomplete } = summarize(items);
  const item = items.find((i) => i.instanceId === selectedItemId);
  const food = item ? foodById[item.foodId] : null;
  const selected = item && food ? forItem(item) : null;
  const macroEnergy =
    totals.protein * 4 + totals.carbohydrates * 4 + totals.fat * 9;
  return (
    <aside className="nutrition-column" aria-label="Nutrition dashboard">
      <section className="nutrition-panel panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">THE BIG PICTURE</span>
            <h2>Your plate, in numbers</h2>
          </div>
          <span className="live-dot" title="Updates instantly" />
        </div>
        <div className="energy-block">
          <span className="metric-label">Estimated energy</span>
          <div className="energy-value">
            <strong data-testid="total-calories">
              {format(totals.calories, 0)}
            </strong>
            <span>kcal</span>
          </div>
          <span className="energy-caption">
            {items.length
              ? `${items.length} food ${items.length === 1 ? "item" : "items"} · one curious creation`
              : "An empty plate. Endless possibilities."}
          </span>
        </div>
        <div className="macro-heading">
          <h3>Macronutrients</h3>
          <span>on this plate</span>
        </div>
        <div className="macro-stack" aria-hidden="true">
          {macroRows.map((m) => (
            <span
              key={m.key}
              className={m.color}
              style={{
                width: `${macroEnergy ? ((totals[m.key] * m.factor) / macroEnergy) * 100 : 0}%`,
              }}
            />
          ))}
        </div>
        <div className="macro-list">
          {macroRows.map((m) => (
            <div className="macro-row" key={m.key}>
              <span>
                <i className={`dot ${m.color}`} />
                {m.label}
              </span>
              <strong data-testid={`total-${m.key}`}>
                {format(totals[m.key])}
                <small> g</small>
              </strong>
            </div>
          ))}
        </div>
        <div className="fiber-row">
          <span>
            <Leaf size={15} />
            Fiber
          </span>
          <strong data-testid="total-fiber">
            {format(totals.fiber)}
            {incomplete.has("fiber") ? "+" : ""}
            <small> g</small>
          </strong>
        </div>
        {incomplete.has("fiber") && (
          <p className="data-warning">
            Known fiber subtotal. Fiber is unreported for{" "}
            {Array.from(
              new Set(
                items
                  .filter((entry) => foodById[entry.foodId].nutrientsPer100g.fiber === null)
                  .map((entry) => foodById[entry.foodId].name),
              ),
            ).join(", ")}
            .
          </p>
        )}
        <details className="chart-explainer">
          <summary>
            <Info size={13} />
            How to read these numbers
          </summary>
          <p>
            Bar segments show approximate energy shares from protein (4 kcal/g),
            carbohydrates (4 kcal/g), and fat (9 kcal/g). They are not daily
            targets. Energy uses the source’s calorie value; these methods can
            differ. Fiber is included in carbohydrates.
          </p>
        </details>
        <p className="estimate-note">
          A little perspective, not a prescription.
          <br />
          Values are estimates, not dietary advice.
        </p>
      </section>
      <section className="insight-card">
        <span className="insight-icon">
          <Lightbulb size={20} />
        </span>
        <span className="eyebrow">FOOD FOR THOUGHT</span>
        <p>{getInsight(items)}</p>
      </section>
      {food && item && selected && (
        <section
          className="food-details panel"
          aria-label="Food nutrition details"
        >
          <div className="detail-heading">
            <span className="eyebrow">A CLOSER LOOK</span>
            <span className="category-label">{food.category}</span>
          </div>
          <h3>{food.name}</h3>
          <p className="muted">
            {portionLabel(food, item.portionGrams)} · {food.preparation}
          </p>
          {item.cooking && (
            <p className="food-oil-note">
              {cookingMethods[item.cooking.method].label} oil experiment ·
              includes {format(retainedOilGrams(item), 2)} g added oil (+
              {format(oilForItem(item).calories, 0)} kcal). Reference
              preparation stays as shown above.
            </p>
          )}
          <div className="detail-nutrients">
            {(
              [
                "calories",
                "protein",
                "carbohydrates",
                "fat",
                "fiber",
              ] as Nutrient[]
            ).map((key) => (
              <div key={key}>
                <span>
                  {key === "calories"
                    ? "Energy"
                    : key === "carbohydrates"
                      ? "Carbs"
                      : key[0].toUpperCase() + key.slice(1)}
                </span>
                <strong>
                  {format(selected[key], key === "calories" ? 0 : 1)}
                  {selected[key] !== null ? (
                    <small> {key === "calories" ? "kcal" : "g"}</small>
                  ) : null}
                </strong>
              </div>
            ))}
          </div>
          <p className="food-note">{food.educationalDescription}</p>
          <details className="source-details">
            <summary>
              Serving & data source <ArrowUpRight size={13} />
            </summary>
            <p>{food.conversionNote}</p>
            <p>
              {food.source.database}
              <br />
              {food.source.database.startsWith("USDA") ? "NDB " : ""}
              {food.source.id}: {food.source.description}
            </p>
            <a href={food.source.url} target="_blank" rel="noreferrer">
              {food.source.database.startsWith("USDA") ? "USDA" : "TKPI"} source
              documentation <ArrowUpRight size={12} />
            </a>
            <p>
              Exact source rows and provenance are included in this project.
              Estimates vary with variety, brand, and preparation.
            </p>
          </details>
        </section>
      )}
    </aside>
  );
}
