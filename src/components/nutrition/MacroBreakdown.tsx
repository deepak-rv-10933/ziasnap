import type { NutritionValues } from "@/types";
import { cn } from "@/lib/utils";

interface MacroBreakdownProps {
  nutrition: NutritionValues;
  target?: NutritionValues;
  className?: string;
}

export function MacroBreakdown({ nutrition, target, className }: MacroBreakdownProps) {
  const rows: { label: string; value: number; targetValue?: number; colorClass: string }[] = [
    { label: "Protein", value: nutrition.proteinG, targetValue: target?.proteinG, colorClass: "bg-brand-leaf" },
    { label: "Carbs", value: nutrition.carbsG, targetValue: target?.carbsG, colorClass: "bg-brand-turmeric" },
    { label: "Fat", value: nutrition.fatG, targetValue: target?.fatG, colorClass: "bg-brand-tamarind" },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      {rows.map((row) => (
        <div key={row.label} className="rounded-2xl border border-border/70 bg-card px-3 py-3 text-center">
          <p className="font-display text-lg font-semibold tabular-nums text-foreground">
            {Math.round(row.value)}g
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">{row.label}</p>
          {row.targetValue !== undefined ? (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", row.colorClass)}
                style={{ width: `${Math.min((row.value / Math.max(row.targetValue, 1)) * 100, 100)}%` }}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
