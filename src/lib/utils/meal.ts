import type { FoodItem, MealType } from "@/types";

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  snack: "Snack",
  dinner: "Dinner",
};

export function mealSummaryLabel(items: FoodItem[]): string {
  if (items.length === 0) return "No items";
  const names = items.map((item) => item.name);
  if (names.length <= 2) return names.join(" + ");
  return `${names.slice(0, 2).join(" + ")} + ${names.length - 2} more`;
}
