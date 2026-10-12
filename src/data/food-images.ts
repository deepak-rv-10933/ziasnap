/**
 * Curated, verified Unsplash photo URLs used across ZiaSnap's mock data and
 * UI. Each URL was confirmed to resolve to a real image before being added
 * here — replace only with another verified Unsplash URL.
 */
export const FOOD_IMAGES = {
  idli: "https://images.unsplash.com/photo-1741376509047-66dae5df90f9?auto=format&fit=crop&w=1200&q=80",
  dosa: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1200&q=80",
  masalaDosa: "https://images.unsplash.com/photo-1743615467363-250466982515?auto=format&fit=crop&w=1200&q=80",
  vegetableDosa: "https://images.unsplash.com/photo-1751560455942-f859f1215826?auto=format&fit=crop&w=1200&q=80",
  sambar: "https://images.unsplash.com/photo-1741376509187-0b683c764294?auto=format&fit=crop&w=1200&q=80",
  coconutChutney: "https://images.unsplash.com/photo-1694849789325-914b71ab4075?auto=format&fit=crop&w=1200&q=80",
  tomatoChutney: "https://images.unsplash.com/photo-1743517894265-c86ab035adef?auto=format&fit=crop&w=1200&q=80",
  pongal: "https://images.unsplash.com/photo-1576394435759-02a2674ff6e0?auto=format&fit=crop&w=1200&q=80",
  vada: "https://images.unsplash.com/photo-1730191843435-073792ba22bc?auto=format&fit=crop&w=1200&q=80",
  upma: "https://images.unsplash.com/photo-1627035537727-96e5d592bbb6?auto=format&fit=crop&w=1200&q=80",
  curdRice: "https://images.unsplash.com/photo-1633383718081-22ac93e3db65?auto=format&fit=crop&w=1200&q=80",
  lemonRice: "https://images.unsplash.com/photo-1782931608912-ccda83062946?auto=format&fit=crop&w=1200&q=80",
  biryani: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=1200&q=80",
  steamedRice: "https://images.unsplash.com/photo-1743674452796-ad8d0cf38005?auto=format&fit=crop&w=1200&q=80",
  rasam: "https://images.unsplash.com/photo-1608949621301-dc970e104c90?auto=format&fit=crop&w=1200&q=80",
  poriyal: "https://images.unsplash.com/photo-1619161208416-b7d5f04c5b99?auto=format&fit=crop&w=1200&q=80",
  curd: "https://images.unsplash.com/photo-1571212515416-fef01fc43637?auto=format&fit=crop&w=1200&q=80",
  chickenCurry: "https://images.unsplash.com/photo-1742599361539-f096753d1100?auto=format&fit=crop&w=1200&q=80",
  fishFry: "https://images.unsplash.com/photo-1665401015549-712c0dc5ef85?auto=format&fit=crop&w=1200&q=80",
  boiledEgg: "https://images.unsplash.com/photo-1576343123473-0e7d3a34c5da?auto=format&fit=crop&w=1200&q=80",
  eggOmelette: "https://images.unsplash.com/photo-1563690449029-d6e1b8d6003d?auto=format&fit=crop&w=1200&q=80",
  paneerCurry: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=80",
  roti: "https://images.unsplash.com/photo-1671507136750-05ebd0f97843?auto=format&fit=crop&w=1200&q=80",
  dal: "https://images.unsplash.com/photo-1626500154744-e4b394ffea16?auto=format&fit=crop&w=1200&q=80",
  sabzi: "https://images.unsplash.com/photo-1767114915989-c6ab3c8fc42e?auto=format&fit=crop&w=1200&q=80",
  greekYogurt: "https://images.unsplash.com/photo-1692071106919-01bc0b9b0919?auto=format&fit=crop&w=1200&q=80",
  banana: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=1200&q=80",
  filterCoffee: "https://images.unsplash.com/photo-1668236482744-b48b28650f12?auto=format&fit=crop&w=1200&q=80",
  southIndianThali: "https://images.unsplash.com/photo-1742281257687-092746ad6021?auto=format&fit=crop&w=1200&q=80",
  heroMealPhoto: "https://images.unsplash.com/photo-1742281257707-0c7f7e5ca9c6?auto=format&fit=crop&w=1200&q=80",
  emptyStatePhoto: "https://images.unsplash.com/photo-1562114808-b4b33cf60f4f?auto=format&fit=crop&w=1200&q=80",
} as const;

export type FoodImageKey = keyof typeof FOOD_IMAGES;
