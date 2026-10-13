import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { hasRealApi, isDemoMode } from "@/lib/catalyst/web-sdk";

const PREFIX = "ziasnap.cache.";

/** Remembered screens last a day; older data is refetched before it's shown. */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Real accounts and the demo never share a cache. */
function storageKey(): string {
  return PREFIX + (!hasRealApi ? "mock" : isDemoMode() ? "demo" : "real");
}

export function createQueryPersister() {
  return createSyncStoragePersister({
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    key: storageKey(),
    throttleTime: 1000,
  });
}

/** On sign-out and account deletion: nothing of the last user stays on the device. */
export function clearPersistedQueries() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    /* storage blocked: nothing was persisted */
  }
}
