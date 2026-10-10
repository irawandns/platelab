import { useEffect, useState } from "react";
import { usePlate } from "../lib/store";
import {
  MIN_PLATE_CM,
  MAX_PLATE_CM,
  footprintRadius,
  wellRadius,
} from "../lib/scale";
import { foodById } from "../lib/nutrition";

export function PlateSizeControls() {
  const { plateDiameterCm, setPlateDiameter, items } = usePlate();
  const [value, setValue] = useState(String(plateDiameterCm));
  useEffect(() => setValue(String(plateDiameterCm)), [plateDiameterCm]);
  const commit = () => {
    const cm = Number(value);
    if (value.trim() && Number.isFinite(cm)) {
      setPlateDiameter(cm);
      setValue(String(usePlate.getState().plateDiameterCm));
    } else setValue(String(plateDiameterCm));
  };
  const oversize = items.some(
    (item) =>
      footprintRadius(
        item.foodId,
        item.portionGrams / foodById[item.foodId].defaultPortionGrams,
      ) >
      wellRadius(plateDiameterCm) - 0.04,
  );
  return (
    <div className="plate-size-panel">
      <div className="plate-size-controls" role="group" aria-label="Plate size">
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
        {MIN_PLATE_CM}–{MAX_PLATE_CM} cm across the outer rim. Food portions
        stay the same.
      </p>
      {oversize && (
        <p className="plate-fit-note" role="status">
          A portion extends beyond the eating area. Try a larger plate or a
          smaller portion.
        </p>
      )}
    </div>
  );
}
