import { useEffect, useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { usePlate } from "../lib/store";
import {
  MIN_PLATE_CM,
  MAX_PLATE_CM,
  footprintRadius,
  wellRadius,
  physicsFoods,
  plateRadius,
} from "../lib/scale";
import { foodById } from "../lib/nutrition";
import { plateSkins, type PlateSkin } from "../lib/plate-skins";
import {
  TRAY_LENGTH_CM,
  TRAY_WIDTH_CM,
  trayPortionFits,
} from "../lib/meal-tray";

export function PlateSizeControls() {
  const {
    plateDiameterCm,
    setPlateDiameter,
    plateSkin,
    setPlateSkin,
    plateType,
    setPlateType,
    items,
  } = usePlate();
  const isTray = plateType === "meal-tray";
  const [value, setValue] = useState(String(plateDiameterCm));
  useEffect(() => setValue(String(plateDiameterCm)), [plateDiameterCm]);
  const commit = () => {
    const cm = Number(value);
    if (value.trim() && Number.isFinite(cm)) {
      setPlateDiameter(cm);
      setValue(String(usePlate.getState().plateDiameterCm));
    } else setValue(String(plateDiameterCm));
  };
  const oversize = items.some((item) =>
    isTray
      ? !trayPortionFits(item, foodById[item.foodId].defaultPortionGrams)
      : footprintRadius(
          item.foodId,
          item.portionGrams / foodById[item.foodId].defaultPortionGrams,
        ) >
        (physicsFoods.has(item.foodId)
          ? plateRadius(plateDiameterCm)
          : wellRadius(plateDiameterCm)) -
          0.04,
  );
  return (
    <div className="plate-options-panel">
      <details className="plate-options">
        <summary>
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span className="plate-options-title">Plate options</span>
          <span className="plate-options-value">
            {isTray
              ? `${TRAY_LENGTH_CM} × ${TRAY_WIDTH_CM} cm · Stainless`
              : `${plateDiameterCm} cm · ${plateSkins[plateSkin].name}`}
          </span>
          <ChevronDown
            size={15}
            className="plate-options-chevron"
            aria-hidden="true"
          />
        </summary>
        <div className="plate-size-panel">
          <fieldset className="plate-type-controls">
            <legend>Plate type</legend>
            <div className="plate-skin-choices">
              <label className="plate-skin-choice">
                <input
                  type="radio"
                  name="plate-type"
                  checked={!isTray}
                  onChange={() => setPlateType("ceramic")}
                />
                <span
                  className="plate-skin-swatch"
                  style={{
                    backgroundColor: plateSkins[plateSkin].base,
                    borderColor: plateSkins[plateSkin].rim,
                  }}
                  aria-hidden="true"
                />
                <span>Ceramic plate</span>
              </label>
              <label className="plate-skin-choice">
                <input
                  type="radio"
                  name="plate-type"
                  checked={isTray}
                  onChange={() => setPlateType("meal-tray")}
                />
                <svg
                  className="tray-choice-icon"
                  viewBox="0 0 29 23"
                  aria-hidden="true"
                >
                  <rect x="0.6" y="0.6" width="27.8" height="21.8" rx="2" />
                  <rect x="2" y="2" width="6" height="8" rx="1.5" />
                  <rect x="9" y="2" width="10" height="8" rx="1.5" />
                  <rect x="20" y="2" width="7" height="8" rx="1.5" />
                  <rect x="2" y="12" width="15" height="9" rx="1.5" />
                  <circle cx="23" cy="16.5" r="4.5" />
                </svg>
                <span>Meal tray</span>
              </label>
            </div>
          </fieldset>
          {isTray ? (
            <div className="tray-size-details">
              <strong>Stainless meal tray · 5 compartments</strong>
              <p>
                {TRAY_LENGTH_CM} × {TRAY_WIDTH_CM} cm. Drag food between
                compartments. Food portions stay the same.
              </p>
            </div>
          ) : (
            <>
              <div
                className="plate-size-controls"
                role="group"
                aria-label="Plate size"
              >
                <span>Plate diameter</span>
                <div className="plate-size-presets">
                  {[20, 26, 32].map((cm) => (
                    <button
                      key={cm}
                      aria-pressed={plateDiameterCm === cm}
                      onClick={() => setPlateDiameter(cm)}
                    >
                      {cm} cm
                    </button>
                  ))}
                </div>
                <div className="plate-size-input">
                  <label htmlFor="plate-diameter">Custom</label>
                  <input
                    id="plate-diameter"
                    aria-label="Custom plate diameter"
                    aria-describedby="plate-size-note"
                    type="number"
                    min={MIN_PLATE_CM}
                    max={MAX_PLATE_CM}
                    step="0.1"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                    }}
                  />
                  <span>cm</span>
                </div>
              </div>
              <p id="plate-size-note">
                {MIN_PLATE_CM}–{MAX_PLATE_CM} cm across the outer rim. Food
                portions stay the same.
              </p>
              <fieldset className="plate-skin-controls">
                <legend>Plate skin</legend>
                <div className="plate-skin-choices">
                  {(Object.keys(plateSkins) as PlateSkin[]).map((id) => (
                    <label className="plate-skin-choice" key={id}>
                      <input
                        type="radio"
                        name="plate-skin"
                        value={id}
                        checked={plateSkin === id}
                        onChange={() => setPlateSkin(id)}
                      />
                      <span
                        className="plate-skin-swatch"
                        style={{
                          backgroundColor: plateSkins[id].base,
                          borderColor: plateSkins[id].rim,
                        }}
                        aria-hidden="true"
                      />
                      <span>{plateSkins[id].name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
        </div>
      </details>
      {oversize && (
        <p className="plate-fit-note" role="status">
          {isTray
            ? "A portion spans a tray divider. Try a smaller portion or the ceramic plate."
            : "A portion extends beyond the eating area. Try a larger plate or a smaller portion."}
        </p>
      )}
    </div>
  );
}
