import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { generateId } from "@/lib/utils/id";
import { mealTypeFromHour } from "@/lib/utils/date";
import { useConfirmMealMutation } from "./useMealConfirm";
import { removeEntry } from "@/lib/offline/outbox";
import type { FoodItem, MealType } from "@/types";

/**
 * One-tap logging for meals the user already knows (a favorite, yesterday's
 * breakfast, a typed list). Saves straight away and offers Undo in the toast,
 * instead of an extra confirmation step.
 */
export function useQuickLog() {
  const queryClient = useQueryClient();
  const confirmMeal = useConfirmMealMutation();

  const log = (label: string, items: FoodItem[], mealType?: MealType) =>
    confirmMeal.mutateAsync(
      {
        type: mealType ?? mealTypeFromHour(new Date().getHours()),
        source: "manual",
        // Fresh ids: the same favorite can be logged many times.
        items: items.map((item) => ({ ...item, id: generateId("food") })),
      },
      {
        onSuccess: (meal) => {
          const offline = meal.id.startsWith("offline-");
          toast.success(offline ? `Saved ${label} offline. It will sync later.` : `Logged ${label}`, {
            action: {
              label: "Undo",
              onClick: async () => {
                if (offline) {
                  removeEntry(meal.id);
                  return;
                }
                await api.deleteMeal(meal.id).catch(() => toast.error("Couldn't undo. Delete it from History."));
                queryClient.invalidateQueries({ queryKey: ["today"] });
                queryClient.invalidateQueries({ queryKey: ["history"] });
                queryClient.invalidateQueries({ queryKey: queryKeys.streak });
              },
            },
          });
        },
        onError: () => toast.error(`Couldn't log ${label}. Please try again.`),
      },
    );

  return { log, isLogging: confirmMeal.isPending };
}
