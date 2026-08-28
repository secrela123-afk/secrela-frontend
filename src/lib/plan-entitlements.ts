import type { Organization } from "./api";
import { checkoutPath, LANDING_PRICING } from "./routes";

export type PlanEntitlements = {
  maxMembers: number | null;
  maxVaults: number | null;
  maxSecrets: number | null;
  auditLogAccess: boolean;
  auditRetentionDays: number | null;
  customRoles: boolean;
  securityCenter: boolean;
  integrations: boolean;
};

export type OrganizationUsage = {
  members: number;
  pendingInvites: number;
  seatsUsed: number;
  vaults: number;
  secrets: number;
  customRoles: number;
};

export type PlanCapabilities = {
  inviteMember: boolean;
  createVault: boolean;
  createSecret: boolean;
  createCustomRole: boolean;
  viewAuditLogs: boolean;
  viewSecurityCenter: boolean;
  viewIntegrations: boolean;
};

export type PlanEntitlementSnapshot = {
  planSlug: Organization["planSlug"];
  planLabel: string;
  entitlements: PlanEntitlements;
  usage: OrganizationUsage;
  capabilities: PlanCapabilities;
  upgradePlanSlug: Organization["planSlug"] | "enterprise" | null;
  upgradePlanLabel: string | null;
};

export function formatPlanLimit(value: number | null): string {
  return value === null ? "Unlimited" : String(value);
}

export function upgradeHref(
  upgradePlanSlug: PlanEntitlementSnapshot["upgradePlanSlug"],
): string {
  if (!upgradePlanSlug || upgradePlanSlug === "enterprise") {
    return LANDING_PRICING;
  }
  return checkoutPath(upgradePlanSlug);
}

export function isPlanLimitError(code: string | undefined): boolean {
  return code === "PLAN_LIMIT_REACHED" || code === "PLAN_FEATURE_UNAVAILABLE";
}

export function planLimitMessage(snapshot: PlanEntitlementSnapshot): string {
  if (snapshot.upgradePlanLabel) {
    return `Upgrade to ${snapshot.upgradePlanLabel} to unlock more.`;
  }
  return "View plans to upgrade your workspace.";
}

/** User-facing toast copy when the API returns a plan limit/feature error. */
export function planLimitErrorToast(
  err: unknown,
  fallbackTitle = "Plan limit",
): { title: string; message: string } | null {
  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    isPlanLimitError(String((err as { code: string }).code))
  ) {
    const apiErr = err as { message: string; code: string };
    return {
      title:
        apiErr.code === "PLAN_FEATURE_UNAVAILABLE"
          ? "Feature not on your plan"
          : fallbackTitle,
      message: apiErr.message,
    };
  }
  return null;
}

export function formatPlanUsage(
  used: number,
  limit: number | null,
): string {
  return `${used} / ${formatPlanLimit(limit)}`;
}

type PlanFeatureKey = "auditLogs" | "securityCenter" | "integrations";

/** Mirror backend — smallest tier that unlocks the feature. */
export function recommendedUpgradeForFeature(
  planSlug: PlanEntitlementSnapshot["planSlug"],
  feature: PlanFeatureKey,
): PlanEntitlementSnapshot["upgradePlanSlug"] {
  if (feature === "securityCenter" || feature === "integrations") {
    if (planSlug === "free" || planSlug === "starter") return "team";
    return null;
  }
  return snapshotGenericUpgrade(planSlug);
}

function snapshotGenericUpgrade(
  planSlug: PlanEntitlementSnapshot["planSlug"],
): PlanEntitlementSnapshot["upgradePlanSlug"] {
  if (planSlug === "free") return "starter";
  if (planSlug === "starter") return "team";
  if (planSlug === "team") return "enterprise";
  return null;
}

export function featureUpgradeLabel(
  snapshot: PlanEntitlementSnapshot,
  feature: PlanFeatureKey,
): string | null {
  const slug = recommendedUpgradeForFeature(snapshot.planSlug, feature);
  if (!slug) return null;
  if (slug === "enterprise") return "Enterprise";
  if (slug === "starter") return "Starter";
  if (slug === "team") return "Team";
  return null;
}

export function featureUpgradeHref(
  snapshot: PlanEntitlementSnapshot,
  feature: PlanFeatureKey,
): string {
  const slug = recommendedUpgradeForFeature(snapshot.planSlug, feature);
  return upgradeHref(slug);
}
