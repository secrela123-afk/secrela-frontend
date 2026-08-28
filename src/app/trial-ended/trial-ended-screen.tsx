"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getTrialSummaryRequest,
  type TrialSummaryResponse,
} from "../../lib/api";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import { authPrimaryBtn } from "../../components/auth/auth-classes";
import { ArrowRightIcon, BoltIcon, LockIcon, ShieldOutlineIcon, UsersIcon } from "../../components/auth/icons";
import { LANDING_PRICING, checkoutPath } from "../../lib/routes";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Data stays safe",
    description: "Vaults and secrets remain encrypted while you choose a plan.",
    icon: LockIcon,
  },
  {
    title: "Team preserved",
    description: "Members stay on the account — access returns after subscribe.",
    icon: UsersIcon,
  },
  {
    title: "Instant unlock",
    description: "Dashboard access restores the moment a plan is activated.",
    icon: BoltIcon,
  },
];

/**
 * Subscription / trial ended — session stays; dashboard stays locked until renew.
 */
export function TrialEndedScreen() {
  const { logout } = useWorkspaceActions();
  const [summary, setSummary] = useState<TrialSummaryResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    getTrialSummaryRequest()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canManage =
    summary?.role.systemKey === "owner" || summary?.role.systemKey === "admin";

  return (
    <AuthSplitLayout
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-primary/50 px-3 py-1 text-[11px] font-medium text-brand-primary">
          <ShieldOutlineIcon className="h-3 w-3" />
          Trial ended
        </span>
      }
      title={
        <>
          Your free trial{" "}
          <span className="text-brand-primary">has ended</span>
        </>
      }
      description="You're still signed in. The workspace dashboard stays locked until an owner or admin activates a paid plan."
      benefits={BENEFITS}
      footerNote="Secure sign in · No data loss · Subscribe to restore access"
    >
      <div className="flex w-full flex-col">
        <h2 className="text-[1.375rem] font-bold tracking-tight text-text-primary">
          What happens next
        </h2>
        <ul className="mt-4 space-y-2 text-[13px] text-text-secondary">
          <li className="flex gap-2">
            <span className="text-brand-primary">✓</span>
            Vaults and secrets stay safely stored
          </li>
          <li className="flex gap-2">
            <span className="text-brand-primary">✓</span>
            Team members remain on the account
          </li>
          <li className="flex gap-2">
            <span className="text-brand-primary">✓</span>
            Access returns the moment you subscribe
          </li>
        </ul>

        {canManage || !summary ? (
          <Link href={checkoutPath("starter")} className={`${authPrimaryBtn} mt-8`}>
            <span>Subscribe with card</span>
            <span className="absolute right-[1.15rem]">
              <ArrowRightIcon className="h-5 w-5" />
            </span>
          </Link>
        ) : (
          <p className="mt-8 rounded-md border border-border-subtle bg-surface-elevated/80 px-4 py-3 text-center text-[13px] text-text-secondary">
            Ask your workspace owner or admin to subscribe so the team can reopen
            the dashboard.
          </p>
        )}

        {canManage ? (
          <Link
            href={LANDING_PRICING}
            className="mt-3 text-center text-small text-text-secondary hover:text-brand-primary"
          >
            Compare plans
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-4 text-center text-small text-text-muted hover:text-brand-primary"
        >
          Sign out
        </button>
      </div>
    </AuthSplitLayout>
  );
}
