import type { Icon } from "@phosphor-icons/react";
import { ForkKnife } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: Icon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon: IconComponent = ForkKnife, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric">
        <IconComponent className="size-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {description ? <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
