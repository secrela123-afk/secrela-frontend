"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ApiError,
  getBillingOverviewRequest,
  updateAutoRenewRequest,
  type BillingOverview,
  type BillingPaymentMethod,
  type Organization,
} from "../../lib/api";
import { checkoutPath } from "../../lib/routes";
import { toast } from "../../stores/toast-store";
import { queryKeys } from "../../lib/query-keys";
import { useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../hooks/queries/usePlanEntitlementsQuery";
import {
  formatPlanLimit,
  type PlanEntitlementSnapshot,
} from "../../lib/plan-entitlements";
import {
  PAID_PLAN_FEATURES,
  PAID_PLAN_LABELS,
  PAID_PLAN_PRICES,
  PAID_PLAN_SLUGS,
  isPaidPlanSlug,
  type PaidPlanSlug,
} from "../../lib/plan-catalog";
import { trialDaysRemaining } from "../../lib/subscription";
import {
  SettingsCard,
  SettingsPage,
  settingsPrimaryBtn,
  settingsSecondaryBtn,
} from "./ui";
import { ConfirmDialog } from "./RowActionsMenu";
import { IconMembers, IconSecret, IconVault } from "./icons";

type Interval = "monthly" | "yearly";

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

function statusLabel(status: Organization["subscriptionStatus"]) {
  if (status === "trialing") return "Free trial";
  if (status === "active") return "Active";
  if (status === "pending_payment") return "Payment pending";
  if (status === "expired") return "Expired";
  return "Unknown";
}

function isPaidActive(billing: BillingOverview) {
  return billing.subscriptionStatus === "active" && Boolean(billing.billingInterval);
}

function recommendedPaidSlug(planSlug: Organization["planSlug"]): PaidPlanSlug | null {
  if (planSlug === "free" || !planSlug) return "starter";
  if (planSlug === "starter") return "team";
  if (planSlug === "team") return "business";
  return null;
}

function statusClass(status: Organization["subscriptionStatus"]) {
  if (status === "active") return "font-semibold text-brand-primary";
  if (status === "expired") return "font-semibold text-danger";
  return "font-semibold text-warning";
}

/**
 * Billing — same settings layout as Account security:
 * page title, then stacked cards with copy on the left and the action on the right.
 */
export function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { organization } = useRequiredWorkspace();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pendingRenewOff, setPendingRenewOff] = useState(false);
  const [interval, setInterval] = useState<Interval>("monthly");

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const { billing: data } = await getBillingOverviewRequest();
      setBilling(data);
      if (data.billingInterval) setInterval(data.billingInterval);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not load billing";
      setError(message);
      toast.error(message);
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
      toast.success("Payment received", "Your workspace plan is updating.");
      void load({ silent: true });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
      void queryClient.invalidateQueries({ queryKey: queryKeys.entitlements });
      router.replace("/app/billing");
    } else if (mock === "1") {
      toast.success("Dev mock activate", "No live processor was charged.");
      void load();
      router.replace("/app/billing");
    }
  }, [searchParams, load, router, queryClient]);

  async function applyAutoRenew(next: boolean) {
    if (!billing) return;
    setBusy(true);
    try {
      await updateAutoRenewRequest({ autoRenew: next });
      toast.success(next ? "Auto-renew enabled" : "Auto-renew turned off");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
        load({ silent: true }),
      ]);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update auto-renew",
      );
    } finally {
      setBusy(false);
      setPendingRenewOff(false);
    }
  }

  function onToggleAutoRenew() {
    if (!billing || busy) return;
    if (billing.autoRenew) {
      setPendingRenewOff(true);
      return;
    }
    void applyAutoRenew(true);
  }

  function openCardPortal() {
    const url = billing?.updatePaymentUrl || billing?.customerPortalUrl;
    if (!url) {
      toast.error(
        "Payment portal is not ready yet",
        "Complete a checkout first, then manage the card from here.",
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const pageTitle = "Billing";
  const pageDescription = `Subscription and payment for ${organization.name}. Owner and admin only.`;

  if (loading && !billing) {
    return (
      <SettingsPage title={pageTitle} description={pageDescription}>
        <div
          className="h-40 animate-pulse rounded-lg border border-border-subtle bg-surface-card"
          aria-busy="true"
          aria-label="Loading billing"
        />
        <div className="h-32 animate-pulse rounded-lg border border-border-subtle bg-surface-card" />
      </SettingsPage>
    );
  }

  if (error && !billing) {
    return (
      <SettingsPage title={pageTitle} description={pageDescription}>
        <SettingsCard title="Current plan">
          <p className="mt-4 text-small text-danger" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => void load()}
            className={`${settingsPrimaryBtn} mt-4`}
          >
            Try again
          </button>
        </SettingsCard>
      </SettingsPage>
    );
  }

  if (!billing) return null;

  const paid = isPaidActive(billing);
  const recommended = recommendedPaidSlug(billing.planSlug);
  const daysLeft = trialDaysRemaining(billing.trialEndsAt);
  const periodIso = billing.currentPeriodEndsAt ?? billing.trialEndsAt;
  const processorReady = billing.paddleConfigured || billing.paypalConfigured;
  const portalReady = Boolean(billing.updatePaymentUrl || billing.customerPortalUrl);
  const snapshot = entitlementsQuery.data;
  const subscribeSlug = recommended ?? "starter";
  const subscribeHref = checkoutPath(subscribeSlug, interval);

  const periodLabel =
    billing.subscriptionStatus === "trialing" ? "Trial ends" : "Period ends";

  let currentPlanAction: ReactNode = null;
  if (billing.subscriptionStatus === "trialing") {
    currentPlanAction = (
      <Link href={subscribeHref} className={settingsPrimaryBtn}>
        Subscribe
      </Link>
    );
  } else if (billing.subscriptionStatus === "pending_payment") {
    currentPlanAction = (
      <Link href={subscribeHref} className={settingsPrimaryBtn}>
        Resume checkout
      </Link>
    );
  } else if (billing.subscriptionStatus === "expired") {
    currentPlanAction = (
      <Link href={subscribeHref} className={settingsPrimaryBtn}>
        Renew access
      </Link>
    );
  }

  return (
    <>
      <SettingsPage title={pageTitle} description={pageDescription}>
        <SettingsCard
          title="Current plan"
          description={
            paid
              ? `${billing.planLabel} · billed ${billing.billingInterval ?? "per period"}.`
              : "Your workspace is on the free trial. Subscribe to keep vaults, secrets, and access control after it ends."
          }
          status={
            <p>
              Status:{" "}
              <span className={statusClass(billing.subscriptionStatus)}>
                {statusLabel(billing.subscriptionStatus)}
              </span>
              <span className="text-text-muted">
                {" · "}
                {periodLabel} {formatDate(periodIso)}
                {billing.subscriptionStatus === "trialing" && daysLeft > 0
                  ? ` · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
                  : ""}
                {paid
                  ? ` · ${formatMoney(billing.subscriptionAmountCents, billing.currency)}`
                  : ""}
              </span>
            </p>
          }
          action={currentPlanAction}
        />

        <SettingsCard
          title="Payment method"
          description="Brand and last four digits only. Card numbers stay with Paddle or PayPal."
          status={
            <PaymentStatus
              billing={billing}
              methods={billing.paymentMethods}
            />
          }
          action={
            <button
              type="button"
              onClick={openCardPortal}
              disabled={!portalReady && billing.paymentMethods.length === 0}
              className={settingsSecondaryBtn}
            >
              {billing.paymentMethods.length ? "Update card" : "Open portal"}
            </button>
          }
        />

        <SettingsCard
          title="Usage"
          description="Live counts against this plan. The API enforces the limits."
        >
          <UsageBody
            snapshot={snapshot}
            loading={entitlementsQuery.isPending}
          />
        </SettingsCard>

        {paid ? (
          <SettingsCard
            title="Auto-renew"
            description={
              billing.autoRenew
                ? `Charges automatically each ${billing.billingInterval ?? "period"}. Turn off to cancel at period end.`
                : "Off. Paid features lock when this period ends."
            }
            status={
              <p>
                Status:{" "}
                <span
                  className={
                    billing.autoRenew
                      ? "font-semibold text-brand-primary"
                      : "font-semibold text-warning"
                  }
                >
                  {billing.autoRenew ? "Enabled" : "Disabled"}
                </span>
                {!billing.autoRenew ? (
                  <span className="text-text-muted">
                    {" "}
                    · access until {formatDate(billing.currentPeriodEndsAt)}
                  </span>
                ) : null}
              </p>
            }
            action={
              <Switch
                checked={billing.autoRenew}
                disabled={busy}
                label="Auto-renew"
                onClick={onToggleAutoRenew}
              />
            }
          />
        ) : null}

        <SettingsCard
          title={paid ? "Change plan" : "Plans"}
          description="One charge for the cycle you pick. Card numbers never reach Secrela."
          action={<IntervalToggle value={interval} onChange={setInterval} />}
        >
          {!processorReady ? (
            <p
              className="mt-4 text-small text-warning"
              role="status"
            >
              Checkout is not connected in this environment. You can still
              compare plans; a live card charge may not complete.
            </p>
          ) : null}
          <ul className="mt-5 divide-y divide-border-subtle border-t border-border-subtle">
            {PAID_PLAN_SLUGS.map((slug) => (
              <PlanRow
                key={slug}
                slug={slug}
                interval={interval}
                billing={billing}
                recommended={recommended === slug}
                paid={paid}
                emphasize={
                  recommended === slug &&
                  (paid ||
                    billing.subscriptionStatus === "trialing" ||
                    billing.subscriptionStatus === "expired" ||
                    billing.subscriptionStatus === "pending_payment")
                }
              />
            ))}
          </ul>
        </SettingsCard>
      </SettingsPage>

      <ConfirmDialog
        open={pendingRenewOff}
        title="Turn off auto-renew?"
        description="When this billing period ends, the workspace will not renew. Vaults and secrets stay in place, but paid features lock until someone subscribes again."
        confirmLabel="Turn off auto-renew"
        danger
        loading={busy}
        onConfirm={() => void applyAutoRenew(false)}
        onClose={() => {
          if (!busy) setPendingRenewOff(false);
        }}
      />
    </>
  );
}

function PaymentStatus({
  billing,
  methods,
}: {
  billing: BillingOverview;
  methods: BillingPaymentMethod[];
}) {
  if (methods.length > 0) {
    return (
      <ul className="space-y-1">
        {methods.map((m) => (
          <li key={`${m.brand}-${m.last4}-${m.firstSeenAt}`}>
            {brandLabel(m.brand)} •••• {m.last4}
            {m.isDefault ? (
              <span className="ml-2 text-text-muted">Default</span>
            ) : null}
            <span className="text-text-muted">
              {" "}
              · last used {formatDate(m.lastUsedAt)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (billing.cardBrand && billing.cardLast4) {
    return (
      <p>
        {brandLabel(billing.cardBrand)} •••• {billing.cardLast4}
      </p>
    );
  }

  return <p className="text-text-secondary">No card on file yet.</p>;
}

function UsageBody({
  snapshot,
  loading,
}: {
  snapshot: PlanEntitlementSnapshot | undefined;
  loading: boolean;
}) {
  if (loading || !snapshot) {
    return (
      <div className="mt-5 space-y-3 border-t border-border-subtle pt-5">
        <div className="h-8 animate-pulse rounded-sm bg-surface-elevated" />
        <div className="h-8 animate-pulse rounded-sm bg-surface-elevated" />
        <div className="h-8 animate-pulse rounded-sm bg-surface-elevated" />
      </div>
    );
  }

  return (
    <ul className="mt-5 space-y-4 border-t border-border-subtle pt-5">
      <UsageBar
        icon={<IconMembers className="h-3.5 w-3.5" />}
        label="Seats"
        used={snapshot.usage.seatsUsed}
        limit={snapshot.entitlements.maxMembers}
        hint={
          snapshot.usage.pendingInvites > 0
            ? `${snapshot.usage.pendingInvites} pending invite${
                snapshot.usage.pendingInvites === 1 ? "" : "s"
              }`
            : undefined
        }
      />
      <UsageBar
        icon={<IconVault className="h-3.5 w-3.5" />}
        label="Vaults"
        used={snapshot.usage.vaults}
        limit={snapshot.entitlements.maxVaults}
      />
      <UsageBar
        icon={<IconSecret className="h-3.5 w-3.5" />}
        label="Secrets"
        used={snapshot.usage.secrets}
        limit={snapshot.entitlements.maxSecrets}
      />
    </ul>
  );
}

function UsageBar({
  icon,
  label,
  used,
  limit,
  hint,
}: {
  icon: ReactNode;
  label: string;
  used: number;
  limit: number | null;
  hint?: string;
}) {
  const unlimited = limit == null;
  const pct = unlimited
    ? 0
    : limit === 0
      ? 100
      : Math.min(100, Math.round((used / limit) * 100));
  const atLimit = !unlimited && used >= limit;
  const nearLimit = !unlimited && !atLimit && pct >= 80;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[12px] text-text-secondary">
          <span className="text-text-muted">{icon}</span>
          {label}
        </p>
        <p
          className={`text-[12px] font-semibold tabular-nums ${
            atLimit || nearLimit ? "text-warning" : "text-text-primary"
          }`}
        >
          {unlimited ? `${used} · Unlimited` : `${used} / ${formatPlanLimit(limit)}`}
        </p>
      </div>
      <div
        className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-background-secondary"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={unlimited ? used || 1 : limit}
        aria-valuenow={used}
      >
        <div
          className={`h-full rounded-pill ${
            atLimit || nearLimit ? "bg-warning" : "bg-brand-primary"
          }`}
          style={{
            width: unlimited ? "0%" : `${Math.max(pct, used > 0 ? 4 : 0)}%`,
          }}
        />
      </div>
      {atLimit ? (
        <p className="mt-1 text-[11px] font-medium text-warning">Limit reached</p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
      ) : null}
    </li>
  );
}

function Switch({
  checked,
  disabled,
  label,
  onClick,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 w-10 shrink-0 rounded-pill transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50 ${
        checked
          ? "bg-brand-primary"
          : "border border-border-default bg-background-secondary"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full transition-transform ${
          checked ? "translate-x-4 bg-brand-on-primary" : "bg-text-primary"
        }`}
      />
    </button>
  );
}

function IntervalToggle({
  value,
  onChange,
}: {
  value: Interval;
  onChange: (next: Interval) => void;
}) {
  return (
    <div
      className="inline-flex rounded-sm border border-border-default p-0.5"
      role="group"
      aria-label="Billing interval"
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={
          value === "monthly"
            ? "h-9 rounded-sm bg-surface-elevated px-3 text-[12px] font-semibold text-text-primary"
            : "h-9 rounded-sm px-3 text-[12px] font-medium text-text-secondary hover:text-text-primary"
        }
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={
          value === "yearly"
            ? "h-9 rounded-sm bg-surface-elevated px-3 text-[12px] font-semibold text-text-primary"
            : "h-9 rounded-sm px-3 text-[12px] font-medium text-text-secondary hover:text-text-primary"
        }
      >
        Yearly
        <span className="ml-1.5 text-[10px] font-semibold text-brand-primary">
          −20%
        </span>
      </button>
    </div>
  );
}

function PlanRow({
  slug,
  interval,
  billing,
  recommended,
  paid,
  emphasize,
}: {
  slug: PaidPlanSlug;
  interval: Interval;
  billing: BillingOverview;
  recommended: boolean;
  paid: boolean;
  emphasize: boolean;
}) {
  const prices = PAID_PLAN_PRICES[slug];
  const currentSlug = isPaidPlanSlug(billing.planSlug ?? "")
    ? billing.planSlug
    : null;
  const isCurrent = paid && currentSlug === slug;
  const sameInterval = billing.billingInterval === interval;
  const href = checkoutPath(slug, interval);

  let cta = `Subscribe`;
  let disabled = false;
  if (isCurrent && sameInterval) {
    cta = "Current";
    disabled = true;
  } else if (isCurrent && !sameInterval) {
    cta = interval === "yearly" ? "Switch to yearly" : "Switch to monthly";
  } else if (paid) {
    cta = "Switch";
  }

  const primary = emphasize && !disabled;
  const amount =
    interval === "yearly" ? prices.yearlyPerMonth : prices.monthly;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-text-primary">
          {PAID_PLAN_LABELS[slug]}
          {isCurrent ? (
            <span className="ml-2 text-[12px] font-medium text-brand-primary">
              Current
            </span>
          ) : recommended ? (
            <span className="ml-2 text-[12px] font-medium text-text-muted">
              Recommended
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-small text-text-secondary">
          ${amount}/month
          {interval === "yearly" ? ` · $${prices.yearly} billed yearly` : ""}
          {" · "}
          {PAID_PLAN_FEATURES[slug][0]}
        </p>
      </div>
      {disabled ? (
        <span className="inline-flex h-10 items-center rounded-sm border border-border-subtle px-4 text-sm font-semibold text-text-muted">
          {cta}
        </span>
      ) : (
        <Link
          href={href}
          className={primary ? settingsPrimaryBtn : settingsSecondaryBtn}
        >
          {cta}
        </Link>
      )}
    </li>
  );
}
