"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowsClockwise, ForkKnife, Lightning, Star } from "@phosphor-icons/react";
import { useTodayQuery } from "@/hooks/useToday";
import { useFavoritesQuery } from "@/hooks/useTracking";
import { useQuickLog } from "@/hooks/useQuickLog";
import { daysAgoKey, mealTypeFromHour } from "@/lib/utils/date";
import { MEAL_TYPE_LABEL } from "@/lib/utils/meal";
import { QuickLogSheet } from "./QuickLogSheet";

const chip =
  "pressable inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50 disabled:opacity-60";

/** Fast paths for meals the user already knows: type/say, repeat yesterday, favorites. */
export function QuickLogRow() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const favoritesQuery = useFavoritesQuery();
  const yesterdayQuery = useTodayQuery(daysAgoKey(1));
  const { log, isLogging } = useQuickLog();

  const currentType = mealTypeFromHour(new Date().getHours());
  const yesterdayMeal = yesterdayQuery.data?.meals.filter((meal) => meal.type === currentType).at(-1);

  return (
    <section aria-label="Quick log">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button type="button" className={chip} onClick={() => setSheetOpen(true)}>
          <Lightning weight="fill" className="size-4 text-brand-turmeric" aria-hidden="true" />
          Type or say a meal
        </button>
        <Link href="/eating-out" className={chip}>
          <ForkKnife className="size-4 text-muted-foreground" aria-hidden="true" />
          Eating out
        </Link>
        {yesterdayMeal ? (
          <button
            type="button"
            className={chip}
            disabled={isLogging}
            onClick={() => log(`yesterday's ${MEAL_TYPE_LABEL[currentType].toLowerCase()}`, yesterdayMeal.items, currentType)}
          >
            <ArrowsClockwise className="size-4 text-muted-foreground" aria-hidden="true" />
            Repeat yesterday&apos;s {MEAL_TYPE_LABEL[currentType].toLowerCase()}
          </button>
        ) : null}
        {(favoritesQuery.data ?? []).map((favorite) => (
          <button
            key={favorite.id}
            type="button"
            className={chip}
            disabled={isLogging}
            onClick={() => log(favorite.name, favorite.items, favorite.mealType)}
          >
            <Star weight="fill" className="size-4 text-brand-turmeric" aria-hidden="true" />
            {favorite.name}
            <span className="tabular-nums text-muted-foreground">{Math.round(favorite.totalNutrition.calories)} kcal</span>
          </button>
        ))}
      </div>
      <QuickLogSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </section>
  );
}
