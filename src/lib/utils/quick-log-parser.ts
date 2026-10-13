import { FOOD_CATALOG, type CatalogFood } from "@/data/food-catalog";

export interface ParsedQuickLogItem {
  catalogFood: CatalogFood;
  quantity: number;
  /** The words this item was read from, for the preview. */
  source: string;
}

export interface QuickLogParse {
  items: ParsedQuickLogItem[];
  unmatched: string[];
}

const NUMBER_WORDS: Record<string, number> = {
  half: 0.5, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  ek: 1, do: 2, teen: 3, char: 4, rendu: 2, moonu: 3, onnu: 1,
};

/** Everyday words for catalog dishes (English, plus common Hindi/Tamil names). */
const ALIASES: Record<string, string> = {
  coffee: "filter-coffee", kaapi: "filter-coffee", "filter coffee": "filter-coffee",
  chutney: "coconut-chutney", "coconut chutney": "coconut-chutney", "tomato chutney": "tomato-chutney",
  egg: "egg-boiled", "boiled egg": "egg-boiled", omelette: "egg-omelette", omelet: "egg-omelette",
  rice: "steamed-rice", "white rice": "steamed-rice", chawal: "steamed-rice", sadam: "steamed-rice",
  chapati: "roti", chapathi: "roti", phulka: "roti",
  paneer: "paneer-curry", chicken: "chicken-curry", fish: "fish-fry",
  yogurt: "greek-yogurt", dahi: "curd", thayir: "curd", "curd rice": "curd-rice", "thayir sadam": "curd-rice",
  ghee: "cooking-oil", oil: "cooking-oil", dal: "dal", paruppu: "dal",
  vadai: "vada", "medu vada": "vada", kozhambu: "sambar", "veg dosa": "vegetable-dosa",
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s.]/g, " ").replace(/\s+/g, " ").trim();
}

function singular(word: string): string {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

function matchFood(phrase: string): CatalogFood | undefined {
  const candidates = [phrase, phrase.split(" ").map(singular).join(" ")];
  for (const candidate of candidates) {
    const alias = ALIASES[candidate];
    if (alias) return FOOD_CATALOG.find((food) => food.id === alias);
    const exact = FOOD_CATALOG.find((food) => food.name.toLowerCase() === candidate || food.id === candidate.replace(/ /g, "-"));
    if (exact) return exact;
  }
  // Longest catalog name contained in the phrase ("masala dosa with ghee" → Masala Dosa).
  const contained = [...FOOD_CATALOG]
    .sort((a, b) => b.name.length - a.name.length)
    .find((food) => candidates.some((candidate) => candidate.includes(food.name.toLowerCase())));
  if (contained) return contained;
  const aliasHit = Object.keys(ALIASES)
    .sort((a, b) => b.length - a.length)
    .find((alias) => candidates.some((candidate) => new RegExp(`\\b${alias}\\b`).test(candidate)));
  return aliasHit ? FOOD_CATALOG.find((food) => food.id === ALIASES[aliasHit]) : undefined;
}

/**
 * Reads a typed or spoken meal like "2 idli, sambar and a filter coffee"
 * into catalog items. Anything it can't place is returned as `unmatched`
 * so the UI can say so instead of guessing.
 */
export function parseQuickLog(text: string): QuickLogParse {
  // Split on separators before normalizing — normalizing strips the commas and "+".
  const parts = text
    .toLowerCase()
    .split(/\s*(?:[,;+&\n]|\band\b|\bwith\b|\bplus\b)\s*/)
    .map(normalize)
    .filter(Boolean);

  const items: ParsedQuickLogItem[] = [];
  const unmatched: string[] = [];
  for (const part of parts) {
    const words = part.split(" ");
    let quantity = 1;
    const first = words[0];
    if (/^\d+(\.\d+)?$/.test(first)) {
      quantity = Number(first);
      words.shift();
    } else if (first in NUMBER_WORDS && words.length > 1) {
      quantity = NUMBER_WORDS[first];
      words.shift();
    }
    const phrase = words.filter((word) => !["of", "cup", "cups", "bowl", "bowls", "plate", "plates", "glass"].includes(word)).join(" ");
    const food = phrase ? matchFood(phrase) : undefined;
    if (!food) {
      if (part) unmatched.push(part);
      continue;
    }
    const existing = items.find((item) => item.catalogFood.id === food.id);
    if (existing) existing.quantity += quantity;
    else items.push({ catalogFood: food, quantity: Math.min(Math.max(quantity, 0.5), 20), source: part });
  }
  return { items, unmatched };
}
