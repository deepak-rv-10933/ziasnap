import type { IncomingMessage } from "http";

/**
 * Best-effort limiter for the unauthenticated guest analyzer, which spends
 * Zia Agent credits without a login. State lives in the warm container only,
 * so it caps bursts rather than guaranteeing a global quota.
 */
const WINDOW_MS = 15 * 60 * 1000;
const PER_CLIENT_LIMIT = 5;
const PER_CONTAINER_LIMIT = 60;

const hitsByClient = new Map<string, number[]>();
let containerHits: number[] = [];

function clientKey(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim();
  return first || req.socket?.remoteAddress || "unknown";
}

/** Returns seconds until the client may retry, or 0 when the request is allowed (and counted). */
export function guestRetryAfterSeconds(req: IncomingMessage): number {
  const now = Date.now();
  const key = clientKey(req);
  const recent = (hitsByClient.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  containerHits = containerHits.filter((time) => now - time < WINDOW_MS);

  const blockingList = recent.length >= PER_CLIENT_LIMIT ? recent : containerHits.length >= PER_CONTAINER_LIMIT ? containerHits : null;
  if (blockingList) return Math.ceil((WINDOW_MS - (now - blockingList[0])) / 1000);

  recent.push(now);
  containerHits.push(now);
  hitsByClient.set(key, recent);
  if (hitsByClient.size > 5000) hitsByClient.clear();
  return 0;
}
