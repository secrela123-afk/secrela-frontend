"use client";

import Link from "next/link";
import {
  featureUpgradeLabel,
  recommendedUpgradeForFeature,
  upgradeHref,
  type PlanEntitlementSnapshot,
} from "../../lib/plan-entitlements";
import { LANDING_PRICING } from "../../lib/routes";

type PlanUpgradePromptProps = {
  title: string;
  description: string;
  snapshot?: PlanEntitlementSnapshot | null;
  compact?: boolean;
  className?: string;
};

/**
 * Inline upgrade CTA when a plan limit or feature blocks an action.
 */
export function PlanUpgradePrompt({
  title,
  description,
  snapshot,
  compact = false,
  className = "",
}: PlanUpgradePromptProps) {
  const href = snapshot?.upgradePlanSlug
    ? upgradeHref(snapshot.upgradePlanSlug)
    : LANDING_PRICING;
  const cta = snapshot?.upgradePlanLabel
    ? `Upgrade to ${snapshot.upgradePlanLabel}`
    : "View plans";

  return (
    <div
      className={`rounded-md border border-brand-primary/25 bg-brand-primary/5 px-4 py-3 ${className}`}
    >
      <p className="text-[13px] font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-[12px] leading-snug text-text-secondary">
        {description}
      </p>
      {!compact ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href={href}
            className="inline-flex rounded-sm bg-brand-primary px-4 py-2 text-[12px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
          >
            {cta}
          </Link>
          <Link
            href={LANDING_PRICING}
            className="text-[12px] font-medium text-brand-primary hover:text-brand-primary-hover"
          >
            Compare plans
          </Link>
        </div>
      ) : null}
    </div>
  );
}

type PlanFeatureGateProps = {
  allowed: boolean;
  snapshot?: PlanEntitlementSnapshot | null;
  featureLabel: string;
  /** When set, uses feature-specific upgrade tier (e.g. Security Center → Team). */
  featureKey?: "auditLogs" | "securityCenter" | "integrations";
  children?: React.ReactNode;
};

/** Wraps a page section — shows upgrade prompt instead of children when blocked. */
export function PlanFeatureGate({
  allowed,
  snapshot,
  featureLabel,
  featureKey,
  children,
}: PlanFeatureGateProps) {
  if (allowed) return <>{children}</>;

  const upgradeLabel =
    snapshot && featureKey
      ? featureUpgradeLabel(snapshot, featureKey)
      : snapshot?.upgradePlanLabel ?? null;
  const upgradeSlug =
    snapshot && featureKey
      ? recommendedUpgradeForFeature(snapshot.planSlug, featureKey)
      : snapshot?.upgradePlanSlug ?? null;

  return (
    <div className="p-4 lg:p-6">
      <PlanUpgradePrompt
        title={`${featureLabel} is not on your plan`}
        description={
          snapshot
            ? `Your ${snapshot.planLabel} workspace does not include ${featureLabel.toLowerCase()}. ${
                upgradeLabel
                  ? `Upgrade to ${upgradeLabel} to unlock it.`
                  : "Contact sales for Enterprise access."
              }`
            : `Upgrade your plan to unlock ${featureLabel.toLowerCase()}.`
        }
        snapshot={
          snapshot
            ? {
                ...snapshot,
                upgradePlanSlug: upgradeSlug,
                upgradePlanLabel: upgradeLabel,
              }
            : undefined
        }
      />
    </div>
  );
}
