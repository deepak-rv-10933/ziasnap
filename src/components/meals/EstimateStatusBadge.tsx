import type { FoodItem } from "@/types";
import { Sparkle, UserCheck } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { estimateStatus, estimateStatusLabel } from "@/lib/utils/estimate-status";
import { ConfidenceBadge } from "./ConfidenceBadge";

/**
 * Tells the user whose number this is: Zia's estimate (with how sure Zia
 * was) or something they entered or corrected themselves.
 */
export function EstimateStatusBadge({ item, className }: { item: FoodItem; className?: string }) {
  const status = estimateStatus(item);
  if (status === "ai_estimate") {
    return (
      <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[0.6875rem] font-semibold text-muted-foreground">
          <Sparkle weight="fill" className="size-3" />
          AI estimate
        </span>
        <ConfidenceBadge confidence={item.confidence} />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-brand-leaf-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-leaf",
        className,
      )}
    >
      <UserCheck weight="fill" className="size-3" />
      {estimateStatusLabel(item)}
    </span>
  );
}

/** "3 AI estimates · 1 edited by you" — a meal-level summary of the same distinction. */
export function estimateSummary(items: FoodItem[]): string {
  const counts = { ai_estimate: 0, edited: 0, added: 0 };
  items.forEach((item) => (counts[estimateStatus(item)] += 1));
  const parts = [
    counts.ai_estimate ? `${counts.ai_estimate} AI estimate${counts.ai_estimate === 1 ? "" : "s"}` : null,
    counts.edited ? `${counts.edited} edited by you` : null,
    counts.added ? `${counts.added} added by you` : null,
  ].filter(Boolean);
  return parts.join(" · ");
}
