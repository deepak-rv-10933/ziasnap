import type { IncomingMessage } from "http";
import catalyst from "zcatalyst-sdk-node";
import type { AccountInfo } from "@/types";
import { HttpError } from "./http";

/**
 * Resolves the signed-in app user from the request. The browser sends the
 * token from `catalyst.auth.generateAuthToken()`; the gateway validates it
 * and the user-scope SDK reads the identity it injected.
 *
 * getCurrentUser() only knows registered app users — project collaborators
 * and admins come back empty and are rejected here, which is intended: every
 * row in ZiaSnap belongs to an app user.
 */
export async function requireAccount(req: IncomingMessage): Promise<AccountInfo> {
  let user;
  try {
    const userApp = catalyst.initialize(req as unknown as Record<string, unknown>);
    user = await userApp.userManagement().getCurrentUser();
  } catch {
    throw new HttpError(401, "Sign in to continue");
  }
  if (!user?.user_id) throw new HttpError(401, "Sign in to continue");

  return {
    userId: String(user.user_id),
    email: user.email_id ?? "",
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
  };
}
