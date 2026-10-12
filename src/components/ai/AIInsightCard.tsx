import type { NutritionInsight } from "@/types";
import { CheckCircle, Info, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface AIInsightCardProps {
  insight: NutritionInsight;
}

const SEVERITY_META = {
  positive: { icon: CheckCircle, className: "bg-brand-leaf-soft text-brand-leaf" },
  neutral: { icon: Info, className: "bg-muted text-muted-foreground" },
  attention: { icon: WarningCircle, className: "bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric" },
} satisfies Record<NutritionInsight["severity"], { icon: typeof CheckCircle; className: string }>;

export function AIInsightCard({ insight }: AIInsightCardProps) {
  const meta = SEVERITY_META[insight.severity];
  const Icon = meta.icon;

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", meta.className)}>
          <Icon weight="fill" className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{insight.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{insight.observation}</p>
          <p className="mt-2 text-sm font-medium text-foreground">{insight.suggestion}</p>
        </div>
      </div>
    </div>
  );
}
