import type { ConfidenceLevel } from "@/types";
import { CheckCircle, Circle, Question } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  className?: string;
}

const CONFIDENCE_META: Record<ConfidenceLevel, { label: string; icon: typeof CheckCircle; className: string }> = {
  high: {
    label: "High confidence",
    icon: CheckCircle,
    className: "bg-brand-leaf-soft text-brand-leaf",
  },
  medium: {
    label: "Medium confidence",
    icon: Circle,
    className: "bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric",
  },
  low: {
    label: "Estimate",
    icon: Question,
    className: "bg-muted text-muted-foreground",
  },
};

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const meta = CONFIDENCE_META[confidence];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold",
        meta.className,
        className,
      )}
    >
      <Icon weight="fill" className="size-3" />
      {meta.label}
    </span>
  );
}
