export const PAID_PLAN_SLUGS = ["starter", "team", "business"] as const;
export type PaidPlanSlug = (typeof PAID_PLAN_SLUGS)[number];

/**
 * Display / checkout amounts in USD.
 * yearly = one charge for 12 months (20% off).
 * yearlyPerMonth = what the landing card shows next to /month on yearly.
 */
export const PAID_PLAN_PRICES: Record<
  PaidPlanSlug,
  { monthly: number; yearly: number; yearlyPerMonth: number }
> = {
  starter: { monthly: 20, yearly: 192, yearlyPerMonth: 16 },
  team: { monthly: 60, yearly: 576, yearlyPerMonth: 48 },
  business: { monthly: 99, yearly: 948, yearlyPerMonth: 79 },
};

export const PAID_PLAN_LABELS: Record<PaidPlanSlug, string> = {
  starter: "Starter",
  team: "Team",
  business: "Business",
};

/** In-app billing copy — matches backend entitlements / landing limits. */
export const PAID_PLAN_TAGLINES: Record<PaidPlanSlug, string> = {
  starter: "A paid workspace for a small team.",
  team: "Security Center, integrations, and full audit history.",
  business: "More seats when the company is scaling access.",
};

export const PAID_PLAN_FEATURES: Record<PaidPlanSlug, string[]> = {
  starter: [
    "Up to 5 members",
    "Unlimited vaults and secrets",
    "Custom roles and RBAC",
    "Audit logs (7-day retention)",
    "Email support",
  ],
  team: [
    "Up to 10 members",
    "Unlimited vaults and secrets",
    "Custom roles and RBAC",
    "Full audit history",
    "Security Center",
    "Integrations",
  ],
  business: [
    "Up to 25 members",
    "Unlimited vaults and secrets",
    "Custom roles and RBAC",
    "Full audit history",
    "Security Center",
    "Integrations",
    "Priority onboarding support",
  ],
};

export function isPaidPlanSlug(value: string): value is PaidPlanSlug {
  return (PAID_PLAN_SLUGS as readonly string[]).includes(value);
}
