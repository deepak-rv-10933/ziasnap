"use client";

import { toast } from "sonner";
import type { MealRecommendation } from "@/types";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { NutritionSummary } from "@/components/meals/NutritionSummary";
import { Button } from "@/components/ui/button";
import { REASON_TAG_LABEL } from "@/lib/utils/recommendation";
import { mealTypeFromHour } from "@/lib/utils/date";
import { useConfirmMealMutation } from "@/hooks/useMealConfirm";

interface RecommendationDetailSheetProps {
  recommendation: MealRecommendation | null;
  onOpenChange: (open: boolean) => void;
}

export function RecommendationDetailSheet({ recommendation, onOpenChange }: RecommendationDetailSheetProps) {
  const confirmMeal = useConfirmMealMutation();

  const handleLog = () => {
    if (!recommendation) return;
    confirmMeal.mutate(
      {
        type: mealTypeFromHour(new Date().getHours()),
        source: "manual",
        items: recommendation.items,
        notes: `Logged from recommendation: ${recommendation.name}`,
      },
      {
        onSuccess: () => {
          toast.success("Meal logged", { description: recommendation.name });
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Couldn't log this meal. Please try again.");
        },
      },
    );
  };

  return (
    <BottomSheet
      open={Boolean(recommendation)}
      onOpenChange={onOpenChange}
      title={recommendation?.name}
      description={recommendation?.description}
    >
      {recommendation ? (
        <div className="flex flex-col gap-4">
          <NutritionSummary nutrition={recommendation.nutrition} />

          <div className="flex flex-wrap gap-1.5">
            {recommendation.reasonTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-turmeric-soft px-2.5 py-1 text-xs font-medium text-brand-tamarind dark:text-brand-turmeric"
              >
                {REASON_TAG_LABEL[tag]}
              </span>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What&apos;s in it</p>
            <ul className="flex flex-col gap-1.5">
              {recommendation.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {item.name} <span className="text-muted-foreground">· {item.portion.label}</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">{Math.round(item.nutrition.calories)} kcal</span>
                </li>
              ))}
            </ul>
          </div>

          <Button type="button" onClick={handleLog} disabled={confirmMeal.isPending} className="w-full">
            {confirmMeal.isPending ? "Logging…" : "Log this meal"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Or snap a photo when you actually eat it for a more accurate estimate.
          </p>
        </div>
      ) : null}
    </BottomSheet>
  );
}
