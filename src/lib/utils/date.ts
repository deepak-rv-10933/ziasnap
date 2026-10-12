export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysAgoKey(daysAgo: number, from: Date = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() - daysAgo);
  return toDateKey(date);
}

export function isSameDateKey(isoTimestamp: string, dateKey: string): boolean {
  return toDateKey(new Date(isoTimestamp)) === dateKey;
}

export function formatTime(isoTimestamp: string): string {
  return new Date(isoTimestamp).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDayLabel(dateKey: string): string {
  const today = toDateKey(new Date());
  const yesterday = daysAgoKey(1);
  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function mealTypeFromHour(hour: number): "breakfast" | "lunch" | "snack" | "dinner" {
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}
