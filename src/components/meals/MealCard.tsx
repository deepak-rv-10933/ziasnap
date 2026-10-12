import Link from "next/link";
import type { Meal } from "@/types";
import { MealPhoto } from "./MealPhoto";
import { MEAL_TYPE_LABEL, mealSummaryLabel } from "@/lib/utils/meal";
import { formatTime } from "@/lib/utils/date";

interface MealCardProps {
  meal: Meal;
}

export function MealCard({ meal }: MealCardProps) {
  return (
    <Link
      href={`/meal/${meal.id}`}
      className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
    >
      <MealPhoto
        src={meal.photoUrl}
        alt={`Photo of ${MEAL_TYPE_LABEL[meal.type].toLowerCase()}: ${mealSummaryLabel(meal.items)}`}
        aspect="square"
        className="size-16 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{MEAL_TYPE_LABEL[meal.type]}</p>
          <p className="shrink-0 text-xs text-muted-foreground">{formatTime(meal.loggedAt)}</p>
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{mealSummaryLabel(meal.items)}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs font-medium text-foreground">
          <span className="tabular-nums">{Math.round(meal.totalNutrition.calories)} kcal</span>
          <span className="tabular-nums text-brand-leaf">{Math.round(meal.totalNutrition.proteinG)}g protein</span>
        </div>
      </div>
    </Link>
  );
}
