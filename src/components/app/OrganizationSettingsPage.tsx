"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ApiError,
  updateAutoRenewRequest,
  updateOrganizationRequest,
  type Organization,
} from "../../lib/api";
import { BILLING_PATH } from "../../lib/routes";
import { useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";
import { usePlanEntitlementsQuery } from "../../hooks/queries/usePlanEntitlementsQuery";
import { formatPlanUsage } from "../../lib/plan-entitlements";
import { PageHeader } from "./ui";
import {
  formatTrialEndDate,
  trialDaysRemaining,
} from "../../lib/subscription";
import { toast } from "../../stores/toast-store";

const TYPE_LABELS: Record<Organization["type"], string> = {
  startup: "Startup",
  sme: "Small / mid-size business",
  enterprise: "Enterprise",
  agency: "Agency",
  other: "Other",
};

/**
 * Company profile: shows data from registration + form for platform extras.
 */
export function OrganizationSettingsPage() {
  const { organization, role, can } = useRequiredWorkspace();
  const { setOrganization } = useWorkspaceActions();
  const canEdit = can("org.update");
  const onFreeTrial =
    organization.subscriptionStatus === "trialing" &&
    organization.planSlug === "free";

  const [website, setWebsite] = useState(organization.website ?? "");
  const [country, setCountry] = useState(organization.country ?? "");
  const [companySize, setCompanySize] = useState(
    organization.companySize ?? "",
  );
  const [industry, setIndustry] = useState(organization.industry ?? "");
  const [billingEmail, setBillingEmail] = useState(
    organization.billingEmail ?? "",
  );
  const [address, setAddress] = useState(organization.address ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const result = await updateOrganizationRequest({
        website: website.trim() || null,
        country: country.trim() || null,
        companySize: (companySize || null) as Organization["companySize"],
        industry: industry.trim() || null,
        billingEmail: billingEmail.trim() || null,
        address: address.trim() || null,
      });
      setOrganization(
        result.organization,
        result.role,
        result.permissions ?? [],
      );
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to save organization profile",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="Organization"
        description="Company identity collected at signup, plus profile details SecureVault needs to run your workspace."
      />

      <div className="grid max-w-3xl gap-4">
        <section className="rounded-md border border-border-subtle bg-surface-card p-4">
          <h2 className="text-[13px] font-semibold text-text-primary">
            From registration
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            Basic company data you entered when creating the account.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <Info label="Company name" value={organization.name} />
            <Info
              label="Company type"
              value={TYPE_LABELS[organization.type] ?? organization.type}
            />
            <Info label="Phone" value={organization.phone || "—"} />
            <Info label="Plan" value={organization.plan} />
            {onFreeTrial ? (
              <Info
                label="Trial ends"
                value={`${trialDaysRemaining(organization.trialEndsAt)} day(s) — ${formatTrialEndDate(organization.trialEndsAt)}`}
              />
            ) : null}
            <Info label="Workspace slug" value={organization.slug} />
            <Info label="Your role" value={role.name} />
          </dl>
        </section>

        {canEdit ? (
          <SubscriptionRenewalSection
            organization={organization}
            onUpdated={(org, role, permissions) =>
              setOrganization(org, role, permissions)
            }
          />
        ) : null}

        <PlanUsageSection />

        <section className="rounded-md border border-border-subtle bg-surface-card p-4">
          <h2 className="text-[13px] font-semibold text-text-primary">
            Additional profile
          </h2>
          <p className="mt-1 text-[12px] text-text-muted">
            Optional details used later for invites, billing contact, and
            security context. You can complete these anytime.
          </p>

          <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Website">
              <input
                className={inputClass}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                disabled={!canEdit}
              />
            </Field>
            <Field label="Country">
              <input
                className={inputClass}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Egypt"
                disabled={!canEdit}
              />
            </Field>
            <Field label="Company size">
              <select
                className={inputClass}
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                disabled={!canEdit}
              >
                <option value="">Select size</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-200">51–200</option>
                <option value="201-1000">201–1000</option>
                <option value="1000+">1000+</option>
              </select>
            </Field>
            <Field label="Industry">
              <input
                className={inputClass}
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="Fintech, SaaS, Healthcare…"
                disabled={!canEdit}
              />
            </Field>
            <Field label="Billing email">
              <input
                className={inputClass}
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@company.com"
                disabled={!canEdit}
              />
            </Field>
            <Field label="Address">
              <input
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city"
                disabled={!canEdit}
              />
            </Field>

            {error ? (
              <p className="sm:col-span-2 text-small text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="sm:col-span-2 text-small text-brand-primary">
                Profile saved.
              </p>
            ) : null}

            {canEdit ? (
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-sm bg-brand-primary px-5 py-2.5 text-small font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover disabled:opacity-60"
                >
                  {loading ? "Saving…" : "Save additional details"}
                </button>
              </div>
            ) : (
              <p className="sm:col-span-2 text-[12px] text-text-muted">
                Only owners and admins can edit organization profile.
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1.5 h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus disabled:opacity-60";

function Info({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[13px] font-medium text-text-primary ${
          capitalize ? "capitalize" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[13px] font-medium text-text-primary">
      {label}
      {children}
    </label>
  );
}

function PlanUsageSection() {
  const entitlementsQuery = usePlanEntitlementsQuery();
  const snapshot = entitlementsQuery.data;

  if (entitlementsQuery.isPending || !snapshot) {
    return (
      <section className="rounded-md border border-border-subtle bg-surface-card p-4">
        <h2 className="text-[13px] font-semibold text-text-primary">
          Plan usage
        </h2>
        <p className="mt-2 text-[12px] text-text-muted">Loading limits…</p>
      </section>
    );
  }

  const { entitlements, usage, planLabel } = snapshot;

  return (
    <section className="rounded-md border border-border-subtle bg-surface-card p-4">
      <h2 className="text-[13px] font-semibold text-text-primary">
        Plan usage
      </h2>
      <p className="mt-1 text-[12px] text-text-muted">
        Live usage for your {planLabel} workspace. Limits are enforced on the
        server — upgrading unlocks more capacity and features.
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <UsageMeter
          label="Team seats"
          value={formatPlanUsage(usage.seatsUsed, entitlements.maxMembers)}
          atLimit={!snapshot.capabilities.inviteMember}
        />
        <UsageMeter
          label="Vaults"
          value={formatPlanUsage(usage.vaults, entitlements.maxVaults)}
          atLimit={!snapshot.capabilities.createVault}
        />
        <UsageMeter
          label="Secrets"
          value={formatPlanUsage(usage.secrets, entitlements.maxSecrets)}
          atLimit={!snapshot.capabilities.createSecret}
        />
        <UsageMeter
          label="Custom roles"
          value={
            entitlements.customRoles
              ? String(usage.customRoles)
              : "Not included"
          }
          atLimit={false}
        />
      </dl>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
          Included features
        </p>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          <FeatureFlag
            label="Audit logs"
            enabled={entitlements.auditLogAccess}
            detail={
              entitlements.auditLogAccess && entitlements.auditRetentionDays
                ? `${entitlements.auditRetentionDays}-day retention`
                : entitlements.auditLogAccess
                  ? "Full history"
                  : undefined
            }
          />
          <FeatureFlag
            label="Custom roles"
            enabled={entitlements.customRoles}
          />
          <FeatureFlag
            label="Security Center"
            enabled={entitlements.securityCenter}
          />
          <FeatureFlag
            label="Integrations"
            enabled={entitlements.integrations}
          />
        </ul>
      </div>
    </section>
  );
}

function UsageMeter({
  label,
  value,
  atLimit,
}: {
  label: string;
  value: string;
  atLimit: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-[13px] font-semibold ${
          atLimit ? "text-warning" : "text-text-primary"
        }`}
      >
        {value}
        {atLimit ? (
          <span className="ml-1.5 text-[11px] font-medium text-warning">
            Limit reached
          </span>
        ) : null}
      </dd>
    </div>
  );
}

function FeatureFlag({
  label,
  enabled,
  detail,
}: {
  label: string;
  enabled: boolean;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-2 text-[12px]">
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          enabled
            ? "bg-brand-primary/15 text-brand-primary"
            : "bg-surface-elevated text-text-muted"
        }`}
        aria-hidden
      >
        {enabled ? "✓" : "—"}
      </span>
      <span>
        <span
          className={`font-medium ${
            enabled ? "text-text-primary" : "text-text-muted"
          }`}
        >
          {label}
        </span>
        {detail ? (
          <span className="mt-0.5 block text-[11px] text-text-muted">
            {detail}
          </span>
        ) : null}
      </span>
    </li>
  );
}

function SubscriptionRenewalSection({
  organization,
  onUpdated,
}: {
  organization: Organization;
  onUpdated: (
    organization: Organization,
    role: import("../../lib/api").ResolvedRole,
    permissions: import("../../lib/api").Permission[],
  ) => void;
}) {
  const [autoRenew, setAutoRenew] = useState(Boolean(organization.autoRenew));
  const [saving, setSaving] = useState(false);

  const isPaidActive =
    organization.subscriptionStatus === "active" &&
    Boolean(organization.billingInterval);

  const amountLabel =
    organization.subscriptionAmountCents != null
      ? `$${(organization.subscriptionAmountCents / 100).toFixed(2)} ${organization.currency ?? "USD"}`
      : null;

  const intervalLabel =
    organization.billingInterval === "yearly"
      ? "Yearly"
      : organization.billingInterval === "monthly"
        ? "Monthly"
        : "—";

  async function onSave() {
    setSaving(true);
    try {
      const result = await updateAutoRenewRequest({ autoRenew });
      onUpdated(
        result.organization,
        result.role,
        result.permissions ?? [],
      );
      toast.success(autoRenew ? "Auto-renew enabled" : "Auto-renew turned off");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not update auto-renew",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border border-border-subtle bg-surface-card p-4">
      <h2 className="text-[13px] font-semibold text-text-primary">
        Plan & billing
      </h2>
      <p className="mt-1 text-[12px] text-text-muted">
        Your current workspace plan. After you subscribe, auto-renew follows
        the same monthly or yearly interval you paid for.
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="Plan" value={organization.plan} />
        <Info
          label="Status"
          value={(organization.subscriptionStatus ?? "—").replace("_", " ")}
          capitalize
        />
        <Info label="Billing interval" value={intervalLabel} />
        {amountLabel ? (
          <Info label="Period amount" value={amountLabel} />
        ) : null}
        {organization.currentPeriodEndsAt || organization.trialEndsAt ? (
          <Info
            label={
              organization.subscriptionStatus === "trialing"
                ? "Trial ends"
                : "Current period ends"
            }
            value={formatTrialEndDate(
              organization.currentPeriodEndsAt ?? organization.trialEndsAt,
            )}
          />
        ) : null}
        <Info
          label="Auto-renew"
          value={organization.autoRenew ? "On" : "Off"}
        />
      </dl>

      {isPaidActive ? (
        <>
          <label className="mt-4 flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-default accent-brand-primary"
              checked={autoRenew}
              onChange={(e) => setAutoRenew(e.target.checked)}
            />
            <span>
              <span className="block text-[13px] font-medium text-text-primary">
                Auto-renew ({intervalLabel.toLowerCase()})
              </span>
              <span className="mt-0.5 block text-[12px] text-text-muted">
                When this period ends, Lemon charges your saved card on the same{" "}
                {intervalLabel.toLowerCase()} cycle. Manage cards under{" "}
                <Link
                  href={BILLING_PATH}
                  className="text-brand-primary hover:underline"
                >
                  Billing
                </Link>
                .
              </span>
            </span>
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave()}
            className="mt-4 rounded-sm bg-brand-primary px-5 py-2.5 text-small font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save renewal setting"}
          </button>
        </>
      ) : (
        <p className="mt-4 text-[12px] text-text-muted">
          Auto-renew becomes available after you activate a paid plan from
          pricing.
        </p>
      )}
    </section>
  );
}
