"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isPaidPlanSlug } from "../../lib/plan-catalog";
import { startLemonCheckout } from "../../lib/start-lemon-checkout";
import { toast } from "../../stores/toast-store";
import { LANDING_PRICING } from "../../lib/routes";

type Interval = "monthly" | "yearly";

/**
 * Silent bridge: /checkout?plan=&interval= → Lemon hosted form.
 * No intermediate billing UI — only a brief loading state if needed.
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
  const started = useRef(false);

  useEffect(() => {
    if (!plan) {
      router.replace(LANDING_PRICING);
      return;
    }
    if (started.current) return;
    started.current = true;

    void (async () => {
      const result = await startLemonCheckout({
        planSlug: plan,
        interval,
        onMockActivated: () => {
          toast.success("Plan activated (test mode).");
          router.replace("/app/billing");
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        toast.error(result.message);
      }
    })();
  }, [plan, interval, router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary border-t-transparent"
        aria-hidden
      />
      <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      {message !== "Opening secure card checkout…" ? (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-brand-primary hover:underline"
          onClick={() => {
            started.current = false;
            setMessage("Opening secure card checkout…");
            started.current = true;
            if (!plan) return;
            void startLemonCheckout({
              planSlug: plan,
              interval,
              onMockActivated: () => {
                toast.success("Plan activated (test mode).");
                router.replace("/app/billing");
              },
            }).then((result) => {
              if (!result.ok) {
                setMessage(result.message);
                toast.error(result.message);
              }
            });
          }}
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
