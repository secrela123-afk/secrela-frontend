/** Marketing home. */
export const LANDING_HOME = "/";

/** Pricing section on the landing page. */
export const LANDING_PRICING = "/#pricing";

/** Post-auth application home. */
export const APP_HOME = "/app";

/** Shown when a 14-day free trial has ended. */
export const TRIAL_ENDED_PATH = "/trial-ended";

/** Payment checkout (PayPal hosted approval). */
export const CHECKOUT_PATH = "/checkout";

/** In-app billing — PayPal subscription and auto-renew. */
export const BILLING_PATH = "/app/billing";

/** Accept an organization invite from email link. */
export function inviteAcceptPath(token: string) {
  return `/invite/accept?token=${encodeURIComponent(token)}`;
}

/**
 * Safe in-app redirect target (prevents open redirects).
 */
export function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export function authPathWithNext(
  base: "/login" | "/register" | "/verify-email",
  options?: { email?: string; next?: string | null },
) {
  const params = new URLSearchParams();
  if (options?.email) params.set("email", options.email);
  const safeNext = sanitizeNextPath(options?.next);
  if (safeNext) params.set("next", safeNext);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

/** Shown when an org admin disabled the membership. */
export const ACCOUNT_DISABLED_PATH = "/account-disabled";

/** Shown when membership was removed — need a new invite. */
export const ACCESS_REMOVED_PATH = "/access-removed";

/** First-time workspace setup after choosing a plan. */
export const ORG_ONBOARDING_PATH = "/app/onboarding/organization";

export function registerPath(plan?: string | null) {
  if (!plan) return "/register";
  return `/register?plan=${encodeURIComponent(plan)}`;
}

export function checkoutPath(
  plan: string,
  interval?: "monthly" | "yearly",
) {
  const params = new URLSearchParams({ plan });
  if (interval) params.set("interval", interval);
  return `${CHECKOUT_PATH}?${params.toString()}`;
}

/** Legacy helper — verification now goes straight to the app. */
export function verifiedLandingPricingPath() {
  return APP_HOME;
}

export function verifyEmailPendingPath(email?: string, next?: string | null) {
  return authPathWithNext("/verify-email", { email, next });
}

export function postAuthPath(
  user: {
    email?: string;
    emailVerified?: boolean;
  },
  next?: string | null,
) {
  const safeNext = sanitizeNextPath(next);
  if (user.emailVerified === false) {
    return verifyEmailPendingPath(user.email, safeNext);
  }
  if (safeNext) return safeNext;
  return APP_HOME;
}
