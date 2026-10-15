import { useEffect, useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  MoveLeft,
  MoveRight,
  MoveUp,
  MoveDown,
  MousePointer2,
} from "lucide-react";
import { foodById, portionLabel } from "../lib/nutrition";
import { usePlate } from "../lib/store";
import { FoodArt } from "./FoodArt";
import { foodModelId, physicsFoods } from "../lib/scale";
import { supportsCooking } from "../lib/cooking";
import { CookingControls } from "./CookingControls";
import {
  insideWell,
  trayWells,
  fitsTrayWell,
  trayFootprint,
} from "../lib/meal-tray";
export function PortionControls() {
  const {
    items,
    selectedItemId,
    setPortion,
    setForm,
    move,
    remove,
    plateType,
  } = usePlate();
  const item = items.find((i) => i.instanceId === selectedItemId);
  const food = item ? foodById[item.foodId] : null;
  const [grams, setGrams] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setGrams(item ? String(Number(item.portionGrams.toFixed(2))) : "");
    setDirty(false);
  }, [item?.instanceId, item?.portionGrams]);
  if (!item || !food) {
    if (!items.length) return null;
    return (
      <div className="selection-placeholder">
        <span className="selection-icon">
          <MousePointer2 size={20} />
        </span>
        <div>
          <strong>What will you discover?</strong>
          <p>Select a food on your plate to explore its portion.</p>
        </div>
      </div>
    );
  }
  const ratio = item.portionGrams / food.defaultPortionGrams;
  const commit = () => {
    if (!dirty) return;
    setDirty(false);
    const n = Number(grams);
    if (grams.trim() && Number.isFinite(n) && n > 0) {
      const bounded = Math.min(
        food.maxPortionGrams,
        Math.max(food.minPortionGrams, n),
      );
      setPortion(item.instanceId, bounded);
      setGrams(String(Number(bounded.toFixed(2))));
    } else setGrams(String(Number(item.portionGrams.toFixed(2))));
  };
  return (
    <section className="portion-panel" aria-label="Selected food controls">
      <div className="selected-heading">
        <FoodArt id={foodModelId(item)} />
        <div>
          <span className="eyebrow">ON YOUR PLATE</span>
          <h3>{food.name}</h3>
          <span className="muted">{food.preparation}</span>
        </div>
        <button
          className="icon-button remove-button"
          aria-label={`Remove ${food.name}`}
          title="Remove food"
          onClick={() => remove(item.instanceId)}
        >
          <Trash2 size={17} />
        </button>
      </div>
      {food.id === "timun" && (
        <div className="food-form-control">
          <span id="timun-form-label">Timun form</span>
          <div
            className="portion-presets"
            role="group"
            aria-labelledby="timun-form-label"
          >
            {(["sliced", "whole"] as const).map((form) => (
              <button
                key={form}
                aria-pressed={(item.form ?? "sliced") === form}
                onClick={() => setForm(item.instanceId, form)}
              >
                {form === "sliced" ? "Sliced" : "Whole"}
              </button>
            ))}
          </div>
          <p className="muted">
            Same edible weight and nutrition in either form.
          </p>
        </div>
      )}
      <div className="portion-topline">
        <label htmlFor="portion-range">Make it your portion</label>
        <strong data-testid="portion-label">
          {portionLabel(food, item.portionGrams)}
        </strong>
      </div>
      <div className="portion-presets">
        {[
          [0.5, "Small"],
          [1, "Regular"],
          [2, "Large"],
        ].map(([n, label]) => (
          <button
            key={n}
            aria-pressed={Math.abs(ratio - Number(n)) < 0.001}
            onClick={() =>
              setPortion(item.instanceId, Number(n) * food.defaultPortionGrams)
            }
          >
            {label}
            <span>{n}×</span>
          </button>
        ))}
      </div>
      <div className="portion-slider">
        <button
          className="icon-button"
          aria-label="Decrease portion"
          disabled={item.portionGrams <= food.minPortionGrams}
          onClick={() =>
            setPortion(
              item.instanceId,
              item.portionGrams -
                food.defaultPortionGrams * (food.countable ? 1 : 0.25),
            )
          }
        >
          <Minus size={15} />
        </button>
        <input
          id="portion-range"
          aria-label="Portion multiplier"
          type="range"
          min="0.25"
          max="3"
          step="0.25"
          value={ratio}
          onChange={(e) =>
            setPortion(
              item.instanceId,
              Number(e.target.value) * food.defaultPortionGrams,
            )
          }
        />
        <button
          className="icon-button"
          aria-label="Increase portion"
          disabled={item.portionGrams >= food.maxPortionGrams}
          onClick={() =>
            setPortion(
              item.instanceId,
              item.portionGrams +
                food.defaultPortionGrams * (food.countable ? 1 : 0.25),
            )
          }
        >
          <Plus size={15} />
        </button>
      </div>
      <div className="fine-controls">
        <div className="weight-input">
          <label htmlFor="portion-weight">Edible weight</label>
          <div>
            <input
              id="portion-weight"
              type="number"
              min={food.minPortionGrams}
              max={food.maxPortionGrams}
              step="any"
              value={grams}
              onChange={(e) => {
                setGrams(e.target.value);
                setDirty(true);
              }}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
            />
            <span>g</span>
          </div>
        </div>
        <div className="position-controls">
          <span>Move on plate</span>
          <div>
            {[
              [0, -0.2, "up", MoveUp],
              [-0.2, 0, "left", MoveLeft],
              [0.2, 0, "right", MoveRight],
              [0, 0.2, "down", MoveDown],
            ].map(([x, z, label, Icon]) => {
              const I = Icon as typeof MoveUp;
              return (
                <button
                  key={String(label)}
                  className="icon-button"
                  aria-label={`Move ${food.name} ${label}`}
                  onClick={() =>
                    move(item.instanceId, [
                      item.position[0] + Number(x),
                      item.position[1] + Number(z),
                    ])
                  }
                >
                  <I size={14} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {plateType === "meal-tray" && (
        <div className="tray-compartment-control">
          <label htmlFor="tray-compartment">Tray compartment</label>
          <select
            id="tray-compartment"
            value={
              trayWells.find((w) => insideWell(w, ...item.position))?.id ?? ""
            }
            onChange={(e) => {
              const target = trayWells.find((w) => w.id === e.target.value);
              if (target) move(item.instanceId, [target.x, target.z]);
            }}
          >
            <option value="" disabled>
              Choose a compartment
            </option>
            {trayWells.map((w) => (
              <option
                key={w.id}
                value={w.id}
                disabled={
                  w.id !== "large" &&
                  !fitsTrayWell(
                    w,
                    w.x,
                    w.z,
                    trayFootprint(item, food.defaultPortionGrams),
                  )
                }
              >
                {
                  {
                    large: "Large compartment",
                    "top-center": "Top center",
                    round: "Round compartment",
                    "top-left": "Top left",
                    "top-right": "Top right",
                  }[w.id]
                }
              </option>
            ))}
          </select>
        </div>
      )}
      {supportsCooking(food.id) && (
        <CookingControls key={item.instanceId} item={item} food={food} />
      )}
      <p className="scale-note">
        {physicsFoods.has(food.id) &&
          "Drag onto another food to stack it. Release to let it settle. "}
        Food sizes are approximate, scaled to your plate. Whole pieces repeat;
        fractional pieces use estimated size. Grams determine nutrition.
      </p>
    </section>
  );
}
