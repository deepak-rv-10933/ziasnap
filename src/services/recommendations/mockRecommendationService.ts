import type { DailySummary, FoodItem, MealRecommendation, RecommendationReasonTag, UserProfile } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { RECOMMENDATION_TEMPLATES, type RecommendationTemplate } from "@/data/recommendation-templates";
import { buildFoodItem } from "@/lib/utils/food-item";
import { generateId } from "@/lib/utils/id";

function itemsForTemplate(template: RecommendationTemplate): FoodItem[] {
  return template.items.map((item) => buildFoodItem(item.catalogId, { quantity: item.quantity }));
}

function isAllowedByDiet(template: RecommendationTemplate, profile: UserProfile): boolean {
  const preference = profile.nutritionPreferences.dietaryPreference;
  if (preference === "non_vegetarian") return true;
  if (preference === "eggitarian") return template.isVegetarian || template.containsEgg;
  return template.isVegetarian;
}

function describeFit(
  calories: number,
  proteinG: number,
  remainingCalories: number,
  remainingProteinG: number,
): string {
  const calorieText =
    remainingCalories > 0
      ? `Fits your remaining ${Math.round(remainingCalories)} kcal`
      : "A lighter option since you're near today's calorie target";
  const proteinText =
    remainingProteinG > 0
      ? `and adds ${Math.round(proteinG)}g toward your ${Math.round(remainingProteinG)}g protein left`
      : `with ${Math.round(proteinG)}g protein`;
  return `${calorieText} ${proteinText}.`;
}

export function buildRecommendations(
  profile: UserProfile,
  todaySummary: DailySummary,
): MealRecommendation[] {
  const remainingCalories = todaySummary.remaining.calories;
  const remainingProteinG = todaySummary.remaining.proteinG;
  const nutrientPriorities = profile.nutritionPreferences.nutrientPriorities;

  const scored = RECOMMENDATION_TEMPLATES.filter((template) => isAllowedByDiet(template, profile)).map(
    (template) => {
      const items = itemsForTemplate(template);
      const nutrition = sumNutrition(items.map((item) => item.nutrition));
      const calorieFitScore = Math.abs(nutrition.calories - Math.max(remainingCalories, 300));
      const proteinDensityScore = -(nutrition.proteinG / Math.max(nutrition.calories, 1));
      const cuisineMatchBonus = template.cuisine === profile.nutritionPreferences.cuisinePreference ? -150 : 0;
      const nutrientPriorityBonus = template.addressesNutrientPriorities.some((priority) =>
        nutrientPriorities.includes(priority),
      )
        ? -100
        : 0;
      const score = calorieFitScore + proteinDensityScore * 200 + cuisineMatchBonus + nutrientPriorityBonus;
      return { template, items, nutrition, score };
    },
  );

  scored.sort((a, b) => a.score - b.score);
  const top = scored.slice(0, 3);

  return top.map(({ template, items, nutrition }) => {
    const reasonTags = new Set<RecommendationReasonTag>(template.baseReasonTags);
    if (nutrition.calories <= remainingCalories * 1.15) reasonTags.add("fits_remaining_calories");
    if (template.addressesNutrientPriorities.some((priority) => nutrientPriorities.includes(priority))) {
      reasonTags.add("nutrient_gap");
    }
    reasonTags.add("goal_aligned");

    const recommendation: MealRecommendation = {
      id: generateId("rec"),
      name: template.name,
      description: template.description,
      imageQuery: template.photoKey,
      nutrition,
      items,
      reasonTags: Array.from(reasonTags),
      whyItFits: describeFit(nutrition.calories, nutrition.proteinG, remainingCalories, remainingProteinG),
      addressesNutrientPriorities: template.addressesNutrientPriorities,
      cuisine: template.cuisine,
    };
    return recommendation;
  });
}
