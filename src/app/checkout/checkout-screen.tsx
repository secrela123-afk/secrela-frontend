"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isPaidPlanSlug } from "../../lib/plan-catalog";
import { startLemonCheckout } from "../../lib/start-lemon-checkout";
import { toast } from "../../stores/toast-store";
import { BILLING_PATH, LANDING_PRICING } from "../../lib/routes";

type Interval = "monthly" | "yearly";

/**
 * Silent bridge: /checkout?plan=&interval= → Creem hosted form.
 * Brief loading only — no intermediate billing UI.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawPlan = searchParams.get("plan") ?? "starter";
  const plan = isPaidPlanSlug(rawPlan) ? rawPlan : null;
  const intervalParam = searchParams.get("interval");
  const interval: Interval =
    intervalParam === "yearly" || intervalParam === "monthly"
      ? intervalParam
      : "monthly";

  const [message, setMessage] = useState("Opening secure card checkout…");
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  async function openCheckout() {
    if (!plan) return;
    setFailed(false);
    setMessage("Opening secure card checkout…");
    const result = await startLemonCheckout({
      planSlug: plan,
      interval,
      onMockActivated: () => {
        toast.success("Plan activated (test mode).");
        router.replace("/app/billing");
      },
    });
    if (!result.ok) {
      setFailed(true);
      setMessage(result.message);
      toast.error(result.message);
    }
  }

  useEffect(() => {
    if (!plan) {
      router.replace(LANDING_PRICING);
      return;
    }
    if (started.current) return;
    started.current = true;
    void openCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per mount
  }, [plan, interval, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      {!failed ? (
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"
          aria-hidden
        />
      ) : null}
      <p className="max-w-md text-sm text-text-secondary">{message}</p>
      {failed ? (
        <div className="mt-2 flex flex-col items-center gap-2">
          <button
            type="button"
            className="text-sm font-semibold text-brand-primary hover:underline"
            onClick={() => {
              started.current = true;
              void openCheckout();
            }}
          >
            Try again
          </button>
          <Link
            href={BILLING_PATH}
            className="text-sm text-text-muted hover:text-brand-primary"
          >
            Back to billing
          </Link>
        </div>
      ) : null}
    </div>
  );
}
