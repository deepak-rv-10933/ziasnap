"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { hasPendingMeal } from "@/lib/guest/pending-meal";
import { OnboardingProgress } from "@/components/forms/OnboardingProgress";
import { DietaryPreferenceSelector } from "@/components/forms/DietaryPreferenceSelector";
import { NutritionPreferenceSelector } from "@/components/forms/NutritionPreferenceSelector";
import { ChipMultiSelect } from "@/components/forms/ChipSelect";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { useSubmitOnboardingMutation } from "@/hooks/useOnboarding";
import { findCatalogFood } from "@/data/food-catalog";

// A curated, deliberately short list rather than the full catalog — this
// screen is a quick preference signal, not an exhaustive inventory.
const CURATED_FOOD_IDS = [
  "dosa",
  "idli",
  "biryani",
  "curd-rice",
  "chicken-curry",
  "paneer-curry",
  "roti",
  "dal",
  "fish-fry",
  "egg-omelette",
  "vada",
  "upma",
  "greek-yogurt",
  "banana",
];
const FOOD_NAMES = CURATED_FOOD_IDS.map((id) => findCatalogFood(id)?.name).filter((name): name is string => Boolean(name));

export default function NutritionProfilePage() {
  const router = useRouter();
  const draft = useUserStore((state) => state.draft);
  const setDietaryPreference = useUserStore((state) => state.setDietaryPreference);
  const setCuisinePreference = useUserStore((state) => state.setCuisinePreference);
  const toggleFavoriteFood = useUserStore((state) => state.toggleFavoriteFood);
  const toggleAvoidFood = useUserStore((state) => state.toggleAvoidFood);
  const setHealthContext = useUserStore((state) => state.setHealthContext);
  const toggleNutrientPriority = useUserStore((state) => state.toggleNutrientPriority);
  const resetDraft = useUserStore((state) => state.resetDraft);

  const submitOnboarding = useSubmitOnboardingMutation();

  const handleFinish = () => {
    const { personalDetails, goal, activityLevel, ...preferences } = draft;
    submitOnboarding.mutate(
      {
        personalDetails,
        goal,
        activityLevel,
        nutritionPreferences: preferences,
      },
      {
        onSuccess: () => {
          toast.success("You're all set!");
          resetDraft();
          router.push(hasPendingMeal() ? "/snap" : "/home");
        },
        onError: () => toast.error("Something went wrong. Please try again."),
      },
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <OnboardingProgress step={2} totalSteps={2} label="Your food" />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        What do you usually eat?
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This helps Zia recognize your meals and recommend food you&apos;ll actually eat.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Dietary preference</p>
          <DietaryPreferenceSelector value={draft.dietaryPreference} onChange={setDietaryPreference} />
        </div>

        <NutritionPreferenceSelector
          cuisinePreference={draft.cuisinePreference}
          onCuisineChange={setCuisinePreference}
          nutrientPriorities={draft.nutrientPriorities}
          onToggleNutrientPriority={toggleNutrientPriority}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Foods you enjoy</p>
          <ChipMultiSelect
            options={FOOD_NAMES}
            values={draft.favoriteFoods}
            onToggle={toggleFavoriteFood}
            aria-label="Favorite foods"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Foods to avoid</p>
          <ChipMultiSelect
            options={FOOD_NAMES}
            values={draft.avoidFoods}
            onToggle={toggleAvoidFood}
            aria-label="Foods to avoid"
          />
        </div>

        <div>
          <Label htmlFor="health-context" className="mb-1.5">
            Nutrition or health context (optional)
          </Label>
          <Textarea
            id="health-context"
            value={draft.healthContext}
            onChange={(event) => setHealthContext(event.target.value)}
            placeholder="e.g. keeping an eye on cholesterol, prefer less oil…"
            rows={3}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            This is used as dietary context only. ZiaSnap doesn&apos;t diagnose or treat medical conditions.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Button type="button" size="lg" className="w-full" disabled={submitOnboarding.isPending} onClick={handleFinish}>
          {submitOnboarding.isPending ? "Setting up…" : "Complete setup"}
        </Button>
      </div>
    </div>
  );
}
