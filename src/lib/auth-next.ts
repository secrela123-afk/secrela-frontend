const AUTH_NEXT_KEY = "sv_auth_next";

/** Keep invite/return path across verify-email link (email URL has no `next`). */
export function rememberAuthNext(next: string | null | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (!next) {
      sessionStorage.removeItem(AUTH_NEXT_KEY);
      return;
    }
    sessionStorage.setItem(AUTH_NEXT_KEY, next);
  } catch {
    /* ignore */
  }
}

export function takeAuthNext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = sessionStorage.getItem(AUTH_NEXT_KEY);
    sessionStorage.removeItem(AUTH_NEXT_KEY);
    return value;
  } catch {
    return null;
  }
}

export function peekAuthNext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(AUTH_NEXT_KEY);
  } catch {
    return null;
  }
}
