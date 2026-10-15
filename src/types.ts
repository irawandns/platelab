export const categories = [
  "All foods",
  "Carbohydrates",
  "Protein",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Other",
] as const;
export type Category = Exclude<(typeof categories)[number], "All foods">;
export type Nutrient =
  "calories" | "protein" | "carbohydrates" | "fat" | "fiber";
export type Nutrients = Record<Nutrient, number | null>;
export interface Food {
  available?: boolean;
  id: string;
  name: string;
  category: Category;
  preparation: string;
  defaultPortionGrams: number;
  minPortionGrams: number;
  maxPortionGrams: number;
  servingLabel: string;
  countable: boolean;
  conversionNote: string;
  nutrientsPer100g: Nutrients;
  educationalDescription: string;
  source: { database: string; id: string; description: string; url: string };
}
export interface PlateItem {
  instanceId: string;
  foodId: string;
  portionGrams: number;
  position: [number, number];
  pose?: FoodPose;
  cooking?: CookingSettings;
  form?: "sliced" | "whole";
}
export type CookingMethod = "sear" | "pan-fry" | "deep-fry" | "air-fry";
export type OilId = "soybean" | "olive" | "palm";
export type OilUnit = "g" | "tsp" | "tbsp";
export interface CookingSettings {
  method: CookingMethod;
  oilId: OilId;
  // Absent means the example preset scales with the reference food weight.
  // A custom amount belongs to this serving and stays fixed on portion edits.
  oil?: {
    grams: number;
    basis: "in-serving" | "used";
    retainedPercent: number;
  };
}
export interface FoodPose {
  position: [number, number, number];
  rotation: [number, number, number, number];
}
