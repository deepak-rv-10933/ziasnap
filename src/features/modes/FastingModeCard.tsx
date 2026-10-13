"use client";

import { toast } from "sonner";
import { MoonStars } from "@phosphor-icons/react";
import { useProfileQuery, useUpdateProfileMutation } from "@/hooks/useProfile";
import { FASTING_MODES, activeFastingMode, newFastingMode } from "@/services/modes/fasting-modes";
import { toDateKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import type { FastingModeType } from "@/types";

const ORDER: FastingModeType[] = ["navratri", "ekadashi", "ramadan"];

function shortDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Indian-first modes: switch suggestions to suit a fast or festival for its usual length. */
export function FastingModeCard() {
  const profileQuery = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const today = toDateKey(new Date());
  if (!profileQuery.data) return null;

  const active = activeFastingMode(profileQuery.data.nutritionPreferences, today);

  const choose = (type: FastingModeType | null) => {
    const fastingMode = type ? newFastingMode(type, today) : null;
    updateProfile.mutate(
      { nutritionPreferences: { fastingMode } },
      {
        onSuccess: () =>
          toast.success(
            fastingMode
              ? `${FASTING_MODES[fastingMode.type].label} mode on until ${shortDate(fastingMode.endDateKey)}`
              : "Back to your usual suggestions",
          ),
        onError: () => toast.error("Couldn't change the mode. Please try again."),
      },
    );
  };

  return (
    <section aria-labelledby="modes-title" className="rounded-2xl border border-border/70 bg-card p-4">
      <h2 id="modes-title" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <MoonStars weight="fill" className="size-4 text-brand-tamarind dark:text-brand-turmeric" aria-hidden="true" />
        Fasting &amp; festival mode
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {active
          ? `${FASTING_MODES[active.type].label} mode is on until ${shortDate(active.endDateKey)}. ${FASTING_MODES[active.type].summary}`
          : "Fasting or celebrating? Zia will suggest food that fits, for as long as it lasts."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Mode">
        {[null, ...ORDER].map((type) => {
          const selected = (active?.type ?? null) === type;
          return (
            <button
              key={type ?? "off"}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={updateProfile.isPending}
              onClick={() => !selected && choose(type)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
                selected
                  ? "border-brand-tamarind bg-brand-tamarind text-white dark:border-brand-turmeric dark:bg-brand-turmeric dark:text-[#1a1206]"
                  : "border-border bg-card text-foreground hover:bg-muted/60",
              )}
            >
              {type ? FASTING_MODES[type].label : "Off"}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Your calorie and protein targets stay the same. Check with a doctor before fasting if you have a medical condition.</p>
    </section>
  );
}
