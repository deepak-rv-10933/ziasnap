import { MOCK_USER_ID } from "@/data/mock-user";

/**
 * Placeholder for real session/auth resolution. Phase 1 has no authentication
 * (out of scope — see project boundary), so every mock route resolves to the
 * single seeded demo user. Swapping in Catalyst Authentication later only
 * requires changing this function.
 */
export function getCurrentUserId(): string {
  return MOCK_USER_ID;
}
