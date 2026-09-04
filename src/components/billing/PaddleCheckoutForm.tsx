"use client";

import { useEffect, useRef, useState } from "react";
import { authPrimaryBtn } from "../auth/auth-classes";
import {
  ApiError,
  confirmPaddleCheckoutRequest,
  createPaddleCheckoutRequest,
  getPaddleCheckoutConfigRequest,
} from "../../lib/api";
import { toast } from "../../stores/toast-store";
import {
  PAID_PLAN_PRICES,
  type PaidPlanSlug,
} from "../../lib/plan-catalog";

type Interval = "monthly" | "yearly";

type PaddleJs = {
  Environment: { set: (env: "sandbox" | "production") => void };
  Initialize: (opts: {
    token: string;
    eventCallback?: (event: { name?: string; data?: { id?: string } }) => void;
  }) => void;
  Checkout: {
    open: (opts: {
      transactionId: string;
      settings?: { displayMode?: string; theme?: string };
    }) => void;
  };
};

declare global {
  interface Window {
    Paddle?: PaddleJs;
  }
}

function loadPaddleJs(): Promise<PaddleJs> {
  if (window.Paddle?.Checkout) return Promise.resolve(window.Paddle);
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(
      "script[src='https://cdn.paddle.com/paddle/v2/paddle.js']",
    );
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.Paddle) resolve(window.Paddle);
        else reject(new Error("Paddle.js loaded without SDK"));
      });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.async = true;
    script.onload = () => {
      if (window.Paddle) resolve(window.Paddle);
      else reject(new Error("Paddle.js loaded without SDK"));
    };
    script.onerror = () => reject(new Error("Could not load Paddle"));
    document.body.appendChild(script);
  });
}

export function PaddleCheckoutForm({
  plan,
  interval,
  onPaid,
}: {
  plan: PaidPlanSlug;
  interval: Interval;
  onPaid: () => void;
}) {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const paddleRef = useRef<PaddleJs | null>(null);
  const initRef = useRef(false);
  const paidRef = useRef(false);
  const txnRef = useRef<string | null>(null);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;
  const price = PAID_PLAN_PRICES[plan][interval];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const config = await getPaddleCheckoutConfigRequest();
        if (cancelled) return;
        setLoadError(null);
        setConfigured(config.configured);
        if (!config.configured) return;
        const paddle = await loadPaddleJs();
        if (cancelled) return;
        paddle.Environment.set(config.environment);
        if (!initRef.current) {
          paddle.Initialize({
            token: config.clientToken,
            eventCallback: (event) => {
              const txnId = txnRef.current;
              if (
                event.name === "checkout.completed" &&
                !paidRef.current &&
                txnId
              ) {
                paidRef.current = true;
                void confirmPaddleCheckoutRequest(txnId)
                  .then(() => {
                    toast.success("Payment received. Your workspace is active.");
                    onPaidRef.current();
                  })
                  .catch((err) => {
                    paidRef.current = false;
                    toast.error(
                      err instanceof ApiError
                        ? err.message
                        : "Payment succeeded at Paddle but we could not activate yet. Refresh billing.",
                    );
                  });
              }
            },
          });
          initRef.current = true;
        }
        paddleRef.current = paddle;
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : "Could not load card checkout";
        setLoadError(message);
        setConfigured(false);
        toast.error(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onPay() {
    if (!paddleRef.current) return;
    setBusy(true);
    try {
      const { transactionId } = await createPaddleCheckoutRequest({
        planSlug: plan,
        interval,
      });
      txnRef.current = transactionId;
      paddleRef.current.Checkout.open({
        transactionId,
        settings: { displayMode: "overlay", theme: "dark" },
      });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not start card checkout",
      );
    } finally {
      setBusy(false);
    }
  }

  if (configured === false) {
    return (
      <p className="mt-6 rounded-md border border-warning/30 bg-warning/10 px-3 py-3 text-[13px] text-text-secondary">
        {loadError
          ? loadError
          : "Card checkout via Paddle is not configured yet. Use PayPal, or add PADDLE_* keys on the API and refresh."}
      </p>
    );
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
        Card details are collected by Paddle (Merchant of Record). No PayPal
        account. The overlay stays on this page.
      </p>
      <button
        type="button"
        disabled={busy || configured !== true}
        onClick={() => void onPay()}
        className={`${authPrimaryBtn} mt-6 disabled:opacity-60`}
      >
        {busy ? "Opening checkout…" : `Pay $${price.toFixed(2)} with card`}
      </button>
    </div>
  );
}
