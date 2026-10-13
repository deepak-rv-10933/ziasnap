import { Sparkle } from "@phosphor-icons/react/dist/ssr";

/** Shown while a Coach task runs (13 to 20 seconds). Says what's happening instead of a bare spinner. */
export function ZiaWorking({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-4" role="status" aria-live="polite">
      <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric">
        <Sparkle weight="fill" className="size-4 motion-safe:animate-pulse" aria-hidden="true" />
        <span className="absolute inset-0 rounded-full border-2 border-brand-turmeric/50 motion-safe:animate-ping" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">This takes about 15 seconds.</p>
      </div>
    </div>
  );
}
