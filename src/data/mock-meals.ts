import type { Meal, MealType } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { MEAL_TEMPLATES, templatesFor, type MealTemplate } from "@/data/meal-templates";
import { buildFoodItem } from "@/lib/utils/food-item";
import { resolveFoodImage } from "@/lib/utils/food-image";
import { generateId } from "@/lib/utils/id";
import { MOCK_USER_ID } from "@/data/mock-user";

interface ScheduledMeal {
  type: MealType;
  hour: number;
  minute: number;
  includeOnToday: boolean;
  /** Skip this slot on some days for a realistic, non-robotic history. */
  skipOnDayOffsets?: number[];
}

const SCHEDULE: ScheduledMeal[] = [
  { type: "breakfast", hour: 7, minute: 40, includeOnToday: true },
  { type: "lunch", hour: 13, minute: 15, includeOnToday: true },
  { type: "snack", hour: 16, minute: 45, includeOnToday: false, skipOnDayOffsets: [2, 5, 7] },
  { type: "dinner", hour: 20, minute: 20, includeOnToday: false },
];

function pickTemplate(type: MealType, dayOffset: number): MealTemplate {
  const options = templatesFor(type, false);
  const pool = options.length > 0 ? options : MEAL_TEMPLATES;
  return pool[dayOffset % pool.length];
}

const IST_OFFSET_MINUTES = 330;

function buildMealAt(dayOffset: number, schedule: ScheduledMeal): Meal {
  const template = pickTemplate(schedule.type, dayOffset + (schedule.type === "snack" ? 1 : 0));
  const items = template.items.map((item) =>
    buildFoodItem(item.catalogId, {
      quantity: item.quantity,
      confidence: item.confidence,
      preparationNote: item.preparationNote,
    }),
  );

  // Arjun lives in India: pin the schedule to IST, not the server's timezone
  // (Slate runs in UTC, which turned a 7:40 breakfast into 1:10 pm).
  const istNow = new Date(Date.now() + IST_OFFSET_MINUTES * 60_000);
  const loggedAt = new Date(
    Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate() - dayOffset, schedule.hour, schedule.minute) -
      IST_OFFSET_MINUTES * 60_000,
  );
  const dateKey = new Date(loggedAt.getTime() + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10);

  return {
    id: generateId("meal"),
    userId: MOCK_USER_ID,
    type: schedule.type,
    source: "photo",
    photoUrl: resolveFoodImage(template.photoKey),
    items,
    totalNutrition: sumNutrition(items.map((item) => item.nutrition)),
    loggedAt: loggedAt.toISOString(),
    dateKey,
    confirmedAt: loggedAt.toISOString(),
  };
}

const HISTORY_DAYS = 9;

function buildMockMeals(): Meal[] {
  const meals: Meal[] = [];

  for (let dayOffset = HISTORY_DAYS; dayOffset >= 0; dayOffset -= 1) {
    for (const schedule of SCHEDULE) {
      if (dayOffset === 0 && !schedule.includeOnToday) continue;
      if (schedule.skipOnDayOffsets?.includes(dayOffset)) continue;
      meals.push(buildMealAt(dayOffset, schedule));
    }
  }

  return meals;
}

export const MOCK_MEALS: Meal[] = buildMockMeals();
