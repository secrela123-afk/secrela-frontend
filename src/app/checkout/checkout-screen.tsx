"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import { LemonCheckoutForm } from "../../components/billing/LemonCheckoutForm";
import { BoltIcon, LockIcon, ShieldOutlineIcon } from "../../components/auth/icons";
import { BILLING_PATH, LANDING_PRICING } from "../../lib/routes";
import { isPaidPlanSlug } from "../../lib/plan-catalog";

type Interval = "monthly" | "yearly";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Pay with a card",
    description:
      "Visa, Mastercard, and other cards via Lemon Squeezy. No PayPal account.",
    icon: LockIcon,
  },
  {
    title: "Card never hits our servers",
    description:
      "Lemon Squeezy collects the number and issues the receipt. We only get a paid confirmation.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Subscription billing",
    description:
      "Lemon charges monthly or yearly automatically until you cancel in billing.",
    icon: BoltIcon,
  },
];

/**
 * Checkout — Lemon Squeezy hosted card payment.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan") ?? "starter";
  const plan = isPaidPlanSlug(rawPlan) ? rawPlan : null;
  const intervalParam = searchParams.get("interval");
  const [interval, setInterval] = useState<Interval>(() =>
    intervalParam === "yearly" || intervalParam === "monthly"
      ? intervalParam
      : "monthly",
  );

  const onPaid = useCallback(() => {
    router.replace("/app/billing");
  }, [router]);

  if (!plan) {
    return (
      <AuthSplitLayout
        title="Pick a paid plan"
        description="Choose Starter, Team, or Business to continue to checkout."
        benefits={BENEFITS}
        footerNote=""
      >
        <Link href={LANDING_PRICING} className="text-brand-primary">
          Back to pricing
        </Link>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout
      formWidth="560"
      badge={
        <span className="inline-flex items-center rounded-pill border border-brand-primary/50 px-3 py-1 text-[11px] font-medium text-brand-primary capitalize">
          {plan} plan
        </span>
      }
      title={
        <>
          Complete{" "}
          <span className="text-brand-primary">payment</span>
        </>
      }
      description="Pay with a card through Lemon Squeezy. You will leave this page briefly, then return after payment."
      benefits={BENEFITS}
      footerNote="You stay signed in. Access returns as soon as payment succeeds."
    >
      <div className="flex w-full flex-col">
        <h2 className="text-[1.375rem] font-bold tracking-tight text-text-primary">
          Billing cycle
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
          One payment for the period you select. Lemon renews automatically.
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

        <LemonCheckoutForm plan={plan} interval={interval} onPaid={onPaid} />

        <Link
          href={BILLING_PATH}
          className="mt-3 text-center text-small text-text-secondary hover:text-brand-primary"
        >
          Back to billing
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
