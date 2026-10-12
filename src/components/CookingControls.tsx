import { useEffect, useState } from "react";
import { Droplets } from "lucide-react";
import { usePlate } from "../lib/store";
import { forItem, forPortion, format } from "../lib/nutrition";
import {
  cookingMethods,
  DEFAULT_OIL,
  gramsPerUnit,
  MAX_OIL_GRAMS,
  oilAmountGrams,
  oilById,
  oilForItem,
  oils,
  retainedOilGrams,
} from "../lib/cooking";
import type {
  CookingMethod,
  CookingSettings,
  Food,
  OilId,
  OilUnit,
  PlateItem,
} from "../types";

export function CookingControls({
  item,
  food,
}: {
  item: PlateItem;
  food: Food;
}) {
  const setCooking = usePlate((s) => s.setCooking);
  const [unit, setUnit] = useState<OilUnit>("g");
  const [amount, setAmount] = useState("");
  const [dirty, setDirty] = useState(false);
  const cooking = item.cooking;
  const oilId = cooking?.oilId ?? DEFAULT_OIL;
  const oil = oilById[oilId];
  const inputGrams = oilAmountGrams(item);
  const factor = gramsPerUnit(oilId, unit);
  const displayedAmount = String(Number((inputGrams / factor).toFixed(6)));
  useEffect(() => {
    setAmount(displayedAmount);
    setDirty(false);
  }, [displayedAmount, cooking?.method, cooking?.oil?.basis, unit, oilId]);
  const baseline = forPortion(food, item.portionGrams);
  const adjusted = forItem(item);
  const added = oilForItem(item);
  const retained = retainedOilGrams(item);
  const updateOil = (patch: Partial<NonNullable<CookingSettings["oil"]>>) => {
    const latest = usePlate
      .getState()
      .items.find((i) => i.instanceId === item.instanceId);
    if (!latest?.cooking) return;
    setCooking(item.instanceId, {
      ...latest.cooking,
      oil: {
        grams: oilAmountGrams(latest),
        basis: "in-serving",
        retainedPercent: 100,
        ...latest.cooking.oil,
        ...patch,
      },
    });
  };
  const commitAmount = () => {
    if (!dirty) return;
    const value = Number(amount);
    if (amount.trim() && Number.isFinite(value)) {
      const grams = Math.min(MAX_OIL_GRAMS, Math.max(0, value * factor));
      updateOil({ grams });
      setAmount(String(Number((grams / factor).toFixed(6))));
    } else setAmount(displayedAmount);
    setDirty(false);
  };
  return (
    <section className="cooking-panel" aria-label="Cooking experiment">
      <div className="cooking-heading">
        <Droplets size={17} aria-hidden="true" />
        <h4>Try a cooking method</h4>
        <span>Oil experiment</span>
      </div>
      <fieldset className="cooking-methods">
        <legend className="sr-only">Cooking method</legend>
        <label>
          <input
            type="radio"
            name="cooking-method"
            value="as-prepared"
            checked={!cooking}
            onChange={() => setCooking(item.instanceId)}
          />
          <span>As prepared</span>
        </label>
        {Object.entries(cookingMethods).map(([method, preset]) => (
          <label key={method}>
            <input
              type="radio"
              name="cooking-method"
              value={method}
              checked={cooking?.method === method}
              onChange={() =>
                setCooking(item.instanceId, {
                  method: method as CookingMethod,
                  oilId,
                })
              }
            />
            <span>{preset.label}</span>
          </label>
        ))}
      </fieldset>
      {cooking ? (
        <>
          <p className="cooking-assumption" data-testid="cooking-assumption">
            {cooking.oil ? "Custom amount" : "Example preset"} ·{" "}
            {format(retained, 2)} g oil in this serving
          </p>
          <div className="cooking-comparison" aria-label="Energy comparison">
            <div>
              <span>Reference food</span>
              <strong>
                {format(baseline.calories, 0)} <small>kcal</small>
              </strong>
            </div>
            <div>
              <span>Added oil</span>
              <strong data-testid="oil-calories">
                +{format(added.calories, 0)} <small>kcal</small>
              </strong>
            </div>
            <div>
              <span>With oil</span>
              <strong data-testid="cooked-calories">
                {format(adjusted.calories, 0)} <small>kcal</small>
              </strong>
            </div>
          </div>
          <p className="cooking-fat" data-testid="cooking-fat">
            Oil adds {format(added.fat, 2)} g fat. Protein, carbs, and fiber
            stay at the reference values.
          </p>
          <details className="cooking-details">
            <summary>
              Adjust cooking details <span>{format(retained, 2)} g oil</span>
            </summary>
            <div className="cooking-fields">
              <label htmlFor="cooking-oil-type">Oil type</label>
              <select
                id="cooking-oil-type"
                value={oilId}
                onChange={(e) =>
                  setCooking(item.instanceId, {
                    ...cooking,
                    oilId: e.target.value as OilId,
                  })
                }
              >
                {oils.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.name}
                  </option>
                ))}
              </select>
              <label htmlFor="cooking-oil-basis">Amount refers to</label>
              <select
                id="cooking-oil-basis"
                value={cooking.oil?.basis ?? "in-serving"}
                onChange={(e) =>
                  updateOil({
                    basis: e.target.value as "in-serving" | "used",
                    grams:
                      e.target.value === "in-serving" ? retained : inputGrams,
                    retainedPercent: 100,
                  })
                }
              >
                <option value="in-serving">Oil in this serving</option>
                <option value="used">Oil used for this portion</option>
              </select>
              <label htmlFor="cooking-oil-amount">Oil amount</label>
              <div className="cooking-amount">
                <input
                  id="cooking-oil-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max={MAX_OIL_GRAMS / factor}
                  step="any"
                  value={amount}
                  aria-describedby="cooking-unit-note"
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setDirty(true);
                  }}
                  onBlur={commitAmount}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                <select
                  aria-label="Oil amount unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as OilUnit)}
                >
                  <option value="g">g</option>
                  <option value="tsp">tsp</option>
                  <option value="tbsp">tbsp</option>
                </select>
              </div>
            </div>
            <p id="cooking-unit-note" className="cooking-note">
              1 tsp = {format(oil.gramsPerTeaspoon, 2)} g · 1 tbsp ={" "}
              {format(oil.gramsPerTablespoon, 2)} g of {oil.name.toLowerCase()}.
              Enter oil for this portion only.
            </p>
            {cooking.oil?.basis === "used" && (
              <div className="cooking-retention">
                <label htmlFor="cooking-retention">
                  Oil ending up in this serving{" "}
                  <strong>{format(cooking.oil.retainedPercent)}%</strong>
                </label>
                <input
                  id="cooking-retention"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={cooking.oil.retainedPercent}
                  onChange={(e) =>
                    updateOil({ retainedPercent: Number(e.target.value) })
                  }
                />
                <p className="cooking-note">
                  This is your assumption, not a measured absorption rate. Only{" "}
                  {format(retained, 2)} g of the {format(inputGrams, 2)} g used
                  is counted.
                </p>
              </div>
            )}
            <p className="cooking-note">
              {cooking.oil
                ? "Your custom oil amount stays fixed when you change the food portion."
                : "The example oil amount scales with the food portion."}
            </p>
            <button
              className="cooking-reset"
              disabled={!cooking.oil}
              onClick={() =>
                setCooking(item.instanceId, { method: cooking.method, oilId })
              }
            >
              Reset to method preset
            </button>
            <p className="cooking-note">
              Oil nutrition: USDA SR28, NDB {oil.source.id},{" "}
              {oil.source.description}.{" "}
              <a href={oil.source.url} target="_blank" rel="noreferrer">
                Source documentation
              </a>
              .
            </p>
          </details>
          <p className="cooking-note cooking-limit">
            Presets are example oil amounts, not measured frying absorption.
            This experiment adds oil to the reference food; water loss,
            coatings, and other cooking changes are not estimated.
          </p>
        </>
      ) : (
        <p className="cooking-note">
          Choose a method to explore what added oil changes. Reference:{" "}
          {food.preparation.toLowerCase()}.
        </p>
      )}
    </section>
  );
}
