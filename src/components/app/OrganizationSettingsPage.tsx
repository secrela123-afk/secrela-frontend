"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  updateAutoRenewRequest,
  updateOrganizationRequest,
  type Organization,
  type Permission,
  type ResolvedRole,
} from "../../lib/api";
import { BILLING_PATH } from "../../lib/routes";
import { useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";
import { usePlanEntitlementsQuery } from "../../hooks/queries/usePlanEntitlementsQuery";
import {
  formatPlanLimit,
  upgradeHref,
  type PlanEntitlementSnapshot,
} from "../../lib/plan-entitlements";
import { isOwnerOrAdminRole } from "../../lib/app-nav";
import { StatusBadge } from "./ui";
import { ConfirmDialog } from "./RowActionsMenu";
import {
  formatTrialEndDate,
  trialDaysRemaining,
} from "../../lib/subscription";
import { toast } from "../../stores/toast-store";
import {
  IconCheck,
  IconChevronRight,
  IconCopy,
  IconLock,
  IconCreditCard,
  IconMembers,
  IconSecurity,
  IconVault,
} from "./icons";

const TYPE_LABELS: Record<Organization["type"], string> = {
  startup: "Startup",
  sme: "Small / mid-size business",
  enterprise: "Enterprise",
  agency: "Agency",
  other: "Other",
};

const SIZE_LABELS: Record<NonNullable<Organization["companySize"]>, string> = {
  "1-10": "1–10 people",
  "11-50": "11–50 people",
  "51-200": "51–200 people",
  "201-1000": "201–1,000 people",
  "1000+": "1,000+ people",
};

const CONTROL =
  "mt-1.5 h-12 w-full rounded-sm border border-border-default bg-background-secondary px-3.5 text-body text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand-primary focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-60";

type ProfileDraft = {
  name: string;
  type: Organization["type"];
  phone: string;
  website: string;
  country: string;
  companySize: NonNullable<Organization["companySize"]> | "";
  industry: string;
  billingEmail: string;
  address: string;
};

function draftFromOrg(organization: Organization): ProfileDraft {
  return {
    name: organization.name,
    type: organization.type,
    phone: organization.phone ?? "",
    website: organization.website ?? "",
    country: organization.country ?? "",
    companySize: (organization.companySize ?? "") as ProfileDraft["companySize"],
    industry: organization.industry ?? "",
    billingEmail: organization.billingEmail ?? "",
    address: organization.address ?? "",
  };
}

function sameDraft(a: ProfileDraft, b: ProfileDraft) {
  return (
    a.name === b.name &&
    a.type === b.type &&
    a.phone === b.phone &&
    a.website === b.website &&
    a.country === b.country &&
    a.companySize === b.companySize &&
    a.industry === b.industry &&
    a.billingEmail === b.billingEmail &&
    a.address === b.address
  );
}

function orgInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatJoined(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusTone(
  status: Organization["subscriptionStatus"],
): "brand" | "warning" | "danger" | "muted" {
  if (status === "active") return "brand";
  if (status === "trialing" || status === "pending_payment") return "warning";
  if (status === "expired") return "danger";
  return "muted";
}

function statusLabel(status: Organization["subscriptionStatus"]) {
  if (status === "trialing") return "Free trial";
  if (status === "active") return "Active";
  if (status === "pending_payment") return "Payment pending";
  if (status === "expired") return "Expired";
  return "Unknown";
}

/**
 * Workspace identity — company profile, plan capacity, and billing posture.
 * Owner/Admin can edit. Other members with org.read get a read-only view.
 */
export function OrganizationSettingsPage() {
  const { organization, role, can } = useRequiredWorkspace();
  const { setOrganization } = useWorkspaceActions();
  const canEdit = can("org.update");
  const entitlementsQuery = usePlanEntitlementsQuery();

  const [draft, setDraft] = useState<ProfileDraft>(() =>
    draftFromOrg(organization),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseline = useMemo(() => draftFromOrg(organization), [organization]);
  const dirty = canEdit && !sameDraft(draft, baseline);

  useEffect(() => {
    if (!dirty) return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  function patch<K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function discard() {
    setDraft(draftFromOrg(organization));
    setError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit || !dirty) return;
    setError(null);
    setLoading(true);
    try {
      const result = await updateOrganizationRequest({
        name: draft.name.trim(),
        type: draft.type,
        phone: draft.phone.trim(),
        website: draft.website.trim() || null,
        country: draft.country.trim() || null,
        companySize: (draft.companySize || null) as Organization["companySize"],
        industry: draft.industry.trim() || null,
        billingEmail: draft.billingEmail.trim() || null,
        address: draft.address.trim() || null,
      });
      setOrganization(
        result.organization,
        result.role,
        result.permissions ?? [],
      );
      setDraft(draftFromOrg(result.organization));
      toast.success("Workspace profile saved");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Unable to save organization profile";
      setError(message);
      toast.error("Could not save profile", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 lg:px-8 lg:py-6">
      <WorkspaceHero
        organization={organization}
        roleName={role.name}
        canEdit={canEdit}
        showBilling={isOwnerOrAdminRole(role)}
      />

      <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-md border border-border-subtle bg-surface-card shadow-card">
          <div className="flex items-start justify-between gap-4 border-b border-border-subtle px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-card text-text-primary">Company profile</h2>
              <p className="mt-1 max-w-xl text-small text-text-secondary">
                Legal identity and contact details used for invites, billing,
                and security context. The workspace ID cannot be changed.
              </p>
            </div>
            {!canEdit ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xs bg-surface-elevated px-2 py-1 text-label text-text-muted">
                <IconLock className="h-3.5 w-3.5" />
                View only
              </span>
            ) : null}
          </div>

          {canEdit ? (
            <form onSubmit={onSubmit} className="px-5 py-5 sm:px-6">
              {dirty ? (
                <div className="mb-5 flex flex-col gap-3 rounded-sm border border-warning/30 bg-warning/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-small text-text-primary">
                    You have unsaved changes.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={discard}
                      className="inline-flex h-10 items-center rounded-sm border border-border-default px-3.5 text-small font-semibold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex h-10 items-center rounded-sm bg-brand-primary px-4 text-small font-semibold text-brand-on-primary transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
                    >
                      {loading ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              ) : null}

              <ProfileFields
                draft={draft}
                onChange={patch}
                disabled={!canEdit || loading}
              />

              {error ? (
                <p className="mt-4 text-small text-danger" role="alert">
                  {error}
                </p>
              ) : null}

              {!dirty ? (
                <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-5">
                  <p className="text-small text-text-muted">
                    No pending changes.
                  </p>
                  <button
                    type="submit"
                    disabled
                    className="inline-flex h-12 items-center rounded-sm bg-brand-primary px-5 text-small font-semibold text-brand-on-primary opacity-40"
                  >
                    Save changes
                  </button>
                </div>
              ) : (
                <div className="mt-6 flex justify-end border-t border-border-subtle pt-5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-12 items-center rounded-sm bg-brand-primary px-5 text-small font-semibold text-brand-on-primary transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
                  >
                    {loading ? "Saving…" : "Save changes"}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <ProfileReadOnly organization={organization} />
          )}
        </section>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
          <PlanCard
            organization={organization}
            canEdit={canEdit}
            onUpdated={setOrganization}
          />
          <CapacityCard
            snapshot={entitlementsQuery.data}
            loading={entitlementsQuery.isPending}
          />
          <Shortcuts
            canMembers={can("member.read")}
            canBilling={isOwnerOrAdminRole(role)}
            canSecurity={isOwnerOrAdminRole(role)}
            canVaults={can("vault.read")}
          />
        </aside>
      </div>
    </div>
  );
}

function WorkspaceHero({
  organization,
  roleName,
  canEdit,
  showBilling,
}: {
  organization: Organization;
  roleName: string;
  canEdit: boolean;
  showBilling: boolean;
}) {
  const status = organization.subscriptionStatus;
  const onTrial =
    status === "trialing" && organization.planSlug === "free";
  const daysLeft = trialDaysRemaining(organization.trialEndsAt);

  return (
    <header className="flex flex-col gap-5 border-b border-border-subtle pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-elevated text-card font-semibold tracking-tight text-text-primary"
          aria-hidden
        >
          {orgInitials(organization.name)}
        </div>
        <div className="min-w-0">
          <p className="text-label font-medium tracking-[0.14em] text-text-muted uppercase">
            Workspace
          </p>
          <h1 className="mt-1 truncate text-page font-semibold tracking-tight text-text-primary">
            {organization.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-small text-text-secondary">
            <CopySlug slug={organization.slug} />
            <span aria-hidden className="text-text-muted">
              ·
            </span>
            <span>{roleName}</span>
            <span aria-hidden className="text-text-muted">
              ·
            </span>
            <span>Created {formatJoined(organization.createdAt)}</span>
            {!canEdit ? (
              <>
                <span aria-hidden className="text-text-muted">
                  ·
                </span>
                <span>Read-only access</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={statusTone(status)}>
          {statusLabel(status)}
          {onTrial && daysLeft > 0 ? ` · ${daysLeft}d left` : ""}
        </StatusBadge>
        {showBilling ? (
          <Link
            href={BILLING_PATH}
            className="inline-flex h-10 items-center gap-1 rounded-sm border border-border-default px-3.5 text-small font-semibold text-text-primary no-underline transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
          >
            Manage billing
            <IconChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
    </header>
  );
}

function CopySlug({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      toast.success("Workspace ID copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy workspace ID");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 rounded-xs text-small text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
      title="Copy workspace ID"
    >
      <span className="font-mono text-[12px]">{slug}</span>
      {copied ? (
        <IconCheck className="h-3.5 w-3.5 text-brand-primary" />
      ) : (
        <IconCopy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function ProfileFields({
  draft,
  onChange,
  disabled,
}: {
  draft: ProfileDraft;
  onChange: <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <Field label="Company name" htmlFor="org-name">
        <input
          id="org-name"
          className={CONTROL}
          value={draft.name}
          onChange={(e) => onChange("name", e.target.value)}
          disabled={disabled}
          autoComplete="organization"
        />
      </Field>
      <Field label="Company type" htmlFor="org-type">
        <select
          id="org-type"
          className={CONTROL}
          value={draft.type}
          onChange={(e) =>
            onChange("type", e.target.value as Organization["type"])
          }
          disabled={disabled}
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Phone" htmlFor="org-phone">
        <input
          id="org-phone"
          className={CONTROL}
          value={draft.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          disabled={disabled}
          autoComplete="tel"
        />
      </Field>
      <Field label="Website" htmlFor="org-website" optional>
        <input
          id="org-website"
          className={CONTROL}
          value={draft.website}
          onChange={(e) => onChange("website", e.target.value)}
          placeholder="https://company.com"
          disabled={disabled}
          autoComplete="url"
        />
      </Field>
      <Field label="Country" htmlFor="org-country" optional>
        <input
          id="org-country"
          className={CONTROL}
          value={draft.country}
          onChange={(e) => onChange("country", e.target.value)}
          placeholder="Egypt"
          disabled={disabled}
        />
      </Field>
      <Field label="Company size" htmlFor="org-size" optional>
        <select
          id="org-size"
          className={CONTROL}
          value={draft.companySize}
          onChange={(e) =>
            onChange(
              "companySize",
              e.target.value as ProfileDraft["companySize"],
            )
          }
          disabled={disabled}
        >
          <option value="">Select size</option>
          {Object.entries(SIZE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Industry" htmlFor="org-industry" optional>
        <input
          id="org-industry"
          className={CONTROL}
          value={draft.industry}
          onChange={(e) => onChange("industry", e.target.value)}
          placeholder="Fintech, SaaS, healthcare…"
          disabled={disabled}
        />
      </Field>
      <Field label="Billing email" htmlFor="org-billing-email" optional>
        <input
          id="org-billing-email"
          className={CONTROL}
          type="email"
          value={draft.billingEmail}
          onChange={(e) => onChange("billingEmail", e.target.value)}
          placeholder="billing@company.com"
          disabled={disabled}
          autoComplete="email"
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Address" htmlFor="org-address" optional>
          <input
            id="org-address"
            className={CONTROL}
            value={draft.address}
            onChange={(e) => onChange("address", e.target.value)}
            placeholder="Street, city"
            disabled={disabled}
            autoComplete="street-address"
          />
        </Field>
      </div>
    </div>
  );
}

function ProfileReadOnly({ organization }: { organization: Organization }) {
  return (
    <dl className="grid gap-x-6 gap-y-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
      <ReadRow label="Company name" value={organization.name} />
      <ReadRow
        label="Company type"
        value={TYPE_LABELS[organization.type] ?? organization.type}
      />
      <ReadRow label="Phone" value={organization.phone || "—"} />
      <ReadRow label="Website" value={organization.website || "—"} />
      <ReadRow label="Country" value={organization.country || "—"} />
      <ReadRow
        label="Company size"
        value={
          organization.companySize
            ? SIZE_LABELS[organization.companySize]
            : "—"
        }
      />
      <ReadRow label="Industry" value={organization.industry || "—"} />
      <ReadRow label="Billing email" value={organization.billingEmail || "—"} />
      <div className="sm:col-span-2">
        <ReadRow label="Address" value={organization.address || "—"} />
      </div>
      <p className="sm:col-span-2 text-small text-text-muted">
        Only owners and admins can edit this workspace profile.
      </p>
    </dl>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between text-label font-medium text-text-secondary"
      >
        <span>{label}</span>
        {optional ? (
          <span className="font-normal text-text-muted">Optional</span>
        ) : null}
      </label>
      {children}
    </div>
  );
}

function ReadRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label font-medium text-text-muted">{label}</dt>
      <dd className="mt-1.5 text-body font-medium break-words text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function PlanCard({
  organization,
  canEdit,
  onUpdated,
}: {
  organization: Organization;
  canEdit: boolean;
  onUpdated: (
    organization: Organization,
    role: ResolvedRole,
    permissions: Permission[],
  ) => void;
}) {
  const [pendingOff, setPendingOff] = useState(false);
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
        : null;

  const periodLabel =
    organization.subscriptionStatus === "trialing"
      ? "Trial ends"
      : "Current period ends";

  const periodValue = formatTrialEndDate(
    organization.currentPeriodEndsAt ?? organization.trialEndsAt,
  );

  async function applyAutoRenew(next: boolean) {
    setSaving(true);
    try {
      const result = await updateAutoRenewRequest({ autoRenew: next });
      onUpdated(result.organization, result.role, result.permissions ?? []);
      toast.success(next ? "Auto-renew enabled" : "Auto-renew turned off");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update auto-renew",
      );
    } finally {
      setSaving(false);
      setPendingOff(false);
    }
  }

  function onToggle() {
    if (!canEdit || !isPaidActive || saving) return;
    if (organization.autoRenew) {
      setPendingOff(true);
      return;
    }
    void applyAutoRenew(true);
  }

  return (
    <section className="rounded-md border border-border-subtle bg-surface-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[13px] font-semibold text-text-primary">Plan</h2>
          <p className="mt-1 text-[12px] text-text-muted">
            Subscription for this workspace. Card details stay on Billing.
          </p>
        </div>
        <StatusBadge tone={statusTone(organization.subscriptionStatus)}>
          {statusLabel(organization.subscriptionStatus)}
        </StatusBadge>
      </div>

      <p className="mt-4 text-card text-text-primary">{organization.plan}</p>
      <dl className="mt-3 space-y-2.5">
        {intervalLabel ? (
          <RailRow label="Interval" value={intervalLabel} />
        ) : null}
        {amountLabel ? (
          <RailRow label="Amount" value={amountLabel} />
        ) : null}
        {organization.currentPeriodEndsAt || organization.trialEndsAt ? (
          <RailRow label={periodLabel} value={periodValue} />
        ) : null}
      </dl>

      <div className="mt-4 border-t border-border-subtle pt-4">
        {isPaidActive && canEdit ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-text-primary">
                Auto-renew
              </p>
              <p className="mt-0.5 text-[12px] text-text-muted">
                {organization.autoRenew
                  ? `Charges on the ${intervalLabel?.toLowerCase()} cycle when this period ends.`
                  : "Off. Access may lock when the current period ends."}
              </p>
            </div>
            <Switch
              checked={Boolean(organization.autoRenew)}
              disabled={saving}
              label="Auto-renew"
              onClick={onToggle}
            />
          </div>
        ) : (
          <p className="text-[12px] text-text-muted">
            {canEdit
              ? "Auto-renew is available after a paid plan is active."
              : organization.autoRenew
                ? "Auto-renew is on."
                : "Auto-renew is off."}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingOff}
        title="Turn off auto-renew?"
        description="When this billing period ends, the workspace will not renew. Vaults and secrets stay in place, but paid features lock until someone subscribes again."
        confirmLabel="Turn off auto-renew"
        danger
        loading={saving}
        onConfirm={() => void applyAutoRenew(false)}
        onClose={() => {
          if (!saving) setPendingOff(false);
        }}
      />
    </section>
  );
}

function RailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[12px] text-text-muted">{label}</dt>
      <dd className="text-right text-[12px] font-medium text-text-primary">
        {value}
      </dd>
    </div>
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
        checked ? "bg-brand-primary" : "border border-border-default bg-background-secondary"
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

function CapacityCard({
  snapshot,
  loading,
}: {
  snapshot: PlanEntitlementSnapshot | undefined;
  loading: boolean;
}) {
  if (loading || !snapshot) {
    return (
      <section className="rounded-md border border-border-subtle bg-surface-card p-5 shadow-card">
        <h2 className="text-[13px] font-semibold text-text-primary">Capacity</h2>
        <div className="mt-4 space-y-4">
          <div className="h-10 animate-pulse rounded-sm bg-surface-elevated" />
          <div className="h-10 animate-pulse rounded-sm bg-surface-elevated" />
          <div className="h-10 animate-pulse rounded-sm bg-surface-elevated" />
        </div>
      </section>
    );
  }

  const { entitlements, usage, planLabel, upgradePlanLabel, upgradePlanSlug } =
    snapshot;

  return (
    <section className="rounded-md border border-border-subtle bg-surface-card p-5 shadow-card">
      <h2 className="text-[13px] font-semibold text-text-primary">Capacity</h2>
      <p className="mt-1 text-[12px] text-text-muted">
        Live usage on {planLabel}. Limits are enforced by the API.
      </p>

      <ul className="mt-4 space-y-4">
        <UsageBar
          label="Team seats"
          used={usage.seatsUsed}
          limit={entitlements.maxMembers}
          hint={
            usage.pendingInvites > 0
              ? `${usage.pendingInvites} pending invite${usage.pendingInvites === 1 ? "" : "s"}`
              : undefined
          }
        />
        <UsageBar
          label="Vaults"
          used={usage.vaults}
          limit={entitlements.maxVaults}
        />
        <UsageBar
          label="Secrets"
          used={usage.secrets}
          limit={entitlements.maxSecrets}
        />
        <li>
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-[12px] text-text-secondary">Custom roles</p>
            <p className="text-[12px] font-semibold tabular-nums text-text-primary">
              {entitlements.customRoles
                ? usage.customRoles
                : "Not on plan"}
            </p>
          </div>
        </li>
      </ul>

      <div className="mt-5 border-t border-border-subtle pt-4">
        <p className="text-label font-medium tracking-[0.08em] text-text-muted uppercase">
          Included
        </p>
        <ul className="mt-2 space-y-2">
          <FeatureRow
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
          <FeatureRow label="Custom roles" enabled={entitlements.customRoles} />
          <FeatureRow
            label="Security Center"
            enabled={entitlements.securityCenter}
          />
          <FeatureRow
            label="Integrations"
            enabled={entitlements.integrations}
          />
        </ul>
      </div>

      {upgradePlanLabel && upgradePlanSlug ? (
        <Link
          href={upgradeHref(upgradePlanSlug)}
          className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-sm border border-brand-primary/40 bg-brand-primary/10 text-[12px] font-semibold text-brand-primary no-underline transition-colors hover:bg-brand-primary/15 focus-visible:outline-none focus-visible:shadow-focus"
        >
          Upgrade to {upgradePlanLabel}
        </Link>
      ) : null}
    </section>
  );
}

function UsageBar({
  label,
  used,
  limit,
  hint,
}: {
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
        <p className="text-[12px] text-text-secondary">{label}</p>
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
          style={{ width: unlimited ? "0%" : `${Math.max(pct, used > 0 ? 4 : 0)}%` }}
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

function FeatureRow({
  label,
  enabled,
  detail,
}: {
  label: string;
  enabled: boolean;
  detail?: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
          enabled
            ? "bg-brand-primary/15 text-brand-primary"
            : "bg-surface-elevated text-text-muted"
        }`}
        aria-hidden
      >
        {enabled ? (
          <IconCheck className="h-2.5 w-2.5" />
        ) : (
          <span className="block h-1 w-1 rounded-full bg-current" />
        )}
      </span>
      <span>
        <span
          className={`text-[12px] font-medium ${
            enabled ? "text-text-primary" : "text-text-muted"
          }`}
        >
          {enabled ? label : `${label} — not on plan`}
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

function Shortcuts({
  canMembers,
  canBilling,
  canSecurity,
  canVaults,
}: {
  canMembers: boolean;
  canBilling: boolean;
  canSecurity: boolean;
  canVaults: boolean;
}) {
  const items = [
    canMembers
      ? {
          href: "/app/members",
          label: "Members",
          hint: "Roles, MFA, invites",
          icon: IconMembers,
        }
      : null,
    canBilling
      ? {
          href: BILLING_PATH,
          label: "Billing",
          hint: "Plan, invoices, cards",
          icon: IconCreditCard,
        }
      : null,
    canSecurity
      ? {
          href: "/app/security",
          label: "Security Center",
          hint: "Score and findings",
          icon: IconSecurity,
        }
      : null,
    canVaults
      ? {
          href: "/app/vaults",
          label: "Vaults",
          hint: "Where secrets live",
          icon: IconVault,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (items.length === 0) return null;

  return (
    <nav
      className="rounded-md border border-border-subtle bg-surface-card shadow-card"
      aria-label="Related settings"
    >
      <p className="border-b border-border-subtle px-5 py-3 text-[13px] font-semibold text-text-primary">
        Related
      </p>
      <ul>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href} className="border-b border-border-subtle last:border-b-0">
              <Link
                href={item.href}
                className="flex items-center gap-3 px-5 py-3 no-underline transition-colors hover:bg-surface-elevated focus-visible:outline-none focus-visible:shadow-focus"
              >
                <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium text-text-primary">
                    {item.label}
                  </span>
                  <span className="block text-[11px] text-text-muted">
                    {item.hint}
                  </span>
                </span>
                <IconChevronRight className="h-3.5 w-3.5 text-text-muted" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
