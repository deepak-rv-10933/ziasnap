"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { MealPhoto } from "@/components/meals/MealPhoto";
import { FoodItemCard } from "@/components/meals/FoodItemCard";
import { Star } from "@phosphor-icons/react";
import { useSaveFavoriteMutation } from "@/hooks/useTracking";
import { estimateSummary } from "@/components/meals/EstimateStatusBadge";
import { mealDateKey } from "@/types/meal";
import { FoodItemEditor } from "@/components/meals/FoodItemEditor";
import { NutritionSummary } from "@/components/meals/NutritionSummary";
import { MealTypeSelector } from "@/components/forms/MealTypeSelector";
import { ConfirmationSheet } from "@/components/feedback/ConfirmationSheet";
import { HeroCardSkeleton, TextLineSkeleton } from "@/components/feedback/Skeletons";
import { ErrorState } from "@/components/feedback/ErrorState";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MEAL_TYPE_LABEL, mealSummaryLabel } from "@/lib/utils/meal";
import { formatDayLabel, formatTime } from "@/lib/utils/date";
import { sumNutrition } from "@/types/nutrition";
import { generateId } from "@/lib/utils/id";
import { useMealQuery, useUpdateMealMutation, useDeleteMealMutation } from "@/hooks/useMeal";
import { useConfirmMealMutation } from "@/hooks/useMealConfirm";
import type { FoodItem, MealType } from "@/types";

export function MealDetail({ id }: { id: string }) {
  const router = useRouter();

  const mealQuery = useMealQuery(id);
  const updateMeal = useUpdateMealMutation(id);
  const deleteMeal = useDeleteMealMutation(id);
  const duplicateMeal = useConfirmMealMutation();
  const saveFavorite = useSaveFavoriteMutation();

  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [mealType, setMealType] = useState<MealType>("breakfast");
  const [notes, setNotes] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (mealQuery.isPending) {
    return (
      <div className="flex flex-col gap-4">
        <TextLineSkeleton className="h-8 w-40" />
        <HeroCardSkeleton />
      </div>
    );
  }

  if (mealQuery.isError || !mealQuery.data) {
    return <ErrorState title="Couldn't load this meal" onRetry={() => mealQuery.refetch()} />;
  }

  const meal = mealQuery.data;

  const startEditing = () => {
    setItems(meal.items);
    setMealType(meal.type);
    setNotes(meal.notes ?? "");
    setEditing(true);
  };

  const handleUpdateItem = (itemId: string, patch: Partial<FoodItem>) => {
    setItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...patch, isEdited: true } : item)));
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((current) => current.filter((item) => item.id !== itemId));
  };

  const handleSaveEdits = () => {
    updateMeal.mutate(
      { type: mealType, items, notes },
      {
        onSuccess: () => {
          toast.success("Meal updated");
          setEditing(false);
        },
        onError: () => toast.error("Couldn't save your changes"),
      },
    );
  };

  const handleDuplicate = () => {
    duplicateMeal.mutate(
      {
        type: meal.type,
        source: "manual",
        photoUrl: meal.photoUrl,
        items: meal.items.map((item) => ({ ...item, id: generateId("food") })),
        notes: meal.notes,
      },
      {
        onSuccess: (newMeal) => {
          toast.success("Meal duplicated to today");
          router.push(`/meal?id=${newMeal.id}`);
        },
        onError: () => toast.error("Couldn't duplicate this meal"),
      },
    );
  };

  const handleSaveFavorite = () => {
    saveFavorite.mutate(
      { name: mealSummaryLabel(meal.items), mealType: meal.type, items: meal.items },
      {
        onSuccess: () => toast.success("Saved to favorites. Log it again from Today in one tap."),
        onError: (error) => toast.error(error.message || "Couldn't save this favorite"),
      },
    );
  };

  const handleDelete = () => {
    deleteMeal.mutate(undefined, {
      onSuccess: () => {
        toast.success("Meal deleted");
        router.push("/home");
      },
      onError: () => toast.error("Couldn't delete this meal"),
    });
  };

  const displayNutrition = editing ? sumNutrition(items.map((item) => item.nutrition)) : meal.totalNutrition;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={editing ? "Edit meal" : MEAL_TYPE_LABEL[meal.type]}
        subtitle={`${formatDayLabel(mealDateKey(meal))} · ${formatTime(meal.loggedAt)}`}
        backHref="/history"
        actions={
          editing ? null : (
            <Button type="button" variant="outline" size="sm" onClick={startEditing}>
              Edit
            </Button>
          )
        }
      />

      {meal.photoUrl ? (
        <MealPhoto src={meal.photoUrl} alt={mealSummaryLabel(meal.items)} aspect="wide" className="w-full" />
      ) : null}

      {editing ? (
        <MealTypeSelector value={mealType} onChange={setMealType} />
      ) : meal.items.length > 0 ? (
        <p className="text-xs text-muted-foreground">{estimateSummary(meal.items)}</p>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {(editing ? items : meal.items).map((item) =>
          editing ? (
            <FoodItemEditor key={item.id} item={item} onChange={handleUpdateItem} onRemove={handleRemoveItem} />
          ) : (
            <FoodItemCard key={item.id} item={item} />
          ),
        )}
      </div>

      {editing ? (
        <div>
          <label htmlFor="meal-detail-notes" className="mb-1.5 block text-sm font-medium text-foreground">
            Notes
          </label>
          <Textarea id="meal-detail-notes" value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} />
        </div>
      ) : meal.notes ? (
        <p className="text-sm text-muted-foreground">{meal.notes}</p>
      ) : null}

      <NutritionSummary nutrition={displayNutrition} />

      {editing ? (
        <div className="flex gap-2.5">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button type="button" className="flex-1" onClick={handleSaveEdits} disabled={updateMeal.isPending}>
            {updateMeal.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleSaveFavorite}
            disabled={saveFavorite.isPending || saveFavorite.isSuccess}
          >
            <Star weight={saveFavorite.isSuccess ? "fill" : "regular"} className="size-4" />
            {saveFavorite.isSuccess ? "Saved to favorites" : "Save as favorite"}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={handleDuplicate} disabled={duplicateMeal.isPending}>
            {duplicateMeal.isPending ? "Duplicating…" : "Duplicate"}
          </Button>
          <Button type="button" variant="destructive" className="flex-1" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      )}

      <ConfirmationSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this meal?"
        description="This can't be undone. Your daily totals will update immediately."
        confirmLabel="Delete meal"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
