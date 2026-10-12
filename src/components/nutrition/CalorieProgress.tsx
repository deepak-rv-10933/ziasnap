"use client";

import type { Goal } from "@/types";
import { NutritionRing } from "./NutritionRing";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface CalorieProgressProps {
  consumed: number;
  target: number;
  goal: Goal;
}

export function CalorieProgress({ consumed, target, goal }: CalorieProgressProps) {
  const animatedConsumed = useAnimatedNumber(consumed);
  const percent = target > 0 ? (consumed / target) * 100 : 0;
  const remaining = target - consumed;
  const isOver = remaining < 0;
  const isGainGoal = goal === "gain";

  const statusText = isGainGoal
    ? isOver
      ? `Goal reached — ${Math.round(Math.abs(remaining)).toLocaleString("en-IN")} kcal beyond`
      : `${Math.round(remaining).toLocaleString("en-IN")} kcal to reach today's goal`
    : isOver
      ? `${Math.round(Math.abs(remaining)).toLocaleString("en-IN")} kcal over target`
      : `${Math.round(remaining).toLocaleString("en-IN")} kcal remaining`;

  return (
    <div className="flex flex-col items-center">
      <NutritionRing
        percent={percent}
        trackClassName="text-white/15"
        progressClassName="text-brand-turmeric"
        overLimitClassName={isGainGoal ? "text-brand-leaf" : "text-brand-chili"}
      >
        <div className="flex flex-col items-center">
          <span className="font-display text-4xl font-semibold tabular-nums text-white sm:text-5xl">
            {Math.round(animatedConsumed).toLocaleString("en-IN")}
          </span>
          <span className="mt-0.5 text-xs font-medium uppercase tracking-wide text-white/60">
            of {target.toLocaleString("en-IN")} kcal
          </span>
        </div>
      </NutritionRing>
      <p
        className={
          "mt-4 text-sm font-medium " +
          (isOver && !isGainGoal ? "text-brand-chili" : "text-white/85")
        }
        role="status"
      >
        {statusText}
      </p>
    </div>
  );
}
