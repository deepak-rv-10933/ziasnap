import type { IncomingMessage, ServerResponse } from "http";

/** Thrown anywhere in a handler to end the request with a specific status. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function sendJson(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * CORS for local development only. Deployed origins (the Slate domain) are
 * whitelisted under Authentication → Authorized Domains, where the Catalyst
 * gateway adds the headers itself — setting them here too would duplicate
 * them and the browser would reject the response.
 * Returns true when the request was a preflight that has been answered.
 */
export function handleLocalCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin ?? "";
  if (!/^http:\/\/localhost(:\d+)?$/.test(origin)) return false;
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

const MAX_BODY_BYTES = 12 * 1024 * 1024;

export async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const preParsed = (req as IncomingMessage & { body?: unknown }).body;
  if (preParsed && typeof preParsed === "object") return preParsed as T;
  if (typeof preParsed === "string") return JSON.parse(preParsed) as T;

  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, "Request body is too large");
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {} as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
}
