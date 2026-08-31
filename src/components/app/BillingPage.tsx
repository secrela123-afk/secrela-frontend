"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  getBillingOverviewRequest,
  updateAutoRenewRequest,
  type BillingOverview,
  type BillingPaymentMethod,
} from "../../lib/api";
import { checkoutPath } from "../../lib/routes";
import { toast } from "../../stores/toast-store";
import { PageHeader } from "./ui";

function formatMoney(cents: number | null | undefined, currency: string) {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)} ${currency}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function brandLabel(brand: string) {
  const b = brand.toLowerCase();
  if (b === "visa") return "Visa";
  if (b === "mastercard") return "Mastercard";
  if (b === "amex" || b === "american_express") return "Amex";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function CardRow({
  method,
  onManage,
}: {
  method: BillingPaymentMethod;
  onManage: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-background-secondary/60 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-text-primary">
          {brandLabel(method.brand)} •••• {method.last4}
          {method.isDefault ? (
            <span className="ml-2 rounded-sm bg-brand-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand-primary">
              Default
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted">
          Last used {formatDate(method.lastUsedAt)}
        </p>
      </div>
      {method.isDefault ? (
        <button
          type="button"
          onClick={onManage}
          className="shrink-0 rounded-sm border border-border-default px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:border-brand-primary/40 hover:text-brand-primary"
        >
          Change
        </button>
      ) : (
        <button
          type="button"
          onClick={onManage}
          className="shrink-0 rounded-sm border border-border-default px-2.5 py-1.5 text-[12px] font-medium text-text-secondary hover:border-brand-primary/40 hover:text-brand-primary"
          title="Open the secure payment portal to switch your renewal card"
        >
          Use / update
        </button>
      )}
    </li>
  );
}

/**
 * Billing — PayPal subscriptions, renewals, and plan status.
 * Full card numbers never touch our servers; we only store brand + last4.
 */
export function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<"starter" | "team">("starter");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { billing: data } = await getBillingOverviewRequest();
      setBilling(data);
      if (data.planSlug === "team" || data.planSlug === "starter") {
        setPlan(data.planSlug);
      }
      if (data.billingInterval) setInterval(data.billingInterval);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not load billing",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const mock = searchParams.get("mock");
    if (checkout === "success") {
      void load();
      router.replace("/app/billing");
    } else if (mock === "1") {
      toast.success("Dev mock activate — PayPal not configured yet.");
      void load();
      router.replace("/app/billing");
    }
  }, [searchParams, load, router]);

  async function onToggleAutoRenew(next: boolean) {
    if (!billing) return;
    setBusy(true);
    try {
      await updateAutoRenewRequest({ autoRenew: next });
      toast.success(next ? "Auto-renew enabled" : "Auto-renew turned off");
      await load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update auto-renew",
      );
    } finally {
      setBusy(false);
    }
  }

  function openCardPortal() {
    const url = billing?.updatePaymentUrl || billing?.customerPortalUrl;
    if (!url) {
      toast.error(
        "PayPal portal is not ready yet. Complete a checkout first, or wait for the webhook.",
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading || !billing) {
    return (
      <div className="p-6">
        <PageHeader
          title="Billing"
          description="Plans, cards, and automatic renewals."
        />
        <p className="mt-6 text-body text-text-secondary">Loading billing…</p>
      </div>
    );
  }

  const isPaid =
    billing.subscriptionStatus === "active" && Boolean(billing.billingInterval);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="Billing"
        description="Subscribe with a card or PayPal. PayPal can renew monthly or yearly automatically."
      />

      {!billing.paypalConfigured ? (
        <div className="mt-4 rounded-md border border-warning/40 bg-warning/10 px-3 py-2.5 text-[12px] text-text-secondary">
          PayPal keys are not set yet. Add{" "}
          <code className="text-text-primary">PAYPAL_CLIENT_ID</code>,{" "}
          <code className="text-text-primary">PAYPAL_CLIENT_SECRET</code>, and
          the four <code className="text-text-primary">PAYPAL_PLAN_*</code> ids
          to <code className="text-text-primary">backend/.env</code>.
        </div>
      ) : null}

      <section className="mt-6 rounded-md border border-border-subtle bg-surface-card p-4">
        <h2 className="text-[13px] font-semibold text-text-primary">
          Current plan
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] text-text-muted">Plan</dt>
            <dd className="text-[13px] font-medium text-text-primary">
              {billing.planLabel}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-muted">Status</dt>
            <dd className="text-[13px] font-medium capitalize text-text-primary">
              {(billing.subscriptionStatus ?? "—").replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-muted">Interval</dt>
            <dd className="text-[13px] font-medium capitalize text-text-primary">
              {billing.billingInterval ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-muted">Amount</dt>
            <dd className="text-[13px] font-medium text-text-primary">
              {formatMoney(
                billing.subscriptionAmountCents,
                billing.currency,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-muted">Renews / period ends</dt>
            <dd className="text-[13px] font-medium text-text-primary">
              {formatDate(billing.currentPeriodEndsAt ?? billing.trialEndsAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-text-muted">Default card</dt>
            <dd className="text-[13px] font-medium text-text-primary">
              {billing.cardBrand && billing.cardLast4
                ? `${brandLabel(billing.cardBrand)} •••• ${billing.cardLast4}`
                : "No card on file yet"}
            </dd>
          </div>
        </dl>

        {isPaid ? (
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-default accent-brand-primary"
              checked={billing.autoRenew}
              disabled={busy}
              onChange={(e) => void onToggleAutoRenew(e.target.checked)}
            />
            <span>
              <span className="block text-[13px] font-medium text-text-primary">
                Auto-renew
              </span>
              <span className="mt-0.5 block text-[12px] text-text-muted">
                When on, PayPal charges each{" "}
                {billing.billingInterval ?? "period"} automatically. Turn off to
                cancel at period end.
              </span>
            </span>
          </label>
        ) : null}
      </section>

      <section className="mt-4 rounded-md border border-border-subtle bg-surface-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-semibold text-text-primary">
              Payment cards
            </h2>
            <p className="mt-1 text-[12px] text-text-muted">
              We only store brand and last 4 digits when PayPal sends them. Card
              data stays with PayPal. To change the payment method, open PayPal.
            </p>
          </div>
          <button
            type="button"
            onClick={openCardPortal}
            className="shrink-0 rounded-sm bg-brand-primary px-3 py-1.5 text-[12px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
          >
            Manage cards
          </button>
        </div>

        {billing.paymentMethods.length === 0 ? (
          <p className="mt-4 text-[13px] text-text-secondary">
            No cards yet. Subscribe below — after payment, Visa •••• 4242 (for
            example) will appear here.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {billing.paymentMethods.map((m) => (
              <CardRow
                key={`${m.brand}-${m.last4}-${m.firstSeenAt}`}
                method={m}
                onManage={openCardPortal}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-md border border-border-subtle bg-surface-card p-4">
        <h2 className="text-[13px] font-semibold text-text-primary">
          {isPaid ? "Change plan" : "Subscribe"}
        </h2>
        <p className="mt-1 text-[12px] text-text-muted">
          Opens the on-site card form. One payment for the period you select.
        </p>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setPlan("starter")}
            className={
              plan === "starter"
                ? "flex-1 rounded-md border border-brand-primary bg-brand-primary/10 px-3 py-2 text-sm font-semibold text-brand-primary"
                : "flex-1 rounded-md border border-border-default px-3 py-2 text-sm text-text-secondary"
            }
          >
            Starter
          </button>
          <button
            type="button"
            onClick={() => setPlan("team")}
            className={
              plan === "team"
                ? "flex-1 rounded-md border border-brand-primary bg-brand-primary/10 px-3 py-2 text-sm font-semibold text-brand-primary"
                : "flex-1 rounded-md border border-border-default px-3 py-2 text-sm text-text-secondary"
            }
          >
            Team
          </button>
        </div>

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setInterval("monthly")}
            className={
              interval === "monthly"
                ? "flex-1 rounded-md border border-brand-primary bg-brand-primary/10 px-3 py-2 text-sm font-semibold text-brand-primary"
                : "flex-1 rounded-md border border-border-default px-3 py-2 text-sm text-text-secondary"
            }
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("yearly")}
            className={
              interval === "yearly"
                ? "flex-1 rounded-md border border-brand-primary bg-brand-primary/10 px-3 py-2 text-sm font-semibold text-brand-primary"
                : "flex-1 rounded-md border border-border-default px-3 py-2 text-sm text-text-secondary"
            }
          >
            Yearly
          </button>
        </div>

        <Link
          href={checkoutPath(plan, interval)}
          className="mt-4 flex h-10 w-full items-center justify-center rounded-sm bg-brand-primary text-sm font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
        >
          Continue to payment
        </Link>

        <p className="mt-2 text-center text-[11px] text-text-muted">
          Card number, name, and address on Secrela — processed by PayPal.
        </p>
      </section>
    </div>
  );
}
