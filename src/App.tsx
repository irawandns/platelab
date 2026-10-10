import { lazy, Suspense, useRef } from "react";
import {
  ArrowUpRight,
  CircleHelp,
  FlaskConical,
  Leaf,
  Plus,
  RotateCcw,
  Undo2,
  X,
  MousePointer2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { FoodLibrary } from "./components/FoodLibrary";
import { NutritionDashboard } from "./components/NutritionDashboard";
import { PortionControls } from "./components/PortionControls";
import { FoodArt } from "./components/FoodArt";
import { usePlate } from "./lib/store";
import { foodById, portionLabel } from "./lib/nutrition";
const PlateScene = lazy(() => import("./components/PlateScene"));
export default function App() {
  const { items, selectedItemId, history, announcement, select, reset, undo } =
    usePlate();
  const help = useRef<HTMLDialogElement>(null);
  return (
    <>
      <a className="skip-link" href="#playground">
        Skip to your plate
      </a>
      <header className="site-header">
        <a className="brand" href="./" aria-label="PlateLab home">
          <span className="brand-icon">
            <span />
          </span>
          <span>
            plate<span className="brand-serif">lab</span>
          </span>
        </a>
        <span className="brand-tagline">
          Build a plate. Discover nutrition.
        </span>
        <div className="header-right">
          <span className="header-note">
            <span />
            Made for curious minds
          </span>
          <button
            className="help-button"
            onClick={() => help.current?.showModal()}
          >
            <CircleHelp size={17} />
            <span>How it works</span>
          </button>
        </div>
      </header>
      <div className="page-intro">
        <div>
          <span className="eyebrow">
            <FlaskConical size={13} /> YOUR EVERYDAY FOOD EXPERIMENT
          </span>
          <h1>
            A little curiosity. <em>A plate of possibilities.</em>
          </h1>
        </div>
        <p>
          No goals to hit. No foods off limits.
          <br />
          Just a delicious way to learn.
        </p>
      </div>
      <main className="workspace-layout">
        <FoodLibrary />
        <section
          id="playground"
          className="playground"
          aria-label="Your plate"
          tabIndex={-1}
        >
          <div className="playground-top">
            <div>
              <span className="eyebrow">THE PLAYGROUND</span>
              <h2>Let’s see what’s on your plate.</h2>
            </div>
            <div className="plate-actions">
              <button
                className="icon-button"
                aria-label="Undo last change"
                title="Undo last change"
                disabled={!history.length}
                onClick={undo}
              >
                <Undo2 size={17} />
              </button>
              <button
                className="reset-button"
                disabled={!items.length}
                onClick={reset}
              >
                <RotateCcw size={14} />
                Clear plate
              </button>
            </div>
          </div>
          <div className="plate-stage">
            <span className="plate-counter">
              <span />
              {items.length} {items.length === 1 ? "food" : "foods"} on your
              plate
            </span>
            <Suspense
              fallback={<div className="scene-loading">Setting the table…</div>}
            >
              <PlateScene />
            </Suspense>
            {!items.length && (
              <div className="empty-plate-message" aria-hidden="true">
                <span>
                  <Plus size={23} strokeWidth={1.4} />
                </span>
                <strong>Something delicious starts here</strong>
                <p>Add your first food from the shelf</p>
              </div>
            )}
            <span className="scene-caption">
              <MousePointer2 size={12} />
              Drag foods to arrange · drag the table to rotate
            </span>
          </div>
          <div className="plate-list" aria-label="Foods on your plate">
            {items.map((item, index) => (
              <button
                key={item.instanceId}
                aria-label={`Select ${foodById[item.foodId].name}, item ${index + 1}, ${portionLabel(foodById[item.foodId], item.portionGrams)}`}
                aria-pressed={selectedItemId === item.instanceId}
                onClick={() => select(item.instanceId)}
              >
                <FoodArt id={item.foodId} />
                <span>{foodById[item.foodId].name}</span>
              </button>
            ))}
          </div>
          <PortionControls />
          {!items.length && (
            <div className="discovery-steps">
              <div>
                <span>01</span>
                <MousePointer2 size={18} />
                <strong>Pick a food</strong>
                <p>Follow your curiosity.</p>
              </div>
              <div>
                <span>02</span>
                <SlidersHorizontal size={18} />
                <strong>Play with portions</strong>
                <p>A little more, a little less.</p>
              </div>
              <div>
                <span>03</span>
                <Sparkles size={18} />
                <strong>See what changes</strong>
                <p>Make a new discovery.</p>
              </div>
            </div>
          )}
          <div className="playground-footer">
            <Leaf size={14} />
            <span>There’s no perfect plate. That’s the fun of it.</span>
          </div>
        </section>
        <NutritionDashboard />
      </main>
      <footer className="site-footer">
        <span>GOOD FOOD. GREAT QUESTIONS.</span>
        <span>
          Made for exploration, not restriction.
          <span className="footer-dot">·</span>
          <button onClick={() => help.current?.showModal()}>
            About this little lab <ArrowUpRight size={12} />
          </button>
        </span>
      </footer>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <dialog
        aria-labelledby="help-heading"
        ref={help}
        className="help-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) help.current?.close();
        }}
      >
        <div className="dialog-content">
          <button
            className="icon-button dialog-close"
            aria-label="Close help"
            onClick={() => help.current?.close()}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">WELCOME TO YOUR LITTLE LAB</span>
          <h2 id="help-heading">
            Play with your food.
            <br />
            <em>Learn a little along the way.</em>
          </h2>
          <p>
            PlateLab makes nutrition visible. Build a meal, change a portion,
            and explore what happens.
          </p>
          <ol>
            <li>
              <strong>Pick something from the shelf.</strong> Click or tap any
              food, or drag it onto the plate. Add it more than once if you
              like.
            </li>
            <li>
              <strong>Make it your own.</strong> Select a food to change its
              portion, move it with arrow buttons, or remove it. You can also
              drag food on the plate.
            </li>
            <li>
              <strong>Follow the numbers.</strong> The whole plate and each food
              have nutrition estimates. Undo brings back an accidental change or
              cleared plate.
            </li>
          </ol>
          <p className="help-footnote">
            All values use USDA SR28 data and edible weights. Missing data stays
            unknown. The 3D sizes are illustrative, and this experience does not
            give medical or dietary advice. Your plate stays in this session and
            resets on reload.
          </p>
          <button
            className="primary-button"
            onClick={() => help.current?.close()}
          >
            Let’s experiment <ArrowUpRight size={17} />
          </button>
        </div>
      </dialog>
    </>
  );
}
