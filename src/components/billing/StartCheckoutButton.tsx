"use client";

import { useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PaidPlanSlug } from "../../lib/plan-catalog";
import {
  startLemonCheckout,
  type BillingInterval,
} from "../../lib/start-lemon-checkout";
import { toast } from "../../stores/toast-store";

type Props = {
  plan: PaidPlanSlug;
  interval: BillingInterval;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children">;

/**
 * Starts Creem checkout from the click — no intermediate /checkout UI.
 */
export function StartCheckoutButton({
  plan,
  interval,
  className,
  children,
  disabled,
  ...rest
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy || disabled) return;
    setBusy(true);
    const result = await startLemonCheckout({
      planSlug: plan,
      interval,
      onMockActivated: () => {
        toast.success("Plan activated (test mode).");
        router.replace("/app/billing");
      },
    });
    if (!result.ok) {
      toast.error(result.message);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || busy}
      onClick={() => void onClick()}
      {...rest}
    >
      {busy ? "Opening checkout…" : children}
    </button>
  );
}
