import { useEffect, useMemo } from "react";
import { mealTrayGeometry } from "../lib/tray-geometry";

export function MealTrayModel() {
  const geometry = useMemo(mealTrayGeometry, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh name="plate-meal-tray" geometry={geometry}>
      <meshStandardMaterial color="#bfc7ce" metalness={0.9} roughness={0.27} />
    </mesh>
  );
}
