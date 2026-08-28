"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApiError,
  type OrganizationSecret,
  type SecretRiskLevel,
  type SecretType,
} from "../../../lib/api";
import {
  useCreateSecretMutation,
  useDeleteSecretMutation,
  useRevealSecretMutation,
  useSecretsQuery,
  useUpdateSecretMutation,
} from "../../../hooks/queries/useSecretsQuery";
import { useCreateAccessRequestMutation } from "../../../hooks/queries/useAccessRequestsQuery";
import { useVaultsQuery } from "../../../hooks/queries/useVaultsQuery";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import {
  formatPlanLimit,
  formatPlanUsage,
  planLimitErrorToast,
} from "../../../lib/plan-entitlements";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import { isOwnerOrAdminRole } from "../../../lib/app-nav";
import { isQueryBooting } from "../../../lib/query-status";
import { ConfirmDialog, RowActionsMenu } from "../RowActionsMenu";
import { RequestAccessModal } from "../RequestAccessModal";
import { useStepUpGate } from "../../security/ReauthModal";
import { Avatar, PageLoading } from "../ui";
import {
  IconAlert,
  IconChevronDown,
  IconClock,
  IconFilter,
  IconKey,
  IconLock,
  IconPlus,
  IconSearch,
  IconSecurity,
  IconSettings,
  IconVault,
} from "../icons";
import { toast } from "../../../stores/toast-store";

const PAGE_SIZE = 8;

const TYPE_LABELS: Record<SecretType, string> = {
  credential: "Credential",
  api_key: "API Key",
  database: "Database",
  token: "Token",
  key_pair: "Key Pair",
  other: "Other",
};

const RISK_OPTIONS: {
  value: SecretRiskLevel;
  label: string;
  className: string;
}[] = [
  { value: "unknown", label: "Unknown", className: "bg-surface-elevated text-text-muted" },
  { value: "low", label: "Low", className: "bg-brand-primary/15 text-brand-primary" },
  { value: "medium", label: "Medium", className: "bg-warning/15 text-warning" },
  { value: "high", label: "High", className: "bg-danger/15 text-danger" },
];

/**
 * Secrets hub — metadata list + encrypted create/reveal.
 * Plaintext never appears in the list; reveal uses HIGH step-up.
 */
export function SecretsPage() {
  const { can, user, role } = useRequiredWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const canCreateByPlan =
    entitlementsQuery.data?.capabilities.createSecret ?? true;
  const canCreatePermission =
    isOwnerOrAdminRole(role) && can("secret.create");
  const canCreate = canCreatePermission && canCreateByPlan;
  const canUpdate = can("secret.update");
  const canDelete = can("secret.delete");
  const isReviewer = isOwnerOrAdminRole(role);
  /** Members (not Owner/Admin) may request temporary access via Reveal. */
  const canRequestAccess = !isReviewer;

  const secretsQuery = useSecretsQuery();
  const { data, error } = secretsQuery;
  const isBooting = isQueryBooting(secretsQuery);
  const { data: vaultsData } = useVaultsQuery();
  const createSecret = useCreateSecretMutation();
  const updateSecret = useUpdateSecretMutation();
  const deleteSecret = useDeleteSecretMutation();
  const revealSecret = useRevealSecretMutation();
  const createAccessRequest = useCreateAccessRequestMutation();
  const { runWithStepUp, modal: stepUpModal } = useStepUpGate(user.email);

  const [query, setQuery] = useState("");
  const [vaultFilter, setVaultFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<SecretType | "all">("all");
  const [riskFilter, setRiskFilter] = useState<SecretRiskLevel | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">(
    "all",
  );
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    type?: SecretType;
    secret?: OrganizationSecret;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizationSecret | null>(
    null,
  );
  const [revealTarget, setRevealTarget] = useState<{
    secret: OrganizationSecret;
    value: string;
  } | null>(null);
  const [requestTarget, setRequestTarget] =
    useState<OrganizationSecret | null>(null);
  const deepLinkHandled = useRef<string | null>(null);

  const secrets = data?.secrets ?? [];
  const summary = data?.summary;
  const byRisk = data?.byRisk;
  const byType = data?.byType;
  const recentActivity = data?.recentActivity ?? [];
  const vaults = vaultsData?.vaults ?? [];
  const accessBlock = data?.viewerAccessBlock ?? null;
  const isAccessBlocked = Boolean(accessBlock?.blocked);

  const owners = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of secrets) map.set(s.owner.id, s.owner.name);
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [secrets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return secrets.filter((s) => {
      if (vaultFilter !== "all" && s.vault.id !== vaultFilter) return false;
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (riskFilter !== "all" && s.riskLevel !== riskFilter) return false;
      if (ownerFilter !== "all" && s.owner.id !== ownerFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.vault.name.toLowerCase().includes(q)
      );
    });
  }, [
    secrets,
    query,
    vaultFilter,
    typeFilter,
    riskFilter,
    ownerFilter,
    statusFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  function openCreate(type: SecretType = "credential") {
    if (!canCreatePermission) {
      toast.warning(
        "Permission required",
        "Only Owner or Admin can create secrets.",
      );
      return;
    }
    if (!canCreateByPlan) {
      const snap = entitlementsQuery.data;
      toast.warning(
        "Plan limit",
        snap?.upgradePlanLabel
          ? `Upgrade to ${snap.upgradePlanLabel} to store more secrets.`
          : "Your plan secret limit has been reached.",
      );
      return;
    }
    if (vaults.length === 0) {
      toast.warning("Create a vault first", "Secrets must live inside a vault.");
      return;
    }
    setCreateMenuOpen(false);
    setEditor({ mode: "create", type });
  }

  function openEdit(secret: OrganizationSecret) {
    if (!canUpdate) {
      toast.warning(
        "Permission required",
        "You need permission to update secrets.",
      );
      return;
    }
    setEditor({ mode: "edit", secret });
  }

  function clearDeepLinkParams() {
    router.replace("/app/secrets", { scroll: false });
  }

  function formatBlockUntil(iso: string | null | undefined): string {
    if (!iso) return "later";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "later";
    return d.toLocaleString();
  }

  async function onReveal(secret: OrganizationSecret) {
    if (secret.hasPendingAccessRequest) {
      toast.info(
        "Request pending",
        "Wait for an Owner or Admin to approve or deny this request.",
      );
      return;
    }
    if (!secret.canReveal) {
      if (!canRequestAccess) {
        toast.warning(
          "No access",
          "Owners and Admins already have reveal access.",
        );
        return;
      }
      if (isAccessBlocked) {
        toast.warning(
          "Temporarily blocked",
          `Reveal and access requests are blocked until ${formatBlockUntil(accessBlock?.blockedUntil)} after repeated denials.`,
        );
        return;
      }
      setRequestTarget(secret);
      return;
    }
    try {
      const result = await runWithStepUp(() =>
        revealSecret.mutateAsync(secret.id),
      );
      setRevealTarget({ secret, value: result.value });
    } catch (err) {
      if (err instanceof ApiError && err.message.includes("cancelled")) return;
      toast.error(
        "Could not reveal secret",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  /** Notification deep-links: ?reveal=id → re-auth + reveal; ?request=id → request form. */
  useEffect(() => {
    if (isBooting || !data) return;
    const revealId = searchParams.get("reveal");
    const requestId = searchParams.get("request");
    const key = revealId
      ? `reveal:${revealId}`
      : requestId
        ? `request:${requestId}`
        : null;
    if (!key || deepLinkHandled.current === key) return;

    if (revealId) {
      const secret = secrets.find((s) => s.id === revealId);
      deepLinkHandled.current = key;
      clearDeepLinkParams();
      void (async () => {
        try {
          const result = await runWithStepUp(() =>
            revealSecret.mutateAsync(revealId),
          );
          setRevealTarget({
            secret:
              secret ??
              ({
                id: revealId,
                name: "Secret",
                description: "",
                type: "other",
                riskLevel: "unknown",
                status: "active",
                vault: { id: "", name: "", color: "green" },
                owner: { id: "", name: "", initials: "?" },
                lastUpdatedAt: new Date().toISOString(),
                lastAccessedAt: null,
                expiresAt: null,
                createdAt: new Date().toISOString(),
                canReveal: true,
                temporaryAccessExpiresAt: null,
                hasPendingAccessRequest: false,
              } satisfies OrganizationSecret),
            value: result.value,
          });
        } catch (err) {
          if (err instanceof ApiError && err.message.includes("cancelled")) {
            return;
          }
          if (secret && canRequestAccess && !isAccessBlocked && !secret.hasPendingAccessRequest) {
            toast.warning(
              "Access not ready",
              "Open Reveal to request access again, or wait if approval is still syncing.",
            );
            setRequestTarget(secret);
            return;
          }
          toast.error(
            "Could not reveal secret",
            err instanceof ApiError ? err.message : "Try again.",
          );
        }
      })();
      return;
    }

    if (requestId) {
      const secret = secrets.find((s) => s.id === requestId);
      deepLinkHandled.current = key;
      clearDeepLinkParams();
      if (!secret) {
        toast.warning(
          "Secret not found",
          "Open Secrets and use Reveal to request again.",
        );
        return;
      }
      if (!canRequestAccess) return;
      if (secret.hasPendingAccessRequest) {
        toast.info(
          "Request pending",
          "Wait for an Owner or Admin to approve or deny this request.",
        );
        return;
      }
      if (isAccessBlocked) {
        toast.warning(
          "Temporarily blocked",
          `Try again after ${formatBlockUntil(accessBlock?.blockedUntil)}.`,
        );
        return;
      }
      if (secret.canReveal) {
        void onReveal(secret);
        return;
      }
      setRequestTarget(secret);
    }
    // Intentionally omit unstable callbacks — run once per deep-link key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBooting, data, searchParams, secrets, canRequestAccess, isAccessBlocked]);

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSecret.mutateAsync(deleteTarget.id);
      toast.success("Secret deleted", `${deleteTarget.name} was removed.`);
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(deleteTarget.id);
        return next;
      });
    } catch (err) {
      toast.error(
        "Could not delete secret",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageAll() {
    const ids = pageRows.map((r) => r.id);
    const allSelected = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Could not load secrets"
          body={
            error instanceof ApiError
              ? error.message
              : "Check your connection and try again."
          }
        />
      </div>
    );
  }

  const activePct =
    summary && summary.totalSecrets > 0
      ? Math.round((summary.activeSecrets / summary.totalSecrets) * 100)
      : 0;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
            Secrets
          </h1>
          <p className="mt-1 max-w-2xl text-small text-text-secondary">
            View, manage and secure your organization secrets.
          </p>
        </div>

        {canCreatePermission ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setCreateMenuOpen((o) => !o)}
              className="inline-flex h-10 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
            >
              <IconPlus className="h-4 w-4" />
              Create Secret
              <IconChevronDown className="h-3.5 w-3.5 opacity-80" />
            </button>
            {createMenuOpen ? (
              <div className="absolute top-full right-0 z-30 mt-1 w-48 overflow-hidden rounded-md border border-border-subtle bg-surface-elevated py-1 shadow-card">
                {(Object.keys(TYPE_LABELS) as SecretType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => openCreate(type)}
                    className="flex w-full px-3 py-2 text-left text-[12px] text-text-secondary hover:bg-surface-card hover:text-text-primary"
                  >
                    {TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {entitlementsQuery.data &&
      !canCreateByPlan &&
      canCreatePermission ? (
        <PlanUpgradePrompt
          className="mb-5"
          title="Secret limit reached"
          description={`Your ${entitlementsQuery.data.planLabel} plan allows ${formatPlanLimit(entitlementsQuery.data.entitlements.maxSecrets)} secret(s). You are using ${formatPlanUsage(entitlementsQuery.data.usage.secrets, entitlementsQuery.data.entitlements.maxSecrets)}. Upgrade to store more.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      {isAccessBlocked ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-3.5 py-3">
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-[13px] font-semibold text-text-primary">
              Reveal / Request temporarily blocked
            </p>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              After 3 consecutive denials, access requests are paused until{" "}
              {formatBlockUntil(accessBlock?.blockedUntil)}. Then you can request
              again.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Secrets"
          value={isBooting ? "—" : String(summary?.totalSecrets ?? 0)}
          hint="Across all vaults"
          icon={<IconLock className="h-4 w-4 text-purple" />}
          iconBg="bg-purple/10"
        />
        <StatCard
          label="Active Secrets"
          value={isBooting ? "—" : String(summary?.activeSecrets ?? 0)}
          hint={`${activePct}% of total`}
          icon={<IconSecurity className="h-4 w-4 text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />
        <StatCard
          label="High Risk Secrets"
          value={isBooting ? "—" : String(summary?.highRiskSecrets ?? 0)}
          hint={<span className="text-warning">Requires attention</span>}
          icon={<IconAlert className="h-4 w-4 text-warning" />}
          iconBg="bg-warning/10"
        />
        <StatCard
          label="Expired Secrets"
          value={isBooting ? "—" : String(summary?.expiredSecrets ?? 0)}
          hint={
            <button
              type="button"
              className="text-info hover:underline"
              onClick={() => {
                setStatusFilter("expired");
                setPage(1);
              }}
            >
              View expired
            </button>
          }
          icon={<IconClock className="h-4 w-4 text-info" />}
          iconBg="bg-info/10"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search secrets..."
                className="h-10 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
              />
            </div>
            <select
              value={vaultFilter}
              onChange={(e) => {
                setVaultFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
            >
              <option value="all">All Vaults</option>
              {vaults.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as SecretType | "all");
                setPage(1);
              }}
              className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
            >
              <option value="all">All Types</option>
              {(Object.keys(TYPE_LABELS) as SecretType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value as SecretRiskLevel | "all");
                setPage(1);
              }}
              className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
            >
              <option value="all">All Risk Levels</option>
              {RISK_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
            >
              <option value="all">All Owners</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setVaultFilter("all");
                setTypeFilter("all");
                setRiskFilter("all");
                setOwnerFilter("all");
                setStatusFilter("all");
                setQuery("");
                setPage(1);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-sm border border-border-default bg-background-secondary px-3 text-[12px] font-medium text-text-secondary hover:border-brand-primary hover:text-brand-primary"
            >
              <IconFilter className="h-3.5 w-3.5" />
              Filters
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border-default bg-background-secondary text-text-muted hover:text-text-primary"
              title="Column settings (soon)"
            >
              <IconSettings className="h-4 w-4" />
            </button>
          </div>

          {isBooting ? (
            <PageLoading label="Loading secrets…" />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={secrets.length === 0 ? "No secrets yet" : "No matching secrets"}
              body={
                secrets.length === 0
                  ? canCreatePermission
                    ? "Create your first secret inside a vault."
                    : "No secrets yet. An Owner or Admin can create secrets for this organization."
                  : "Try a different search or clear filters."
              }
              action={
                secrets.length === 0 && canCreatePermission ? (
                  <button
                    type="button"
                    onClick={() => openCreate()}
                    className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary"
                  >
                    <IconPlus className="h-3.5 w-3.5" />
                    Create Secret
                  </button>
                ) : null
              }
            />
          ) : (
            <section className="overflow-visible rounded-md border border-border-subtle bg-surface-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border-subtle text-[11px] font-semibold tracking-wide text-text-muted uppercase">
                      <th className="w-10 px-3 py-3">
                        <input
                          type="checkbox"
                          checked={
                            pageRows.length > 0 &&
                            pageRows.every((r) => selected.has(r.id))
                          }
                          onChange={togglePageAll}
                          className="rounded border-border-default"
                          aria-label="Select page"
                        />
                      </th>
                      <th className="px-3 py-3">Secret Name</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Vault</th>
                      <th className="px-3 py-3">Owner</th>
                      <th className="px-3 py-3">Risk Level</th>
                      <th className="px-3 py-3">Last Updated</th>
                      <th className="px-3 py-3">Last Accessed</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((secret) => (
                      <tr
                        key={secret.id}
                        className="border-b border-border-subtle last:border-b-0 hover:bg-surface-elevated/40"
                      >
                        <td className="px-3 py-3.5">
                          <input
                            type="checkbox"
                            checked={selected.has(secret.id)}
                            onChange={() => toggleRow(secret.id)}
                            className="rounded border-border-default"
                            aria-label={`Select ${secret.name}`}
                          />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <TypeIcon type={secret.type} />
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-semibold text-text-primary">
                                {secret.name}
                              </p>
                              <p className="truncate text-[11px] text-text-muted">
                                {secret.description || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <TypeBadge type={secret.type} />
                        </td>
                        <td className="px-3 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${vaultDot(secret.vault.color)}`}
                            />
                            {secret.vault.name}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <span title={secret.owner.name}>
                            <Avatar initials={secret.owner.initials} size="sm" />
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <RiskBadge level={secret.riskLevel} />
                        </td>
                        <td className="px-3 py-3.5 text-[13px] text-text-secondary">
                          {formatRelative(secret.lastUpdatedAt)}
                        </td>
                        <td className="px-3 py-3.5 text-[13px] text-text-secondary">
                          {secret.lastAccessedAt
                            ? formatRelative(secret.lastAccessedAt)
                            : "Never"}
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <RowActionsMenu
                            items={[
                              {
                                id: "reveal",
                                label: secret.hasPendingAccessRequest
                                  ? "Request pending…"
                                  : isAccessBlocked
                                    ? "Reveal (blocked)"
                                    : secret.canReveal
                                      ? secret.temporaryAccessExpiresAt
                                        ? "Reveal (temp access)"
                                        : "Reveal"
                                      : "Reveal / Request access",
                                tone: "brand" as const,
                                disabled:
                                  secret.hasPendingAccessRequest ||
                                  (isAccessBlocked && !secret.canReveal),
                                onSelect: () => void onReveal(secret),
                              },
                              ...(canUpdate
                                ? [
                                    {
                                      id: "edit",
                                      label: "Edit",
                                      onSelect: () => openEdit(secret),
                                    },
                                  ]
                                : []),
                              ...(canDelete
                                ? [
                                    {
                                      id: "delete",
                                      label: "Delete",
                                      tone: "danger" as const,
                                      onSelect: () => setDeleteTarget(secret),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PaginationFooter
                from={filtered.length === 0 ? 0 : pageStart + 1}
                to={Math.min(pageStart + PAGE_SIZE, filtered.length)}
                total={filtered.length}
                page={safePage}
                totalPages={totalPages}
                onPage={setPage}
              />
            </section>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <RiskDonut
            total={summary?.totalSecrets ?? 0}
            byRisk={byRisk}
            loading={isBooting}
          />
          <TypeBreakdown byType={byType} total={summary?.totalSecrets ?? 0} />
          <RecentActivity items={recentActivity} />
        </aside>
      </div>

      {editor ? (
        <SecretEditorModal
          mode={editor.mode}
          secret={editor.secret}
          defaultType={editor.type ?? "credential"}
          vaults={vaults.map((v) => ({ id: v.id, name: v.name }))}
          busy={createSecret.isPending || updateSecret.isPending}
          onClose={() => setEditor(null)}
          onSubmit={async (payload) => {
            try {
              if (editor.mode === "create") {
                await createSecret.mutateAsync(payload);
                toast.success("Secret created", payload.name);
              } else if (editor.secret) {
                await updateSecret.mutateAsync({
                  secretId: editor.secret.id,
                  payload: {
                    name: payload.name,
                    description: payload.description,
                    type: payload.type,
                    riskLevel: payload.riskLevel,
                    vaultId: payload.vaultId,
                    value: payload.value || undefined,
                    expiresAt: payload.expiresAt,
                  },
                });
                toast.success("Secret updated", payload.name);
              }
              setEditor(null);
            } catch (err) {
              const planToast = planLimitErrorToast(err);
              if (planToast) {
                toast.warning(planToast.title, planToast.message);
                return;
              }
              toast.error(
                editor.mode === "create"
                  ? "Could not create secret"
                  : "Could not update secret",
                err instanceof ApiError ? err.message : "Try again.",
              );
            }
          }}
        />
      ) : null}

      {revealTarget ? (
        <RevealModal
          name={revealTarget.secret.name}
          value={revealTarget.value}
          onClose={() => setRevealTarget(null)}
        />
      ) : null}

      {requestTarget ? (
        <RequestAccessModal
          secretId={requestTarget.id}
          secretName={requestTarget.name}
          vaultName={requestTarget.vault.name}
          busy={createAccessRequest.isPending}
          onClose={() => setRequestTarget(null)}
          onSubmit={async (payload) => {
            try {
              await createAccessRequest.mutateAsync(payload);
              toast.success(
                "Request sent",
                "Owner/Admin will review your request. You'll get a notification.",
              );
              setRequestTarget(null);
            } catch (err) {
              toast.error(
                "Could not submit request",
                err instanceof ApiError ? err.message : "Try again.",
              );
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete secret?"
        description={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? The encrypted value will be permanently removed.`
            : ""
        }
        confirmLabel="Delete secret"
        danger
        loading={deleteSecret.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />

      {stepUpModal}
    </div>
  );
}

function SecretEditorModal({
  mode,
  secret,
  defaultType,
  vaults,
  busy,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  secret?: OrganizationSecret;
  defaultType: SecretType;
  vaults: { id: string; name: string }[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    vaultId: string;
    name: string;
    description: string;
    type: SecretType;
    riskLevel: SecretRiskLevel;
    value: string;
    expiresAt: string | null;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(secret?.name ?? "");
  const [description, setDescription] = useState(secret?.description ?? "");
  const [type, setType] = useState<SecretType>(secret?.type ?? defaultType);
  const [riskLevel, setRiskLevel] = useState<SecretRiskLevel>(
    secret?.riskLevel ?? "unknown",
  );
  const [vaultId, setVaultId] = useState(
    secret?.vault.id ?? vaults[0]?.id ?? "",
  );
  const [value, setValue] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    secret?.expiresAt ? secret.expiresAt.slice(0, 10) : "",
  );
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vaultId) {
      setFormError("Select a vault.");
      return;
    }
    if (name.trim().length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }
    if (mode === "create" && !value) {
      setFormError("Secret value is required.");
      return;
    }
    setFormError(null);
    await onSubmit({
      vaultId,
      name: name.trim(),
      description: description.trim(),
      type,
      riskLevel,
      value,
      expiresAt: expiresAt
        ? new Date(`${expiresAt}T23:59:59.000Z`).toISOString()
        : null,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {mode === "create" ? "Create Secret" : "Edit Secret"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-text-muted hover:text-text-primary"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={160}
              placeholder="e.g. AWS Production Access"
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-sm border border-border-default bg-background-secondary px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Vault
              </span>
              <select
                value={vaultId}
                onChange={(e) => setVaultId(e.target.value)}
                className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-2.5 text-[13px] text-text-primary outline-none focus:border-brand-primary"
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                Type
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SecretType)}
                className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-2.5 text-[13px] text-text-primary outline-none focus:border-brand-primary"
              >
                {(Object.keys(TYPE_LABELS) as SecretType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-[12px] font-medium text-text-secondary">
              Risk level
            </legend>
            <div className="flex flex-wrap gap-2">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRiskLevel(opt.value)}
                  className={`inline-flex h-9 items-center rounded-sm border px-2.5 text-[12px] font-medium ${
                    riskLevel === opt.value
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-border-default text-text-secondary"
                  }`}
                >
                  <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${opt.className}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              {mode === "create" ? "Secret value" : "New value (optional)"}
            </span>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="new-password"
              placeholder={
                mode === "create"
                  ? "Stored encrypted — never in plaintext in the database"
                  : "Leave blank to keep current value"
              }
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 font-mono text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Expires on (optional)
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary"
            />
          </label>
          {formError ? (
            <p className="text-[12px] text-danger">{formError}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-9 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary disabled:opacity-60"
            >
              {busy ? "Saving…" : mode === "create" ? "Create secret" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevealModal({
  name,
  value,
  onClose,
}: {
  name: string;
  value: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-md border border-border-subtle bg-surface-card p-5 shadow-card"
      >
        <h2 className="text-[15px] font-semibold text-text-primary">
          Revealed: {name}
        </h2>
        <p className="mt-1 text-[12px] text-warning">
          Treat this value as sensitive. It will not stay on screen.
        </p>
        <pre className="mt-3 max-h-40 overflow-auto rounded-sm border border-border-subtle bg-background-secondary p-3 font-mono text-[12px] break-all whitespace-pre-wrap text-text-primary">
          {value}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                toast.success("Copied", "Value copied to clipboard.");
              } catch {
                toast.error("Could not copy", "Clipboard was blocked.");
              }
            }}
            className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function TypeIcon({ type }: { type: SecretType }) {
  const map: Record<SecretType, { bg: string; icon: ReactNode }> = {
    credential: {
      bg: "bg-brand-primary/15 text-brand-primary",
      icon: <IconSecurity className="h-3.5 w-3.5" />,
    },
    api_key: {
      bg: "bg-info/15 text-info",
      icon: <IconKey className="h-3.5 w-3.5" />,
    },
    database: {
      bg: "bg-purple/15 text-purple",
      icon: <IconVault className="h-3.5 w-3.5" />,
    },
    token: {
      bg: "bg-surface-elevated text-text-secondary",
      icon: <IconLock className="h-3.5 w-3.5" />,
    },
    key_pair: {
      bg: "bg-surface-elevated text-text-secondary",
      icon: <IconKey className="h-3.5 w-3.5" />,
    },
    other: {
      bg: "bg-surface-elevated text-text-muted",
      icon: <IconLock className="h-3.5 w-3.5" />,
    },
  };
  const tone = map[type];
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${tone.bg}`}
    >
      {tone.icon}
    </span>
  );
}

function TypeBadge({ type }: { type: SecretType }) {
  const map: Record<SecretType, string> = {
    credential: "bg-brand-primary/15 text-brand-primary",
    api_key: "bg-info/15 text-info",
    database: "bg-purple/15 text-purple",
    token: "bg-surface-elevated text-text-secondary",
    key_pair: "bg-surface-elevated text-text-secondary",
    other: "bg-surface-elevated text-text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${map[type]}`}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

function RiskBadge({ level }: { level: SecretRiskLevel }) {
  const map: Record<SecretRiskLevel, string> = {
    high: "bg-danger/15 text-danger",
    medium: "bg-warning/15 text-warning",
    low: "bg-brand-primary/15 text-brand-primary",
    unknown: "bg-surface-elevated text-text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold capitalize ${map[level]}`}
    >
      {level}
    </span>
  );
}

function vaultDot(color: string) {
  const map: Record<string, string> = {
    brand: "bg-brand-primary",
    purple: "bg-purple",
    info: "bg-info",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return map[color] ?? "bg-brand-primary";
}

function RiskDonut({
  total,
  byRisk,
  loading,
}: {
  total: number;
  byRisk?: Record<SecretRiskLevel, number>;
  loading: boolean;
}) {
  const high = byRisk?.high ?? 0;
  const medium = byRisk?.medium ?? 0;
  const low = byRisk?.low ?? 0;
  const unknown = byRisk?.unknown ?? 0;
  const safeTotal = Math.max(total, 1);
  const pHigh = (high / safeTotal) * 100;
  const pMed = (medium / safeTotal) * 100;
  const pLow = (low / safeTotal) * 100;

  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
      <h3 className="text-[13px] font-semibold text-text-primary">
        Secrets by Risk Level
      </h3>
      <div className="mt-4 flex flex-col items-center">
        <div
          className="relative h-36 w-36 rounded-full"
          style={{
            background: loading
              ? "var(--color-surface-elevated)"
              : `conic-gradient(
                  var(--color-danger) 0 ${pHigh}%,
                  var(--color-warning) ${pHigh}% ${pHigh + pMed}%,
                  var(--color-brand-primary) ${pHigh + pMed}% ${pHigh + pMed + pLow}%,
                  var(--color-text-muted) ${pHigh + pMed + pLow}% 100%
                )`,
          }}
        >
          <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-surface-card">
            <span className="text-[1.25rem] font-bold text-text-primary">
              {loading ? "—" : total}
            </span>
            <span className="text-[11px] text-text-muted">Total</span>
          </div>
        </div>
        <ul className="mt-4 w-full space-y-1.5 text-[12px]">
          <LegendRow color="bg-danger" label="High" value={high} />
          <LegendRow color="bg-warning" label="Medium" value={medium} />
          <LegendRow color="bg-brand-primary" label="Low" value={low} />
          <LegendRow color="bg-text-muted" label="Unknown" value={unknown} />
        </ul>
      </div>
    </div>
  );
}

function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <li className="flex items-center justify-between text-text-secondary">
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-semibold text-text-primary">{value}</span>
    </li>
  );
}

function TypeBreakdown({
  byType,
  total,
}: {
  byType?: Record<SecretType, number>;
  total: number;
}) {
  const rows = (Object.keys(TYPE_LABELS) as SecretType[]).map((type) => {
    const count = byType?.[type] ?? 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return { type, count, pct };
  });

  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
      <h3 className="text-[13px] font-semibold text-text-primary">
        Secrets by Type
      </h3>
      <ul className="mt-3 space-y-2.5">
        {rows.map((row) => (
          <li key={row.type} className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-[12px] text-text-secondary">
              <TypeIcon type={row.type} />
              {TYPE_LABELS[row.type]}
            </span>
            <span className="text-[12px] text-text-muted">
              <span className="font-semibold text-text-primary">{row.count}</span>{" "}
              ({row.pct}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecentActivity({
  items,
}: {
  items: {
    id: string;
    secretName: string;
    action: string;
    actorName: string;
    at: string;
  }[];
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
      <h3 className="text-[13px] font-semibold text-text-primary">
        Recent Activity
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-[12px] text-text-muted">No activity yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
                <IconLock className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-text-primary">
                  {item.secretName}
                </p>
                <p className="text-[11px] text-text-muted">
                  {item.action === "accessed" ? "Accessed" : "Updated"} by{" "}
                  {item.actorName} · {formatRelative(item.at)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[12px] font-semibold text-brand-primary">
        View all activity
      </p>
    </div>
  );
}

function PaginationFooter({
  from,
  to,
  total,
  page,
  totalPages,
  onPage,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3">
      <p className="text-[12px] text-text-muted">
        Showing {from} to {to} of {total} secrets
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary disabled:opacity-40"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[12px] font-semibold ${
              p === page
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border-default text-text-secondary"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  hint: ReactNode;
  icon: ReactNode;
  iconBg: string;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${iconBg}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-text-muted">{label}</p>
          <p className="mt-0.5 text-[1.5rem] font-bold tracking-tight text-text-primary">
            {value}
          </p>
          <div className="mt-0.5 text-[11px] text-text-secondary">{hint}</div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card px-6 py-16 text-center shadow-card">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
        <IconLock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-[1.125rem] font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-text-secondary">
        {body}
      </p>
      {action}
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
