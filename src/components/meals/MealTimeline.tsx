"use client";

import { motion } from "framer-motion";
import type { Meal, MealType } from "@/types";
import { MealCard } from "./MealCard";
import { MEAL_TYPE_LABEL } from "@/lib/utils/meal";
import { EmptyState } from "@/components/feedback/EmptyState";

const ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

interface MealTimelineProps {
  meals: Meal[];
  emptyMessage?: string;
}

export function MealTimeline({ meals, emptyMessage }: MealTimelineProps) {
  if (meals.length === 0) {
    return (
      <EmptyState
        title="No meals logged yet"
        description={emptyMessage ?? "Snap your first meal to start today's timeline."}
      />
    );
  }

  const grouped = ORDER.map((type) => ({
    type,
    meals: meals.filter((meal) => meal.type === type).sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)),
  })).filter((group) => group.meals.length > 0);

  return (
    <div className="flex flex-col gap-5">
      {grouped.map((group) => (
        <div key={group.type}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {MEAL_TYPE_LABEL[group.type]}
          </h3>
          <div className="flex flex-col gap-2">
            {group.meals.map((meal, index) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
              >
                <MealCard meal={meal} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
