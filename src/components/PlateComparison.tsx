import { useEffect, useRef } from "react";
import { GitCompareArrows } from "lucide-react";
import { comparePlates } from "../lib/comparison";
import { cookingMethods, retainedOilGrams } from "../lib/cooking";
import { foodById, format, portionLabel } from "../lib/nutrition";
import { usePlate } from "../lib/store";

export function PlateComparison() {
  const items = usePlate((s) => s.items);
  const baseline = usePlate((s) => s.comparisonBaseline);
  const capture = usePlate((s) => s.captureComparison);
  const restore = usePlate((s) => s.restoreComparison);
  const finish = usePlate((s) => s.endComparison);
  const captureButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!baseline && returnFocus.current) {
      returnFocus.current = false;
      if (captureButton.current?.disabled) heading.current?.focus();
      else captureButton.current?.focus();
    }
  }, [baseline]);
  const rows = baseline ? comparePlates(baseline.items, items) : [];
  const hasUnknown = rows.some((row) => row.difference === null);
  return (
    <section
      className="comparison-panel panel"
      aria-labelledby="comparison-heading"
    >
      <span className="eyebrow">
        <GitCompareArrows size={13} /> A LITTLE EXPERIMENT
      </span>
      <h2 id="comparison-heading" ref={heading} tabIndex={-1}>
        What if?
      </h2>
      <p className="comparison-intro">
        {baseline
          ? "Change a food, portion, or cooking oil and compare with your original plate."
          : "Capture your plate, try a change, and discover the difference."}
      </p>
      <button
        ref={captureButton}
        className="comparison-capture"
        disabled={!items.length}
        onClick={capture}
      >
        {baseline ? "Replace original" : "Compare changes"}
      </button>
      {!baseline && !items.length && (
        <p className="comparison-hint">Add a food to start an experiment.</p>
      )}
      {baseline && (
        <>
          <table className="comparison-table">
            <caption className="sr-only">Estimated nutrition changes</caption>
            <thead>
              <tr>
                <th scope="col">Nutrient</th>
                <th scope="col">Original</th>
                <th scope="col">Current</th>
                <th scope="col">Change</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const rounded =
                  row.difference === null
                    ? null
                    : Number(row.difference.toFixed(row.digits));
                const difference =
                  rounded === null
                    ? "Unknown"
                    : rounded === 0
                      ? "No change"
                      : `${rounded > 0 ? "+" : "−"}${format(Math.abs(rounded), row.digits)} ${row.unit}`;
                const description =
                  rounded === null
                    ? `${row.label} difference unknown because data is missing.`
                    : rounded === 0
                      ? `${row.label}: no change at the displayed precision.`
                      : `${row.label} ${rounded > 0 ? "increased" : "decreased"} by ${format(Math.abs(rounded), row.digits)} ${row.unit}.`;
                return (
                  <tr key={row.key} data-testid={`comparison-${row.key}`}>
                    <th scope="row">{row.label}</th>
                    <td data-testid={`original-${row.key}`}>
                      {format(row.original, row.digits)}
                      {row.originalIncomplete ? "+" : ""}
                      <small> {row.unit}</small>
                    </td>
                    <td data-testid={`current-${row.key}`}>
                      {format(row.current, row.digits)}
                      {row.currentIncomplete ? "+" : ""}
                      <small> {row.unit}</small>
                    </td>
                    <td data-testid={`difference-${row.key}`}>
                      <span aria-hidden="true">{difference}</span>
                      <span className="sr-only">{description}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hasUnknown && (
            <p className="comparison-hint">
              + marks a known subtotal. Missing data makes the difference
              unknown.
            </p>
          )}
          <details className="comparison-original">
            <summary>Original foods ({baseline.items.length})</summary>
            <ul>
              {baseline.items.map((item) => {
                const food = foodById[item.foodId];
                return (
                  <li key={item.instanceId}>
                    <strong>{food.name}</strong>
                    <span>
                      {portionLabel(food, item.portionGrams)} ·{" "}
                      {food.preparation}
                    </span>
                    {item.cooking && (
                      <span>
                        {cookingMethods[item.cooking.method].label} oil
                        experiment · {format(retainedOilGrams(item), 2)} g
                        added oil
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </details>
          <div className="comparison-actions">
            <button onClick={restore}>Restore original</button>
            <button
              onClick={() => {
                returnFocus.current = true;
                finish();
              }}
            >
              Keep changes
            </button>
          </div>
          <p className="comparison-hint">
            Estimates for this experiment. Neither plate is scored.
          </p>
        </>
      )}
    </section>
  );
}
