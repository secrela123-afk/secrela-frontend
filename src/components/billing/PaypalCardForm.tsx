"use client";

import { useEffect, useRef, useState } from "react";
import { authInputPlain, authPrimaryBtn } from "../auth/auth-classes";
import {
  ApiError,
  capturePaypalCardOrderRequest,
  createPaypalCardOrderRequest,
  getPaypalCardClientTokenRequest,
  getPaypalCardConfigRequest,
} from "../../lib/api";
import { toast } from "../../stores/toast-store";

type Interval = "monthly" | "yearly";

const PRICES: Record<"starter" | "team", { monthly: number; yearly: number }> =
  {
    starter: { monthly: 28, yearly: 264 },
    team: { monthly: 36, yearly: 348 },
  };

const COUNTRIES = [
  { code: "EG", label: "Egypt" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SA", label: "Saudi Arabia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "CA", label: "Canada" },
] as const;

const FIELD_STYLE = {
  input: {
    "font-size": "15px",
    "font-family": "Inter, ui-sans-serif, system-ui, sans-serif",
    "font-weight": "400",
    color: "#f4f7fa",
    "background-color": "#050d14",
    "background": "#050d14",
    "-webkit-text-fill-color": "#f4f7fa",
    padding: "10px 0",
  },
  ":focus": {
    color: "#f4f7fa",
  },
  ".invalid": {
    color: "#ff4d4d",
  },
  ".valid": {
    color: "#19e06f",
  },
  "::placeholder": {
    color: "#667482",
  },
};

type PaypalCardFieldFactory = (opts?: {
  style?: typeof FIELD_STYLE;
  placeholder?: string;
}) => { render: (selector: string) => Promise<void> };

type PaypalCardFields = {
  isEligible: () => boolean;
  NameField: PaypalCardFieldFactory;
  NumberField: PaypalCardFieldFactory;
  ExpiryField: PaypalCardFieldFactory;
  CVVField: PaypalCardFieldFactory;
  submit: (opts?: {
    billingAddress?: {
      addressLine1: string;
      adminArea2: string;
      postalCode: string;
      countryCode: string;
    };
  }) => Promise<void>;
};

type PaypalButtons = {
  render: (selector: string) => Promise<void>;
};

type PaypalSDK = {
  CardFields?: (opts: {
    style: typeof FIELD_STYLE;
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: unknown) => void;
  }) => PaypalCardFields;
  Buttons?: (opts: {
    style?: { layout?: string; color?: string; shape?: string; label?: string };
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError: (err: unknown) => void;
  }) => PaypalButtons;
};

declare global {
  interface Window {
    paypal?: PaypalSDK;
  }
}

const hostedField =
  "h-11 w-full overflow-hidden rounded-sm border border-border-default bg-background-secondary px-3 [&>iframe]:h-11 [&>iframe]:bg-background-secondary";

function loadPaypalSdk(
  clientId: string,
  clientToken: string,
  mode: "sandbox" | "live",
): Promise<PaypalSDK> {
  if (window.paypal?.CardFields || window.paypal?.Buttons) {
    return Promise.resolve(window.paypal);
  }
  return new Promise((resolve, reject) => {
    document
      .querySelectorAll("script[src*='paypal.com/sdk/js']")
      .forEach((el) => el.remove());
    delete window.paypal;

    const params = new URLSearchParams({
      "client-id": clientId,
      components: "buttons,card-fields",
      currency: "USD",
      intent: "capture",
    });
    // Sandbox-only: US buyer so PayPal does not force the wallet/login page.
    if (mode === "sandbox") {
      params.set("buyer-country", "US");
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.setAttribute("data-client-token", clientToken);
    script.setAttribute("data-sv-paypal-card-fields", "1");
    script.async = true;
    script.onload = () => {
      if (window.paypal?.CardFields || window.paypal?.Buttons) {
        resolve(window.paypal);
      } else {
        reject(new Error("PayPal SDK loaded without checkout components"));
      }
    };
    script.onerror = () => reject(new Error("Could not load PayPal"));
    document.body.appendChild(script);
  });
}

export function PaypalCardForm({
  plan,
  interval,
  onPaid,
}: {
  plan: "starter" | "team";
  interval: Interval;
  onPaid: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"card" | "paypal" | null>(null);
  const [mode, setMode] = useState<"sandbox" | "live">("sandbox");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");
  const fieldsRef = useRef<PaypalCardFields | null>(null);
  const planRef = useRef(plan);
  const intervalRef = useRef(interval);
  const onPaidRef = useRef(onPaid);
  const paidRef = useRef(false);
  planRef.current = plan;
  intervalRef.current = interval;
  onPaidRef.current = onPaid;

  const price = PRICES[plan][interval];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [config, token] = await Promise.all([
          getPaypalCardConfigRequest(),
          getPaypalCardClientTokenRequest(),
        ]);
        if (cancelled) return;
        setLoadError(null);
        setMode(config.mode);
        const sdk = await loadPaypalSdk(
          config.clientId,
          token.clientToken,
          config.mode,
        );
        if (cancelled) return;
        const createOrder = async () => {
          const order = await createPaypalCardOrderRequest({
            planSlug: planRef.current,
            interval: intervalRef.current,
          });
          return order.orderId;
        };
        const onApprove = async (data: { orderID: string }) => {
          if (paidRef.current) return;
          paidRef.current = true;
          await capturePaypalCardOrderRequest(data.orderID);
          toast.success("Payment received. Your workspace is active.");
          onPaidRef.current();
        };
        const onError = (err: unknown) => {
          console.error("[paypal-card]", err);
          toast.error("Payment failed. Check the details and try again.");
          setBusy(false);
        };

        const fields = sdk.CardFields?.({
          style: FIELD_STYLE,
          createOrder,
          onApprove,
          onError,
        });
        if (fields?.isEligible()) {
          fieldsRef.current = fields;
          await Promise.all([
            fields
              .NameField({ style: FIELD_STYLE, placeholder: "Name on card" })
              .render("#sv-card-name"),
            fields
              .NumberField({
                style: FIELD_STYLE,
                placeholder: "Card number",
              })
              .render("#sv-card-number"),
            fields
              .ExpiryField({ style: FIELD_STYLE, placeholder: "MM / YY" })
              .render("#sv-card-expiry"),
            fields
              .CVVField({ style: FIELD_STYLE, placeholder: "CVC" })
              .render("#sv-card-cvv"),
          ]);
          if (!cancelled) {
            setMethod("card");
            setReady(true);
          }
          return;
        }

        if (!sdk.Buttons) {
          setLoadError(
            config.mode === "live"
              ? "This PayPal business account cannot take on-site cards. PayPal has not enabled Advanced Card Payments for the live app (common in Egypt). PayPal Checkout is the fallback."
              : "PayPal did not enable on-site card fields for this sandbox app. In Developer Dashboard → Sandbox app → Features, turn on Advanced Credit and Debit Card Payments, save, then refresh.",
          );
          return;
        }

        setMethod("paypal");
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        if (cancelled) return;
        await sdk.Buttons({
          style: {
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
          },
          createOrder,
          onApprove,
          onError,
        }).render("#sv-paypal-buttons");
        if (!cancelled) setReady(true);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Could not load card payment";
        toast.error(message);
        setLoadError(message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fieldsRef.current) return;
    if (!line1.trim() || !city.trim() || !postal.trim()) {
      toast.error("Enter billing address, city, and postal code.");
      return;
    }
    setBusy(true);
    try {
      await fieldsRef.current.submit({
        billingAddress: {
          addressLine1: line1.trim(),
          adminArea2: city.trim(),
          postalCode: postal.trim(),
          countryCode: country,
        },
      });
    } catch {
      toast.error("Could not submit the card. Check the fields and try again.");
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 flex flex-col" onSubmit={(e) => void onSubmit(e)}>
      {loadError ? (
        <p className="mt-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-3 text-[13px] text-text-secondary">
          {loadError}
        </p>
      ) : null}
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
      {mode === "sandbox" && method === "card" ? (
        <p className="mt-2 text-[11px] text-text-muted">
          Sandbox — use a PayPal test card, e.g. 4012 8888 8888 1881 · any
          future expiry · CVC 123.
        </p>
      ) : null}

      <div className={method === "paypal" ? "mt-6" : "hidden"}>
        <p className="mb-3 text-[13px] text-text-secondary">
          On-site card fields are not available on this PayPal account. Pay
          with PayPal (PayPal account or PayPal&apos;s card page).
        </p>
        <div id="sv-paypal-buttons" />
      </div>

      <div className={method === "paypal" ? "hidden" : ""}>
      <label className="mt-5 text-label text-text-muted">Cardholder name</label>
      <div id="sv-card-name" className={`${hostedField} mt-1.5`} />

      <label className="mt-3 text-label text-text-muted">Card number</label>
      <div id="sv-card-number" className={`${hostedField} mt-1.5`} />

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-label text-text-muted">Expiry</label>
          <div id="sv-card-expiry" className={`${hostedField} mt-1.5`} />
        </div>
        <div>
          <label className="text-label text-text-muted">CVC</label>
          <div id="sv-card-cvv" className={`${hostedField} mt-1.5`} />
        </div>
      </div>

      <p className="mt-5 text-[11px] font-medium tracking-wide text-text-muted uppercase">
        Billing address
      </p>
      <label className="mt-2 text-label text-text-muted">Street</label>
      <input
        className={`${authInputPlain} mt-1.5`}
        value={line1}
        onChange={(e) => setLine1(e.target.value)}
        autoComplete="billing address-line1"
        placeholder="Street address"
      />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-label text-text-muted">City</label>
          <input
            className={`${authInputPlain} mt-1.5`}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="billing address-level2"
            placeholder="City"
          />
        </div>
        <div>
          <label className="text-label text-text-muted">Postal code</label>
          <input
            className={`${authInputPlain} mt-1.5`}
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            autoComplete="billing postal-code"
            placeholder="Code"
          />
        </div>
      </div>
      <label className="mt-3 text-label text-text-muted">Country</label>
      <select
        className={`${authInputPlain} mt-1.5`}
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        autoComplete="billing country"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={busy || !ready}
        className={`${authPrimaryBtn} mt-6 disabled:opacity-60`}
      >
        {busy ? "Processing…" : `Pay $${price.toFixed(2)}`}
      </button>
      <p className="mt-2 text-center text-[11px] text-text-muted">
        Card details are encrypted by PayPal. We never see the full number.
        One-time charge for this period — auto-renew comes later.
      </p>
      </div>
    </form>
  );
}
