"use client";

import { useSyncExternalStore } from "react";
import { hasRealApi, isDemoMode } from "./web-sdk";

/**
 * - "mock": build without the real backend (local UI work)
 * - "real": signed-in accounts on the ziasnap-api function
 * - "demo": a real build switched to sample data via /demo
 * - "pending": server render / first hydration pass, before the browser's
 *   demo flag can be read. Render something neutral for it.
 */
export type BackendMode = "mock" | "real" | "demo" | "pending";

const subscribe = () => () => {};
const getSnapshot = (): BackendMode => (!hasRealApi ? "mock" : isDemoMode() ? "demo" : "real");
const getServerSnapshot = (): BackendMode => (hasRealApi ? "pending" : "mock");

/** Render-safe backend mode: matches the server HTML on hydration, then settles. */
export function useBackendMode(): BackendMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
