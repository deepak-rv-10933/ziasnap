import { FOOD_IMAGES, type FoodImageKey } from "@/data/food-images";

/** Resolves a semantic image key (e.g. a food's `imageQuery`) to a curated
 * photo URL, falling back to a neutral hero image if the key is unknown. */
export function resolveFoodImage(key: string | undefined): string {
  if (key && key in FOOD_IMAGES) {
    return FOOD_IMAGES[key as FoodImageKey];
  }
  return FOOD_IMAGES.emptyStatePhoto;
}

/** Curated photo key for a dish name, or undefined when there's no good match. */
export function imageKeyForName(name: string): FoodImageKey | undefined {
  const key = toImageKey(name);
  return key in FOOD_IMAGES ? (key as FoodImageKey) : undefined;
}

function toImageKey(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .split(/[^a-z]+/)
    .filter(Boolean);
  return words.map((word, index) => (index === 0 ? word : word[0].toUpperCase() + word.slice(1))).join("");
}

/**
 * Photo for a food item. Catalog items carry an `imageQuery`; items Zia
 * detects don't, so try the dish name against the curated set ("Coconut
 * Chutney" → coconutChutney). No match returns undefined — a neutral
 * placeholder beats showing the wrong dish.
 */
export function foodImageForItem(item: { imageQuery?: string; name: string }): string | undefined {
  if (item.imageQuery && item.imageQuery in FOOD_IMAGES) return FOOD_IMAGES[item.imageQuery as FoodImageKey];
  const key = toImageKey(item.name);
  return key in FOOD_IMAGES ? FOOD_IMAGES[key as FoodImageKey] : undefined;
}
