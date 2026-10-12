import type { ConfidenceLevel } from "@/types";
import { CheckCircle, Circle, Question } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface AIConfidenceIndicatorProps {
  confidence: ConfidenceLevel;
  note?: string;
  className?: string;
}

const META: Record<
  ConfidenceLevel,
  { label: string; description: string; icon: typeof CheckCircle; className: string }
> = {
  high: {
    label: "High confidence",
    description: "Zia is fairly confident about this plate.",
    icon: CheckCircle,
    className: "bg-brand-leaf-soft text-brand-leaf",
  },
  medium: {
    label: "Medium confidence",
    description: "This looks about right. Double-check portions that seem off.",
    icon: Circle,
    className: "bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric",
  },
  low: {
    label: "Estimate",
    description: "This is a rough estimate. Please review before saving.",
    icon: Question,
    className: "bg-muted text-muted-foreground",
  },
};

export function AIConfidenceIndicator({ confidence, note, className }: AIConfidenceIndicatorProps) {
  const meta = META[confidence];
  const Icon = meta.icon;
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl px-4 py-3", meta.className, className)}>
      <Icon weight="fill" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{meta.label}</p>
        <p className="mt-0.5 text-xs opacity-90">{note ?? meta.description}</p>
      </div>
    </div>
  );
}
