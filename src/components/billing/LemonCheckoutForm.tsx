"use client";

import { useEffect, useRef, useState } from "react";
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
 * Starts Creem hosted checkout immediately (Lemon / Paddle / PayPal paused).
 * Test-mode Creem keys charge test cards only.
 */
export function LemonCheckoutForm({
  plan,
  interval,
  onPaid,
  autoStart = true,
}: {
  plan: PaidPlanSlug;
  interval: Interval;
  onPaid: () => void;
  /** When true (default), open Creem as soon as the page loads. */
  autoStart?: boolean;
}) {
  const [busy, setBusy] = useState(autoStart);
  const [error, setError] = useState<string | null>(null);
  const startedKey = useRef<string | null>(null);
  const price = PAID_PLAN_PRICES[plan][interval];

  async function startCheckout() {
    setBusy(true);
    setError(null);
    try {
      const result = await createBillingCheckoutRequest({
        planSlug: plan,
        interval,
      });
      if (result.mockActivated) {
        toast.success("Plan activated (test mode).");
        onPaid();
        return;
      }
      if (!result.checkoutUrl) {
        throw new Error("Creem did not return a checkout URL");
      }
      window.location.assign(result.checkoutUrl);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not start card checkout";
      setError(message);
      toast.error(message);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!autoStart) return;
    const key = `${plan}:${interval}`;
    if (startedKey.current === key) return;
    startedKey.current = key;
    void startCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start once per plan/interval
  }, [autoStart, plan, interval]);

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

      {busy && !error ? (
        <p className="mt-5 text-center text-[13px] text-text-secondary">
          Opening secure card checkout…
        </p>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-[13px] text-amber-200">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void startCheckout()}
        className={`${authPrimaryBtn} mt-6 disabled:opacity-60`}
      >
        {busy
          ? "Opening checkout…"
          : error
            ? "Try again"
            : `Pay $${price.toFixed(2)} with card`}
      </button>

      <p className="mt-3 text-center text-[12px] text-text-muted">
        Card details are collected by Creem. We never see the full card
        number.
      </p>
    </div>
  );
}
