"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import { authPrimaryBtn } from "../../components/auth/auth-classes";
import { ArrowRightIcon, BoltIcon, LockIcon, ShieldOutlineIcon } from "../../components/auth/icons";
import { ApiError, createBillingCheckoutRequest } from "../../lib/api";
import { BILLING_PATH, LANDING_PRICING } from "../../lib/routes";
import { toast } from "../../stores/toast-store";

type Interval = "monthly" | "yearly";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Unlock your workspace",
    description: "Paid plans restore full dashboard access for your team.",
    icon: LockIcon,
  },
  {
    title: "Card saved securely",
    description:
      "Lemon Squeezy stores the card and renews monthly or yearly automatically.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Monthly or yearly",
    description: "Pick the billing cycle that fits your company.",
    icon: BoltIcon,
  },
];

/**
 * Checkout — redirects to Lemon Squeezy hosted card form.
 * When Lemon is not configured (dev), mock-activates the plan in DB.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = (searchParams.get("plan") ?? "starter") as
    | "starter"
    | "team"
    | "enterprise"
    | "free";
  const intervalParam = searchParams.get("interval");
  const [interval, setInterval] = useState<Interval>(() =>
    intervalParam === "yearly" || intervalParam === "monthly"
      ? intervalParam
      : "monthly",
  );
  const [busy, setBusy] = useState(false);

  async function onActivate() {
    if (plan === "free") {
      toast.error("Pick a paid plan from pricing.");
      return;
    }
    if (plan === "enterprise") {
      window.location.href = "mailto:sales@secrela.com";
      return;
    }

    setBusy(true);
    try {
      const result = await createBillingCheckoutRequest({
        planSlug: plan,
        interval,
      });
      if (result.mockActivated) {
        toast.error(
          "Dev mock checkout is enabled. Set LEMON_SQUEEZY_ALLOW_MOCK_ACTIVATE=false and restart the API to use Lemon Squeezy.",
        );
        return;
      }
      window.location.href = result.checkoutUrl;
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not start checkout",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthSplitLayout
      badge={
        <span className="inline-flex items-center rounded-pill border border-brand-primary/50 px-3 py-1 text-[11px] font-medium text-brand-primary capitalize">
          {plan} plan
        </span>
      }
      title={
        <>
          Activate your{" "}
          <span className="text-brand-primary">subscription</span>
        </>
      }
      description="Choose monthly or yearly billing, then pay with your card. The card is saved for automatic renewals."
      benefits={BENEFITS}
      footerNote="You stay signed in. Access returns as soon as payment succeeds."
    >
      <div className="flex w-full flex-col">
        <h2 className="text-[1.375rem] font-bold tracking-tight text-text-primary">
          Billing cycle
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Select how you want this workspace billed going forward.
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={
              interval === "monthly"
                ? "flex-1 rounded-md border border-brand-primary bg-brand-primary/10 px-3 py-2.5 text-sm font-semibold text-brand-primary"
                : "flex-1 rounded-md border border-border-default px-3 py-2.5 text-sm font-medium text-text-secondary"
            }
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={
              interval === "yearly"
                ? "flex-1 rounded-md border border-brand-primary bg-brand-primary/10 px-3 py-2.5 text-sm font-semibold text-brand-primary"
                : "flex-1 rounded-md border border-border-default px-3 py-2.5 text-sm font-medium text-text-secondary"
            }
          >
            Yearly (save ~20%)
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => void onActivate()}
          className={`${authPrimaryBtn} btn-shine mt-8 inline-flex disabled:opacity-60`}
        >
          <span>{busy ? "Opening Lemon checkout…" : "Continue to payment"}</span>
          <span className="absolute right-[1.15rem]">
            <ArrowRightIcon className="h-5 w-5" />
          </span>
        </button>

        <Link
          href={BILLING_PATH}
          className="mt-3 text-center text-small text-text-secondary hover:text-brand-primary"
        >
          Manage billing & saved cards
        </Link>

        <Link
          href={LANDING_PRICING}
          className="mt-2 text-center text-small text-text-secondary hover:text-brand-primary"
        >
          Back to pricing
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
