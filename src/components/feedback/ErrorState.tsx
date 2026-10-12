import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something didn't load",
  description = "Check your connection and try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-brand-chili/20 bg-brand-chili-soft/40 px-6 py-10 text-center",
        className,
      )}
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-brand-chili-soft text-brand-chili">
        <WarningCircle className="size-6" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-4">
          Try again
        </Button>
      ) : null}
    </div>
  );
}
