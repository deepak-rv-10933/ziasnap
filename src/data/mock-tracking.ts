import type { FavoriteMeal, WaterEntry, WeightEntry } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { buildFoodItem } from "@/lib/utils/food-item";

/** Sample tracker data for the demo user, laid out in IST like the sample meals. */
const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

function istDateKey(daysAgo: number): string {
  return new Date(Date.now() + IST_OFFSET_MS - daysAgo * DAY_MS).toISOString().slice(0, 10);
}

function istTime(daysAgo: number, hour: number, minute: number): string {
  const dateKey = istDateKey(daysAgo);
  return new Date(Date.parse(`${dateKey}T00:00:00Z`) + (hour * 60 + minute) * 60_000 - IST_OFFSET_MS).toISOString();
}

/** A month of mornings, trending gently down from ~74.6 kg with normal day-to-day noise. */
export function buildMockWeights(): WeightEntry[] {
  const noise = [0.3, -0.2, 0.5, -0.4, 0.1, 0.6, -0.3, 0.2, -0.5, 0.4];
  const entries: WeightEntry[] = [];
  for (let daysAgo = 30; daysAgo >= 0; daysAgo -= 1) {
    if (daysAgo % 4 === 3) continue; // nobody weighs in every single day
    entries.push({
      id: `weight_${daysAgo}`,
      dateKey: istDateKey(daysAgo),
      weightKg: Math.round((72.4 + daysAgo * 0.07 + noise[daysAgo % noise.length]) * 10) / 10,
    });
  }
  return entries;
}

export interface MockWaterEntry extends WaterEntry {
  dateKey: string;
}

export function buildMockWater(): MockWaterEntry[] {
  const pattern: Record<number, [number, number][]> = {
    0: [[7, 30], [10, 15], [13, 40], [16, 5]],
    1: [[7, 10], [9, 45], [12, 30], [15, 20], [18, 0], [20, 30], [21, 45]],
    2: [[8, 0], [11, 30], [14, 15], [17, 45], [20, 0]],
  };
  return Object.entries(pattern).flatMap(([daysAgo, times]) =>
    times.map(([hour, minute], index) => ({
      id: `water_${daysAgo}_${index}`,
      dateKey: istDateKey(Number(daysAgo)),
      amountMl: 250,
      loggedAt: istTime(Number(daysAgo), hour, minute),
    })),
  );
}

export function buildMockFavorites(): FavoriteMeal[] {
  const favorite = (id: string, name: string, mealType: FavoriteMeal["mealType"], items: ReturnType<typeof buildFoodItem>[]) => ({
    id,
    name,
    mealType,
    items,
    totalNutrition: sumNutrition(items.map((item) => item.nutrition)),
  });
  return [
    favorite("fav_idli", "Idli breakfast", "breakfast", [
      buildFoodItem("idli", { quantity: 3 }),
      buildFoodItem("sambar"),
      buildFoodItem("coconut-chutney"),
      buildFoodItem("filter-coffee"),
    ]),
    favorite("fav_curd_rice", "Curd rice lunch", "lunch", [buildFoodItem("curd-rice"), buildFoodItem("poriyal")]),
  ];
}
