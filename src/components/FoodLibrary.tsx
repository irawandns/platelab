import { useState } from "react";
import { Search, Plus, ArrowUpRight, X } from "lucide-react";
import { foods, format } from "../lib/nutrition";
import { usePlate, MAX_ITEMS } from "../lib/store";
import { categories } from "../types";
import { FoodArt } from "./FoodArt";
export function FoodLibrary() {
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
    <aside className="library panel" aria-labelledby="library-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">A LITTLE INSPIRATION</span>
          <h2 id="library-heading">The food shelf</h2>
        </div>
        <span className="count-badge">{foods.length}</span>
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
            draggable={!full}
            onDragStart={(e) => {
              e.dataTransfer.setData("application/platelab-food", food.id);
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() => add(food.id)}
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
      <div className="library-foot">
        <ArrowUpRight size={15} />
        {full
          ? "Plate full · remove a food to add more"
          : "Click to add, or drag onto your plate"}
      </div>
    </aside>
  );
}
