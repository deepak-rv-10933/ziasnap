import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionHref?: string;
  actionLabel?: string;
}

export function SectionHeader({ title, subtitle, actionHref, actionLabel = "View all" }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actionHref ? (
        <Link
          href={actionHref}
          className="flex shrink-0 items-center gap-0.5 text-sm font-medium text-brand-tamarind hover:underline dark:text-brand-turmeric"
        >
          {actionLabel}
          <CaretRight className="size-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
