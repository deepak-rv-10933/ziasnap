import { Skeleton } from "@/components/ui/skeleton";

export function MealCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card p-3">
      <Skeleton className="size-16 shrink-0 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function HeroCardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-3xl bg-muted px-6 py-10">
      <Skeleton className="size-52 rounded-full" />
      <Skeleton className="mt-6 h-4 w-56 max-w-xs" />
    </div>
  );
}

export function RecommendationCardSkeleton() {
  return (
    <div className="w-56 shrink-0 rounded-2xl border border-border/70 bg-card p-3">
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <Skeleton className="mt-3 h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  );
}

export function StatBlockSkeleton() {
  return <Skeleton className="h-16 rounded-2xl" />;
}

export function TextLineSkeleton({ className }: { className?: string }) {
  return <Skeleton className={className ?? "h-4 w-32"} />;
}
