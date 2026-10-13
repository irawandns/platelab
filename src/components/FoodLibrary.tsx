import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Search, Plus, ArrowUpRight, X } from "lucide-react";
import { foods, format, summarize } from "../lib/nutrition";
import { usePlate, MAX_ITEMS } from "../lib/store";
import { categories } from "../types";
import { FoodArt } from "./FoodArt";
const mobileQuery = "(max-width: 767px)";
function subscribeToMobile(callback: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function FoodLibrary() {
  const mobile = useSyncExternalStore(
    subscribeToMobile,
    () => window.matchMedia(mobileQuery).matches,
    () => false,
  );
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  const items = usePlate((s) => s.items);
  useEffect(() => {
    if (!mobile || !open || !dialog.current) return;
    const sheet = dialog.current;
    const previousOverflow = document.body.style.overflow;
    sheet.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      sheet.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [mobile, open]);
  useEffect(() => {
    if (!mobile) setOpen(false);
  }, [mobile]);
  if (!mobile) return <FoodShelf headingId={headingId} />;
  const close = () => setOpen(false);
  return (
    <>
      <div className="mobile-food-bar">
        <div className="mobile-meal-summary">
          <strong>{format(summarize(items).totals.calories, 0)} kcal</strong>
          <span>
            {items.length} {items.length === 1 ? "food" : "foods"} on your plate
          </span>
        </div>
        <button
          className="mobile-add-food"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Plus size={19} /> Add food
        </button>
      </div>
      <dialog
        ref={dialog}
        className="food-sheet"
        aria-labelledby={headingId}
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <FoodShelf headingId={headingId} onClose={close} />
      </dialog>
    </>
  );
}

function FoodShelf({
  headingId,
  onClose,
}: {
  headingId: string;
  onClose?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All foods");
  const add = usePlate((s) => s.add);
  const full = usePlate((s) => s.items.length >= MAX_ITEMS);
  const filtered = foods.filter(
    (f) =>
      (category === "All foods" || f.category === category) &&
      `${f.name} ${f.preparation}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <aside className="library panel" aria-labelledby={headingId}>
      <div className="panel-heading">
        <div>
          <span className="eyebrow">A LITTLE INSPIRATION</span>
          <h2 id={headingId}>The food shelf</h2>
        </div>
        {onClose ? (
          <button
            className="food-sheet-close"
            aria-label="Close food shelf"
            onClick={onClose}
            autoFocus
          >
            <X size={20} />
          </button>
        ) : (
          <span className="count-badge">{foods.length}</span>
        )}
      </div>
      <p className="panel-intro">Familiar foods. New discoveries.</p>
      <div className="search-box">
        <Search size={17} />
        <input
          aria-label="Search foods"
          placeholder="Find a food…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button aria-label="Clear search" onClick={() => setQuery("")}>
            <X size={15} />
          </button>
        )}
      </div>
      <div className="filters" aria-label="Food categories">
        {categories
          .filter(
            (c) =>
              c === "All foods" || foods.some((food) => food.category === c),
          )
          .map((c) => (
            <button
              key={c}
              aria-pressed={category === c}
              className={category === c ? "active" : ""}
              onClick={() => setCategory(c)}
            >
              {c === "Carbohydrates" ? "Carbs" : c}
            </button>
          ))}
      </div>
      <div className="food-grid" aria-label="Available foods">
        {filtered.map((food) => (
          <button
            className={`food-card food-${food.category.toLowerCase()}`}
            key={food.id}
            aria-label={`Add ${food.name}`}
            disabled={full}
            draggable={!full && !onClose}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/platelab-food", food.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => {
              add(food.id);
              onClose?.();
            }}
          >
            <span className="food-art-wrap">
              <FoodArt id={food.id} />
              <span className="add-symbol">
                <Plus size={13} />
              </span>
            </span>
            <span className="food-name">{food.name}</span>
            <span className="food-serving">
              {food.servingLabel}
              <span>·</span>
              {format(
                (food.nutrientsPer100g.calories! * food.defaultPortionGrams) /
                  100,
                0,
              )}{" "}
              kcal
            </span>
          </button>
        ))}
        {!filtered.length && (
          <div className="no-results">
            <Search size={24} />
            <p>No foods found.</p>
            <span>Try another name or category.</span>
            <button
              onClick={() => {
                setQuery("");
                setCategory("All foods");
              }}
            >
              Show all foods
            </button>
          </div>
        )}
      </div>
      <div className={`library-foot${full ? " library-full" : ""}`}>
        <ArrowUpRight size={15} />
        {full
          ? "Plate full · remove a food to add more"
          : onClose
            ? "Tap a food to add it to your plate"
            : "Click to add, or drag onto your plate"}
      </div>
    </aside>
  );
}
