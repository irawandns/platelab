import { InstancedFoodPortion } from "./InstancedFoodPortion";

export function FoodPortion({ id, ratio }: { id: string; ratio: number }) {
  return <InstancedFoodPortion id={id} ratio={ratio} />;
}
