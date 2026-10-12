import type { Goal, GoalTargets } from "@/types";
import { TrendDown, TrendUp, Minus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  targets: GoalTargets;
  className?: string;
}

const GOAL_META: Record<Goal, { label: string; icon: typeof TrendDown }> = {
  lose: { label: "Losing weight", icon: TrendDown },
  gain: { label: "Gaining weight", icon: TrendUp },
  maintain: { label: "Maintaining weight", icon: Minus },
};

function balanceLabel(goal: Goal, balance: number): string {
  const magnitude = Math.round(Math.abs(balance));
  if (goal === "maintain" || magnitude < 30) return "At maintenance calories";
  if (goal === "lose") return `${magnitude} kcal/day deficit`;
  return `${magnitude} kcal/day surplus`;
}

export function GoalCard({ goal, targets, className }: GoalCardProps) {
  const meta = GOAL_META[goal];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-3xl border border-border/70 bg-card p-5", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-brand-tamarind dark:text-brand-turmeric">
        <Icon weight="bold" className="size-4" />
        {meta.label}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
            {targets.calorieTarget.toLocaleString("en-IN")}
          </p>
          <p className="text-xs font-medium text-muted-foreground">kcal / day target</p>
        </div>
        <div>
          <p className="font-display text-2xl font-semibold tabular-nums text-foreground">
            {targets.proteinTargetG}g
          </p>
          <p className="text-xs font-medium text-muted-foreground">protein / day target</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {balanceLabel(goal, targets.dailyEnergyBalance)} · maintenance is about{" "}
        {targets.maintenanceCalories.toLocaleString("en-IN")} kcal/day
      </p>
    </div>
  );
}
