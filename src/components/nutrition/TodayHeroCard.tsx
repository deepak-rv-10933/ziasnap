import type { DailySummary, Goal, MealType } from "@/types";
import { CalorieProgress } from "./CalorieProgress";
import { ProteinProgress } from "./ProteinProgress";

interface TodayHeroCardProps {
  summary: DailySummary;
  goal: Goal;
}

function caloriesByMeal(summary: DailySummary): Partial<Record<MealType, number>> {
  return summary.meals.reduce<Partial<Record<MealType, number>>>((totals, meal) => {
    totals[meal.type] = (totals[meal.type] ?? 0) + meal.totalNutrition.calories;
    return totals;
  }, {});
}

/** Today at a glance: the day's thali, filling meal by meal. */
export function TodayHeroCard({ summary, goal }: TodayHeroCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(160deg,var(--hero-from),var(--hero-to))] px-6 pb-7 pt-8 text-white shadow-[0_24px_50px_-24px_rgba(14,31,45,0.65)] ring-1 ring-white/10">
      {/* A soft overhead light on the steel, nothing more. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[120%] -translate-x-1/2 rounded-[50%] bg-white/[0.07] blur-2xl"
      />
      <div className="relative flex flex-col items-center">
        <CalorieProgress
          consumed={summary.totalNutrition.calories}
          target={summary.target.calorieTarget}
          goal={goal}
          byMeal={caloriesByMeal(summary)}
        />
        <div className="mt-6 w-full max-w-xs">
          <ProteinProgress consumed={summary.totalNutrition.proteinG} target={summary.target.proteinTargetG} tone="dark" />
        </div>
      </div>
    </div>
  );
}
