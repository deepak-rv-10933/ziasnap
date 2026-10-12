import type { DailySummary, Goal } from "@/types";
import { CalorieProgress } from "./CalorieProgress";
import { ProteinProgress } from "./ProteinProgress";

interface TodayHeroCardProps {
  summary: DailySummary;
  goal: Goal;
}

export function TodayHeroCard({ summary, goal }: TodayHeroCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-brand-tamarind px-6 pb-7 pt-8 text-white shadow-[0_20px_45px_-20px_rgba(107,58,46,0.55)] dark:shadow-[0_20px_45px_-20px_rgba(0,0,0,0.6)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-brand-turmeric/20 blur-2xl"
      />
      <div className="relative flex flex-col items-center">
        <CalorieProgress consumed={summary.totalNutrition.calories} target={summary.target.calorieTarget} goal={goal} />
        <div className="mt-7 w-full max-w-xs">
          <ProteinProgress
            consumed={summary.totalNutrition.proteinG}
            target={summary.target.proteinTargetG}
            tone="dark"
          />
        </div>
      </div>
    </div>
  );
}
