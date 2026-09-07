"use client";

import { useState } from "react";
import { authPrimaryBtn } from "../auth/auth-classes";
import {
  ApiError,
  createBillingCheckoutRequest,
} from "../../lib/api";
import { toast } from "../../stores/toast-store";
import {
  PAID_PLAN_PRICES,
  type PaidPlanSlug,
} from "../../lib/plan-catalog";

type Interval = "monthly" | "yearly";

/**
 * Lemon Squeezy hosted checkout — customer pays on Lemon, then returns here.
 */
export function LemonCheckoutForm({
  plan,
  interval,
  onPaid,
}: {
  plan: PaidPlanSlug;
  interval: Interval;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const price = PAID_PLAN_PRICES[plan][interval];

  async function onPay() {
    setBusy(true);
    try {
      const result = await createBillingCheckoutRequest({
        planSlug: plan,
        interval,
      });
      if (result.mockActivated) {
        toast.success("Plan activated (dev mock).");
        onPaid();
        return;
      }
      if (!result.checkoutUrl) {
        throw new Error("Lemon Squeezy did not return a checkout URL");
      }
      window.location.assign(result.checkoutUrl);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not start card checkout",
      );
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 flex flex-col">
      <div className="flex items-end justify-between gap-3 rounded-md border border-border-subtle bg-surface-elevated/70 px-3.5 py-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-text-muted uppercase">
            Due now
          </p>
          <p className="mt-0.5 text-[13px] text-text-secondary capitalize">
            {plan} · {interval}
          </p>
        </div>
        <p className="text-[1.35rem] font-bold tracking-tight text-text-primary">
          ${price.toFixed(2)}
          <span className="ml-1 text-[12px] font-medium text-text-muted">
            USD
          </span>
        </p>
      </div>
      <p className="mt-3 text-[13px] text-text-secondary">
        You will continue to Lemon Squeezy to enter your card. We never see the
        full card number. After payment you return to billing.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void onPay()}
        className={`${authPrimaryBtn} mt-6 disabled:opacity-60`}
      >
        {busy ? "Opening checkout…" : `Pay $${price.toFixed(2)} with card`}
      </button>
    </div>
  );
}
