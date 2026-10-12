import type { NutritionValues } from "@/types";
import { cn } from "@/lib/utils";

interface RemainingBudgetCardProps {
  remaining: NutritionValues;
  className?: string;
}

function StatBlock({ label, value, unit, isOver }: { label: string; value: number; unit: string; isOver: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-border/70 bg-card px-3 py-3">
      <span
        className={cn(
          "font-display text-xl font-semibold tabular-nums",
          isOver ? "text-brand-chili" : "text-foreground",
        )}
      >
        {isOver ? "+" : ""}
        {Math.round(Math.abs(value))}
        {unit}
      </span>
      <span className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

export function RemainingBudgetCard({ remaining, className }: RemainingBudgetCardProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-2.5", className)}>
      <StatBlock label="Calories left" value={remaining.calories} unit="" isOver={remaining.calories < 0} />
      <StatBlock label="Protein left" value={remaining.proteinG} unit="g" isOver={remaining.proteinG < 0} />
      <StatBlock label="Carbs left" value={remaining.carbsG} unit="g" isOver={remaining.carbsG < 0} />
      <StatBlock label="Fat left" value={remaining.fatG} unit="g" isOver={remaining.fatG < 0} />
    </div>
  );
}
