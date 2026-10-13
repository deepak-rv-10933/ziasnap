import type { ConfirmMealInput } from "@/services/nutrition/NutritionRepository";

/**
 * Offline outbox: meals, water and weight logged without a connection wait
 * here (this browser's localStorage) and are sent, in order, once the app is
 * back online. Photo analysis is never queued; it needs Zia live.
 */
export type OutboxEntry =
  | { id: string; kind: "meal"; createdAt: string; payload: Omit<ConfirmMealInput, "userId"> }
  | { id: string; kind: "water"; createdAt: string; payload: { amountMl: number; dateKey: string } }
  | { id: string; kind: "weight"; createdAt: string; payload: { weightKg: number; dateKey: string } };

const KEY = "ziasnap.outbox";
const listeners = new Set<() => void>();
let cache: OutboxEntry[] | null = null;

function read(): OutboxEntry[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "[]") as OutboxEntry[];
  } catch {
    cache = [];
  }
  return cache;
}

function write(entries: OutboxEntry[]) {
  cache = entries;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* storage full or blocked: the queue still lives for this session */
  }
  listeners.forEach((listener) => listener());
}

/** Offline, or a fetch that never reached the server (not an HTTP error). */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return error instanceof TypeError;
}

export function enqueue<K extends OutboxEntry["kind"]>(kind: K, payload: Extract<OutboxEntry, { kind: K }>["payload"]): string {
  const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  write([...read(), { id, kind, payload, createdAt: new Date().toISOString() } as OutboxEntry]);
  return id;
}

export function removeEntry(id: string) {
  write(read().filter((entry) => entry.id !== id));
}

export function pendingEntries(): OutboxEntry[] {
  return typeof window === "undefined" ? [] : read();
}

export function subscribeOutbox(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let flushing = false;

/** Sends queued entries oldest-first; stops at the first network failure and keeps the rest. */
export async function flushOutbox(send: (entry: OutboxEntry) => Promise<unknown>): Promise<number> {
  if (flushing || typeof window === "undefined") return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const entry of [...read()]) {
      try {
        await send(entry);
        removeEntry(entry.id);
        sent += 1;
      } catch (error) {
        if (isNetworkError(error)) break;
        // The server rejected it (bad data): drop it rather than retry forever.
        console.error("Dropping outbox entry the server rejected", entry, error);
        removeEntry(entry.id);
      }
    }
  } finally {
    flushing = false;
  }
  return sent;
}
