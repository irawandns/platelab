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
}
export interface FoodPose {
  position: [number, number, number];
  rotation: [number, number, number, number];
}
