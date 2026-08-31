"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import { PaypalCardForm } from "../../components/billing/PaypalCardForm";
import { BoltIcon, LockIcon, ShieldOutlineIcon } from "../../components/auth/icons";
import { BILLING_PATH, LANDING_PRICING } from "../../lib/routes";

type Interval = "monthly" | "yearly";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Pay on Secrela",
    description: "Card number, name, and billing address — no PayPal account.",
    icon: LockIcon,
  },
  {
    title: "Encrypted by PayPal",
    description:
      "The card never touches our servers. PayPal processes the charge.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "This period only",
    description: "One charge for the cycle you pick. Auto-renew comes later.",
    icon: BoltIcon,
  },
];

/**
 * Checkout — on-site PayPal Card Fields (one-time capture).
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

  const onPaid = useCallback(() => {
    router.replace("/app/billing");
  }, [router]);

  if (plan === "free") {
    return (
      <AuthSplitLayout
        title="Pick a paid plan"
        description="The free trial does not use card checkout."
        benefits={BENEFITS}
        footerNote=""
      >
        <Link href={LANDING_PRICING} className="text-brand-primary">
          Back to pricing
        </Link>
      </AuthSplitLayout>
    );
  }

  if (plan === "enterprise") {
    return (
      <AuthSplitLayout
        title="Enterprise"
        description="Contact sales for a custom contract."
        benefits={BENEFITS}
        footerNote=""
      >
        <a href="mailto:sales@secrela.com" className="text-brand-primary">
          sales@secrela.com
        </a>
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
          Pay with{" "}
          <span className="text-brand-primary">card</span>
        </>
      }
      description="Enter card and billing address on this page. No PayPal login and no phone number."
      benefits={BENEFITS}
      footerNote="You stay signed in. Access returns as soon as payment succeeds."
    >
      <div className="flex w-full flex-col">
        <h2 className="text-[1.375rem] font-bold tracking-tight text-text-primary">
          Billing cycle
        </h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          One payment for the period you select.
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

        <PaypalCardForm plan={plan} interval={interval} onPaid={onPaid} />

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
