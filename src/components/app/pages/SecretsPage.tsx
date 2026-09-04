"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
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
import { ConfirmDialog, type ActionItem } from "../RowActionsMenu";
import { RequestAccessModal } from "../RequestAccessModal";
import { useStepUpGate } from "../../security/ReauthModal";
import { toast } from "../../../stores/toast-store";
import {
  FilterChip,
  NewSecretButton,
  RISK_OPTIONS,
  RISK_RANK,
  SecretsActivity,
  SecretsAttentionBar,
  SecretsEmptyState,
  SecretsErrorState,
  SecretsInventory,
  SecretsPagination,
  SecretsSkeleton,
  SecretsToolbar,
  TYPE_LABELS,
  type SecretSortKey,
} from "../secrets/secrets-ui";
import { IconAlert, IconPlus } from "../icons";

const PAGE_SIZE = 12;

/**
 * Secrets inventory — encrypted metadata list.
 * Plaintext never appears in the list; reveal uses HIGH step-up.
 */
export function SecretsPage() {
  const { can, user, role } = useRequiredWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = useId();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const canCreateByPlan =
    entitlementsQuery.data?.capabilities.createSecret ?? true;
  const canCreatePermission =
    isOwnerOrAdminRole(role) && can("secret.create");
  const canCreate = canCreatePermission && canCreateByPlan;
  const canUpdate = can("secret.update");
  const canDelete = can("secret.delete");
  const isReviewer = isOwnerOrAdminRole(role);
  const canRequestAccess = !isReviewer;
  const canViewAudit =
    entitlementsQuery.data?.capabilities.viewAuditLogs ?? false;

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
  const [vaultFilter, setVaultFilter] = useState(
    () => searchParams.get("vault")?.trim() || "all",
  );
  const [typeFilter, setTypeFilter] = useState<SecretType | "all">("all");
  const [riskFilter, setRiskFilter] = useState<SecretRiskLevel | "all">("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">(
    "all",
  );
  const [sort, setSort] = useState<SecretSortKey>("updated");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const vaultFromUrl = searchParams.get("vault")?.trim() || "";

  useEffect(() => {
    if (!vaultFromUrl) return;
    setVaultFilter(vaultFromUrl);
    setPage(1);
  }, [vaultFromUrl]);

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
    const list = secrets.filter((s) => {
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

    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "risk") {
        return RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel];
      }
      if (sort === "accessed") {
        const ta = a.lastAccessedAt
          ? new Date(a.lastAccessedAt).getTime()
          : 0;
        const tb = b.lastAccessedAt
          ? new Date(b.lastAccessedAt).getTime()
          : 0;
        return tb - ta;
      }
      return (
        new Date(b.lastUpdatedAt).getTime() -
        new Date(a.lastUpdatedAt).getTime()
      );
    });

    return list;
  }, [
    secrets,
    query,
    vaultFilter,
    typeFilter,
    riskFilter,
    ownerFilter,
    statusFilter,
    sort,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const activeFilterCount = [
    vaultFilter !== "all",
    typeFilter !== "all",
    riskFilter !== "all",
    ownerFilter !== "all",
    statusFilter !== "all",
  ].filter(Boolean).length;
  const filtersActive = activeFilterCount > 0 || query.trim().length > 0;

  function clearFilters() {
    setVaultFilter("all");
    setTypeFilter("all");
    setRiskFilter("all");
    setOwnerFilter("all");
    setStatusFilter("all");
    setQuery("");
    setPage(1);
  }

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
          if (
            secret &&
            canRequestAccess &&
            !isAccessBlocked &&
            !secret.hasPendingAccessRequest
          ) {
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
    } catch (err) {
      toast.error(
        "Could not delete secret",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  function rowActions(secret: OrganizationSecret): ActionItem[] {
    const items: ActionItem[] = [];
    if (canUpdate) {
      items.push({
        id: "edit",
        label: "Edit metadata",
        onSelect: () => openEdit(secret),
      });
    }
    if (canDelete) {
      items.push({
        id: "delete",
        label: "Delete",
        tone: "danger",
        onSelect: () => setDeleteTarget(secret),
      });
    }
    return items;
  }

  if (error) {
    return (
      <SecretsErrorState
        message={
          error instanceof ApiError
            ? error.message
            : "Check your connection and try again."
        }
        onRetry={() => void secretsQuery.refetch()}
      />
    );
  }

  const filterSelectClass =
    "h-11 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] font-medium text-text-secondary outline-none focus:border-brand-primary focus:shadow-focus";

  return (
    <div className="space-y-8 p-4 lg:p-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-section font-semibold tracking-tight text-text-primary">
            Secrets
          </h1>
          <p className="mt-1 text-small text-text-secondary">
            Encrypted company credentials. Values stay sealed until a controlled
            reveal — never in this list, logs, or URLs.
          </p>
        </div>
        {canCreatePermission ? (
          <NewSecretButton onClick={() => openCreate()} />
        ) : null}
      </header>

      {entitlementsQuery.data && !canCreateByPlan && canCreatePermission ? (
        <PlanUpgradePrompt
          title="Secret limit reached"
          description={`Your ${entitlementsQuery.data.planLabel} plan allows ${formatPlanLimit(entitlementsQuery.data.entitlements.maxSecrets)} secret(s). You are using ${formatPlanUsage(entitlementsQuery.data.usage.secrets, entitlementsQuery.data.entitlements.maxSecrets)}. Upgrade to store more.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      {isAccessBlocked ? (
        <div
          className="flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3"
          role="status"
        >
          <IconAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-[13px] font-semibold text-text-primary">
              Reveal and access requests paused
            </p>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              After 3 consecutive denials, requests are blocked until{" "}
              {formatBlockUntil(accessBlock?.blockedUntil)}.
            </p>
          </div>
        </div>
      ) : null}

      {!isBooting ? (
        <SecretsAttentionBar
          total={summary?.totalSecrets ?? secrets.length}
          highRisk={summary?.highRiskSecrets ?? 0}
          expired={summary?.expiredSecrets ?? 0}
          filteredCount={filtered.length}
          filtersActive={filtersActive}
          onHighRisk={() => {
            setRiskFilter("high");
            setFiltersOpen(true);
            setPage(1);
          }}
          onExpired={() => {
            setStatusFilter("expired");
            setFiltersOpen(true);
            setPage(1);
          }}
        />
      ) : null}

      <div className="space-y-3">
        <SecretsToolbar
          query={query}
          onQuery={(value) => {
            setQuery(value);
            setPage(1);
          }}
          sort={sort}
          onSort={(value) => {
            setSort(value);
            setPage(1);
          }}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((o) => !o)}
          activeFilterCount={activeFilterCount}
          searchId={searchId}
        />

        {filtersOpen ? (
          <div className="rounded-md border border-border-subtle bg-surface-card p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <label className="block">
                <span className="mb-1.5 block text-label text-text-secondary">
                  Vault
                </span>
                <select
                  value={vaultFilter}
                  onChange={(e) => {
                    setVaultFilter(e.target.value);
                    setPage(1);
                  }}
                  className={filterSelectClass}
                >
                  <option value="all">All vaults</option>
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-label text-text-secondary">
                  Type
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as SecretType | "all");
                    setPage(1);
                  }}
                  className={filterSelectClass}
                >
                  <option value="all">All types</option>
                  {(Object.keys(TYPE_LABELS) as SecretType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-label text-text-secondary">
                  Risk
                </span>
                <select
                  value={riskFilter}
                  onChange={(e) => {
                    setRiskFilter(e.target.value as SecretRiskLevel | "all");
                    setPage(1);
                  }}
                  className={filterSelectClass}
                >
                  <option value="all">All risk levels</option>
                  {RISK_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-label text-text-secondary">
                  Owner
                </span>
                <select
                  value={ownerFilter}
                  onChange={(e) => {
                    setOwnerFilter(e.target.value);
                    setPage(1);
                  }}
                  className={filterSelectClass}
                >
                  <option value="all">All owners</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-label text-text-secondary">
                  Status
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | "active" | "expired");
                    setPage(1);
                  }}
                  className={filterSelectClass}
                >
                  <option value="all">Active and expired</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {vaultFilter !== "all" ? (
              <FilterChip
                label={`Vault: ${vaults.find((v) => v.id === vaultFilter)?.name ?? "Selected"}`}
                onClear={() => {
                  setVaultFilter("all");
                  setPage(1);
                }}
              />
            ) : null}
            {typeFilter !== "all" ? (
              <FilterChip
                label={TYPE_LABELS[typeFilter]}
                onClear={() => {
                  setTypeFilter("all");
                  setPage(1);
                }}
              />
            ) : null}
            {riskFilter !== "all" ? (
              <FilterChip
                label={`Risk: ${riskFilter}`}
                onClear={() => {
                  setRiskFilter("all");
                  setPage(1);
                }}
              />
            ) : null}
            {ownerFilter !== "all" ? (
              <FilterChip
                label={`Owner: ${owners.find((o) => o.id === ownerFilter)?.name ?? "Selected"}`}
                onClear={() => {
                  setOwnerFilter("all");
                  setPage(1);
                }}
              />
            ) : null}
            {statusFilter !== "all" ? (
              <FilterChip
                label={statusFilter === "expired" ? "Expired" : "Active"}
                onClear={() => {
                  setStatusFilter("all");
                  setPage(1);
                }}
              />
            ) : null}
            <button
              type="button"
              onClick={clearFilters}
              className="h-8 px-2 text-[12px] font-medium text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </div>

      {isBooting ? (
        <SecretsSkeleton />
      ) : filtered.length === 0 ? (
        <SecretsEmptyState
          title={secrets.length === 0 ? "No secrets in this organization" : "No matching secrets"}
          body={
            secrets.length === 0
              ? canCreatePermission
                ? vaults.length === 0
                  ? "Create a vault first, then store credentials, API keys, and other company secrets inside it."
                  : "Add the first secret to a vault. The value is encrypted before it leaves this browser."
                : "No secrets have been stored yet. An Owner or Admin can create them for this organization."
              : "Try a different search, or clear filters to see the full inventory."
          }
          action={
            secrets.length === 0 && canCreate ? (
              <button
                type="button"
                onClick={() => openCreate()}
                className="mt-4 inline-flex h-11 items-center gap-2 rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
              >
                <IconPlus className="h-4 w-4" />
                New secret
              </button>
            ) : secrets.length > 0 ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 inline-flex h-11 items-center rounded-sm border border-border-default px-4 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-surface-card max-md:border-0 max-md:bg-transparent">
          <SecretsInventory
            rows={pageRows}
            isAccessBlocked={isAccessBlocked}
            canRequestAccess={canRequestAccess}
            onReveal={(secret) => void onReveal(secret)}
            rowActions={rowActions}
          />
          <div className="max-md:mt-3 max-md:overflow-hidden max-md:rounded-md max-md:border max-md:border-border-subtle max-md:bg-surface-card">
            <SecretsPagination
              from={filtered.length === 0 ? 0 : pageStart + 1}
              to={Math.min(pageStart + PAGE_SIZE, filtered.length)}
              total={filtered.length}
              page={safePage}
              totalPages={totalPages}
              onPage={setPage}
            />
          </div>
        </div>
      )}

      <SecretsActivity items={recentActivity} canViewAudit={canViewAudit} />

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
          vaultName={revealTarget.secret.vault.name}
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
            ? `Delete “${deleteTarget.name}”? The encrypted value will be permanently removed. This cannot be undone.`
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
  const titleId = useId();
  const inputClass =
    "h-12 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

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
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 id={titleId} className="text-[15px] font-semibold text-text-primary">
              {mode === "create" ? "New secret" : "Edit secret"}
            </h2>
            <p className="mt-0.5 text-[12px] text-text-muted">
              The value is encrypted before storage. It never appears in the
              inventory list.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] font-medium text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
          >
            Close
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="max-h-[80vh] space-y-4 overflow-y-auto p-5"
        >
          <label className="block">
            <span className="mb-1.5 block text-label text-text-secondary">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              maxLength={160}
              placeholder="e.g. AWS Production Access"
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-label text-text-secondary">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-sm border border-border-default bg-background-secondary px-3 py-3 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-label text-text-secondary">
                Vault
              </span>
              <select
                value={vaultId}
                onChange={(e) => setVaultId(e.target.value)}
                className={inputClass}
              >
                {vaults.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-label text-text-secondary">
                Type
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as SecretType)}
                className={inputClass}
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
            <legend className="mb-1.5 text-label text-text-secondary">
              Risk level
            </legend>
            <div className="flex flex-wrap gap-2">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRiskLevel(opt.value)}
                  className={`inline-flex h-10 items-center rounded-sm border px-2.5 text-[12px] font-medium focus-visible:outline-none focus-visible:shadow-focus ${
                    riskLevel === opt.value
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-border-default text-text-secondary"
                  }`}
                >
                  <span
                    className={`rounded-xs px-1.5 py-0.5 text-[10px] font-semibold ${opt.className}`}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="block">
            <span className="mb-1.5 block text-label text-text-secondary">
              {mode === "create" ? "Secret value" : "New value (optional)"}
            </span>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="new-password"
              placeholder={
                mode === "create"
                  ? "Encrypted at rest — never stored as plaintext"
                  : "Leave blank to keep the current value"
              }
              className={`${inputClass} font-mono`}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-label text-text-secondary">
              Expires on (optional)
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={inputClass}
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
              className="h-11 rounded-sm border border-border-default px-4 text-[13px] font-semibold text-text-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
            >
              {busy
                ? "Saving…"
                : mode === "create"
                  ? "Create secret"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RevealModal({
  name,
  vaultName,
  value,
  onClose,
}: {
  name: string;
  vaultName: string;
  value: string;
  onClose: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [hidden, setHidden] = useState(false);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(interval);
          onCloseRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-lg border border-warning/30 bg-surface-elevated p-5 shadow-elevated"
      >
        <p className="text-[11px] font-semibold tracking-wide text-warning uppercase">
          Sensitive value · closes in {secondsLeft}s
        </p>
        <h2 id={titleId} className="mt-1 text-[15px] font-semibold text-text-primary">
          {name}
        </h2>
        <p className="text-[12px] text-text-muted">{vaultName}</p>
        <p className="mt-3 text-[12px] text-text-secondary">
          This is a temporary view. It is not written to logs, the URL, or local
          storage. Clear your clipboard after copying.
        </p>
        <pre className="mt-3 max-h-40 overflow-auto rounded-sm border border-border-subtle bg-background-secondary p-3 font-mono text-[12px] break-all whitespace-pre-wrap text-text-primary">
          {hidden ? "••••••••••••••••" : value}
        </pre>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            className="h-11 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
          >
            {hidden ? "Show" : "Hide"}
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(value);
                toast.success(
                  "Copied",
                  "Clear the clipboard when you are finished.",
                );
              } catch {
                toast.error("Could not copy", "Clipboard was blocked.");
              }
            }}
            className="h-11 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
          >
            Copy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            Hide now
          </button>
        </div>
      </div>
    </div>
  );
}
