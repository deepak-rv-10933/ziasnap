"use client";

import type { Goal, MealType } from "@/types";
import { ThaliLegend, ThaliRing } from "./ThaliRing";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface CalorieProgressProps {
  consumed: number;
  target: number;
  goal: Goal;
  byMeal: Partial<Record<MealType, number>>;
}

export function CalorieProgress({ consumed, target, goal, byMeal }: CalorieProgressProps) {
  const animatedConsumed = useAnimatedNumber(consumed);
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const isGainGoal = goal === "gain";

  const statusText = isGainGoal
    ? isOver
      ? `Goal reached, ${Math.round(Math.abs(remaining)).toLocaleString("en-IN")} kcal beyond`
      : `${Math.round(remaining).toLocaleString("en-IN")} kcal to reach today's goal`
    : isOver
      ? `${Math.round(Math.abs(remaining)).toLocaleString("en-IN")} kcal over target`
      : `${Math.round(remaining).toLocaleString("en-IN")} kcal remaining`;

  return (
    <div className="flex flex-col items-center">
      <ThaliRing byMeal={byMeal} target={target} overLimitStroke={isGainGoal ? "var(--brand-leaf)" : "var(--brand-chili)"}>
        <div className="flex flex-col items-center">
          <span className="font-display text-4xl font-semibold tabular-nums text-white sm:text-5xl">
            {Math.round(animatedConsumed).toLocaleString("en-IN")}
          </span>
          <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/60">
            of {target.toLocaleString("en-IN")} kcal
          </span>
        </div>
      </ThaliRing>
      <ThaliLegend byMeal={byMeal} />
      <p
        className={
          "mt-3 text-sm font-medium " +
          (isOver && !isGainGoal ? "text-brand-chili" : "text-white/85")
        }
        role="status"
      >
        {statusText}
      </p>
    </div>
  );
}
