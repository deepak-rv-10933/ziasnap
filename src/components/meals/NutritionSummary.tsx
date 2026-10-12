import type { NutritionValues } from "@/types";
import { cn } from "@/lib/utils";

interface NutritionSummaryProps {
  nutrition: NutritionValues;
  label?: string;
  className?: string;
}

export function NutritionSummary({ nutrition, label = "Total", className }: NutritionSummaryProps) {
  return (
    <div className={cn("flex items-center justify-between rounded-2xl bg-muted/70 px-4 py-3.5", className)}>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
          {Math.round(nutrition.calories)} <span className="text-base font-medium text-muted-foreground">kcal</span>
        </p>
      </div>
      <div className="flex gap-3 text-right text-xs font-medium text-muted-foreground">
        <span>
          <span className="block tabular-nums text-sm text-foreground">{Math.round(nutrition.proteinG)}g</span>
          protein
        </span>
        <span>
          <span className="block tabular-nums text-sm text-foreground">{Math.round(nutrition.carbsG)}g</span>
          carbs
        </span>
        <span>
          <span className="block tabular-nums text-sm text-foreground">{Math.round(nutrition.fatG)}g</span>
          fat
        </span>
      </div>
    </div>
  );
}
