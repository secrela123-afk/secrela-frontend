import {
  acceptInvitationRequest,
  acceptPendingInviteRequest,
  getPendingInviteForMeRequest,
} from "./api";
import { sanitizeNextPath } from "./routes";

/**
 * After login/verify: join workspace from a pending invite (if any).
 * Returns true when membership was created.
 */
export async function tryAcceptPendingInvite(): Promise<boolean> {
  try {
    const { invitation } = await getPendingInviteForMeRequest();
    if (!invitation) return false;
    await acceptPendingInviteRequest();
    return true;
  } catch {
    return false;
  }
}

/**
 * Prefer token accept when `next` points at invite link; otherwise pending-by-email.
 */
export async function tryJoinFromInviteFlow(
  next: string | null | undefined,
): Promise<"joined" | "continue" | "none"> {
  const safeNext = sanitizeNextPath(next);
  if (safeNext?.startsWith("/invite/accept")) {
    try {
      const url = new URL(safeNext, "http://localhost");
      const token = url.searchParams.get("token")?.trim();
      if (token) {
        await acceptInvitationRequest(token);
        return "joined";
      }
    } catch {
      /* fall through to pending-by-email */
    }
  }

  const joined = await tryAcceptPendingInvite();
  return joined ? "joined" : safeNext ? "continue" : "none";
}
