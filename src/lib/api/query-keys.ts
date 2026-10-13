export const queryKeys = {
  account: ["account"] as const,
  profile: ["profile"] as const,
  goals: ["goals"] as const,
  today: (dateKey?: string) => ["today", dateKey ?? "current"] as const,
  history: (start?: string, end?: string) => ["history", start ?? "default", end ?? "default"] as const,
  insights: (weekStart?: string) => ["insights", weekStart ?? "current"] as const,
  recommendations: ["recommendations"] as const,
  meal: (id: string) => ["meal", id] as const,
  water: (dateKey?: string) => ["water", dateKey ?? "today"] as const,
  weight: ["weight"] as const,
  favorites: ["favorites"] as const,
  streak: ["streak"] as const,
};
