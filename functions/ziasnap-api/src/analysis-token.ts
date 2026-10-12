import { createHmac, timingSafeEqual } from "crypto";

/**
 * Zia execution ids are sequential, so the id alone would let anyone poll
 * someone else's analysis. The token handed to the browser binds the id to
 * its owner ("guest" or a user id) with an HMAC: `<executionId>.<sig>`.
 */
function signature(executionId: string, owner: string): string {
  const secret = process.env.ANALYSIS_TOKEN_SECRET;
  if (!secret) throw new Error("ANALYSIS_TOKEN_SECRET is not configured");
  return createHmac("sha256", secret).update(`${executionId}:${owner}`).digest("hex").slice(0, 32);
}

export function issueAnalysisToken(executionId: string, owner: string): string {
  return `${executionId}.${signature(executionId, owner)}`;
}

/** Returns the execution id when the token is valid for this owner, else undefined. */
export function readAnalysisToken(token: string, owner: string): string | undefined {
  const match = /^(\d{1,30})\.([0-9a-f]{32})$/.exec(token);
  if (!match) return undefined;
  const expected = Buffer.from(signature(match[1], owner));
  const given = Buffer.from(match[2]);
  return expected.length === given.length && timingSafeEqual(expected, given) ? match[1] : undefined;
}
