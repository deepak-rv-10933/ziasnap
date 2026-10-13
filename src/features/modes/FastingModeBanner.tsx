"use client";

import Link from "next/link";
import { MoonStars } from "@phosphor-icons/react";
import { useProfileQuery } from "@/hooks/useProfile";
import { FASTING_MODES, activeFastingMode } from "@/services/modes/fasting-modes";
import { toDateKey } from "@/lib/utils/date";

export function FastingModeBanner() {
  const profileQuery = useProfileQuery();
  const active = profileQuery.data ? activeFastingMode(profileQuery.data.nutritionPreferences, toDateKey(new Date())) : undefined;
  if (!active) return null;
  const info = FASTING_MODES[active.type];
  return (
    <Link
      href="/profile"
      className="flex items-start gap-2.5 rounded-2xl border border-brand-turmeric/40 bg-brand-turmeric-soft/60 px-4 py-3 text-sm text-foreground transition-colors hover:bg-brand-turmeric-soft"
    >
      <MoonStars weight="fill" className="mt-0.5 size-4 shrink-0 text-brand-tamarind dark:text-brand-turmeric" aria-hidden="true" />
      <span>
        <span className="font-semibold">{info.label} mode.</span> {info.summary}
      </span>
    </Link>
  );
}
