"use client";

import Link from "next/link";
import { useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import { LANDING_PRICING } from "../../lib/routes";
import {
  FREE_TRIAL_DAYS,
  formatTrialEndDate,
  trialDaysRemaining,
} from "../../lib/subscription";

export function TrialBanner() {
  const { organization, role } = useRequiredWorkspace();
  const isOwnerOrAdmin =
    role.systemKey === "owner" || role.systemKey === "admin";

  if (!isOwnerOrAdmin) return null;

  if (
    organization.subscriptionStatus !== "trialing" ||
    organization.planSlug !== "free"
  ) {
    return null;
  }

  const daysLeft = trialDaysRemaining(organization.trialEndsAt);
  const endsOn = formatTrialEndDate(organization.trialEndsAt);

  return (
    <div
      className="border-b border-brand-primary/25 bg-brand-primary/10 px-4 py-2.5 lg:px-6"
      role="status"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-text-primary">
          <span className="font-semibold text-brand-primary">Free trial</span>
          {" — "}
          {daysLeft > 0 ? (
            <>
              {daysLeft} day{daysLeft === 1 ? "" : "s"} left (ends {endsOn}).
              Your workspace started with a {FREE_TRIAL_DAYS}-day trial.
            </>
          ) : (
            <>Your trial ends today ({endsOn}). Subscribe to keep access.</>
          )}
        </p>
        <Link
          href={LANDING_PRICING}
          className="text-[12px] font-semibold text-brand-primary hover:text-brand-primary-hover"
        >
          View paid plans
        </Link>
      </div>
    </div>
  );
}
