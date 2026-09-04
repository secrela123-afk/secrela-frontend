"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ApiError,
  type OrganizationVault,
  type VaultColor,
  type VaultRiskLevel,
} from "../../../lib/api";
import {
  useCreateVaultMutation,
  useDeleteVaultMutation,
  useUpdateVaultMutation,
  useVaultsQuery,
} from "../../../hooks/queries/useVaultsQuery";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { isQueryBooting } from "../../../lib/query-status";
import {
  formatPlanLimit,
  formatPlanUsage,
  planLimitErrorToast,
} from "../../../lib/plan-entitlements";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import { ConfirmDialog, RowActionsMenu, type ActionItem } from "../RowActionsMenu";
import {
  IconAlert,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconGridView,
  IconListView,
  IconLock,
  IconPlus,
  IconSearch,
  IconVault,
  IconX,
} from "../icons";
import { toast } from "../../../stores/toast-store";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "risk";
type ViewMode = "list" | "grid";

const PAGE_SIZE = 8;

const RISK_RANK: Record<VaultRiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

const RISK_OPTIONS: {
  value: VaultRiskLevel;
  label: string;
  className: string;
}[] = [
  {
    value: "unknown",
    label: "Unknown",
    className: "bg-surface-elevated text-text-muted",
  },
  {
    value: "low",
    label: "Low",
    className: "bg-brand-primary/15 text-brand-primary",
  },
  {
    value: "medium",
    label: "Medium",
    className: "bg-warning/15 text-warning",
  },
  {
    value: "high",
    label: "High",
    className: "bg-danger/15 text-danger",
  },
];

const RISK_HELP: Record<VaultRiskLevel, string> = {
  unknown: "Not assessed yet. Use this until production impact is clear.",
  low: "Routine or non-production material. Limited blast radius.",
  medium: "Internal systems. A leak would disrupt operations.",
  high: "Production or customer-impacting. Treat every access as sensitive.",
};

/**
 * Vault directory — find a container, judge its posture, open the secrets inside.
 * Org-wide member lists are not shown per vault (that data is not vault-scoped).
 */
export function VaultsPage() {
  const router = useRouter();
  const { can } = useRequiredWorkspace();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const canCreateByPlan =
    entitlementsQuery.data?.capabilities.createVault ?? true;
  const canCreate = can("vault.create") && canCreateByPlan;
  const canUpdate = can("vault.update");
  const canDelete = can("vault.delete");
  const canOpenSecrets = can("secret.read");

  const vaultsQuery = useVaultsQuery();
  const { data, error } = vaultsQuery;
  const isBooting = isQueryBooting(vaultsQuery);
  const createVault = useCreateVaultMutation();
  const updateVault = useUpdateVaultMutation();
  const deleteVault = useDeleteVaultMutation();

  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<VaultRiskLevel | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    vault?: OrganizationVault;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizationVault | null>(
    null,
  );
  const [blockedDelete, setBlockedDelete] = useState<OrganizationVault | null>(
    null,
  );

  const vaults = data?.vaults ?? [];
  const summary = data?.summary;

  const highRiskVaultCount = useMemo(
    () => vaults.filter((v) => v.riskLevel === "high").length,
    [vaults],
  );
  const emptyVaultCount = useMemo(
    () => vaults.filter((v) => v.secretCount === 0).length,
    [vaults],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = vaults.filter((v) => {
      if (riskFilter !== "all" && v.riskLevel !== riskFilter) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      );
    });

    rows = [...rows].sort((a, b) => {
      if (sort === "risk") {
        const diff = RISK_RANK[a.riskLevel] - RISK_RANK[b.riskLevel];
        if (diff !== 0) return diff;
        return (
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime()
        );
      }
      if (sort === "newest") {
        return (
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime()
        );
      }
      if (sort === "oldest") {
        return (
          new Date(a.lastUpdatedAt).getTime() -
          new Date(b.lastUpdatedAt).getTime()
        );
      }
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      return b.name.localeCompare(a.name);
    });

    return rows;
  }, [vaults, query, riskFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const filtersActive = riskFilter !== "all" || query.trim().length > 0;

  function secretsHref(vaultId: string) {
    return `/app/secrets?vault=${encodeURIComponent(vaultId)}`;
  }

  function openCreate() {
    if (!can("vault.create")) {
      toast.warning(
        "Permission required",
        "You need permission to create vaults.",
      );
      return;
    }
    if (!canCreateByPlan) {
      toast.warning(
        "Plan limit",
        entitlementsQuery.data?.upgradePlanLabel
          ? `Upgrade to ${entitlementsQuery.data.upgradePlanLabel} to create more vaults.`
          : "Your plan vault limit has been reached.",
      );
      return;
    }
    setEditor({ mode: "create" });
  }

  function openEdit(vault: OrganizationVault) {
    if (!canUpdate) {
      toast.warning(
        "Permission required",
        "You need permission to update vaults.",
      );
      return;
    }
    setEditor({ mode: "edit", vault });
  }

  function openDelete(vault: OrganizationVault) {
    if (!canDelete) {
      toast.warning(
        "Permission required",
        "You need permission to delete vaults.",
      );
      return;
    }
    if (vault.secretCount > 0) {
      setBlockedDelete(vault);
      return;
    }
    setDeleteTarget(vault);
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteVault.mutateAsync(deleteTarget.id);
      toast.success("Vault deleted", `${deleteTarget.name} was removed.`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        "Could not delete vault",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  function rowActions(vault: OrganizationVault) {
    return [
      ...(canOpenSecrets
        ? [
            {
              id: "open",
              label: "Open secrets",
              tone: "brand" as const,
              onSelect: () => router.push(secretsHref(vault.id)),
            },
          ]
        : []),
      ...(canUpdate
        ? [
            {
              id: "edit",
              label: "Edit vault",
              onSelect: () => openEdit(vault),
            },
          ]
        : []),
      ...(canDelete
        ? [
            {
              id: "delete",
              label:
                vault.secretCount > 0 ? "Delete vault…" : "Delete vault",
              tone: "danger" as const,
              onSelect: () => openDelete(vault),
            },
          ]
        : []),
    ];
  }

  if (error) {
    return (
      <div className="p-4 lg:px-8 lg:py-6">
        <PageIntro canCreate={false} onCreate={openCreate} />
        <div className="rounded-md border border-danger/30 bg-danger/5 px-5 py-8 text-center">
          <p className="text-[15px] font-semibold text-text-primary">
            Could not load vaults
          </p>
          <p className="mx-auto mt-2 max-w-md text-small text-text-secondary">
            {error instanceof ApiError
              ? error.message
              : "Check your connection and try again."}
          </p>
          <button
            type="button"
            onClick={() => void vaultsQuery.refetch()}
            className="mt-4 inline-flex h-10 items-center rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:px-8 lg:py-6">
      <PageIntro
        canCreate={canCreate}
        planBlocked={can("vault.create") && !canCreateByPlan}
        onCreate={openCreate}
      />

      {entitlementsQuery.data &&
      !canCreateByPlan &&
      can("vault.create") ? (
        <PlanUpgradePrompt
          className="mb-6"
          title="Vault limit reached"
          description={`Your ${entitlementsQuery.data.planLabel} plan allows ${formatPlanLimit(entitlementsQuery.data.entitlements.maxVaults)} vault(s). You are using ${formatPlanUsage(entitlementsQuery.data.usage.vaults, entitlementsQuery.data.entitlements.maxVaults)}. Upgrade to create more.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      {!isBooting && highRiskVaultCount > 0 && riskFilter !== "high" ? (
        <button
          type="button"
          onClick={() => {
            setRiskFilter("high");
            setPage(1);
          }}
          className="mb-6 flex w-full items-start gap-3 rounded-md border border-danger/25 bg-danger/5 px-4 py-3 text-left transition-colors hover:border-danger/40 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <span className="mt-0.5 text-danger">
            <IconAlert className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-text-primary">
              {highRiskVaultCount} vault
              {highRiskVaultCount === 1 ? "" : "s"} marked high risk
            </span>
            <span className="mt-0.5 block text-[12px] text-text-secondary">
              Production-impacting containers. Filter the directory to review
              them first.
            </span>
          </span>
          <span className="shrink-0 text-[12px] font-semibold text-danger">
            Show high risk
          </span>
        </button>
      ) : null}

      <InventoryStrip
        loading={isBooting}
        vaults={summary?.totalVaults ?? 0}
        secrets={summary?.totalSecrets ?? 0}
        highRiskVaults={highRiskVaultCount}
        expiring={summary?.expiringSoon ?? 0}
        empty={emptyVaultCount}
        onHighRisk={() => {
          setRiskFilter("high");
          setPage(1);
        }}
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
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
            placeholder="Search by vault name or description"
            aria-label="Search vaults"
            className="h-11 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RiskChips
            value={riskFilter}
            counts={{
              all: vaults.length,
              high: vaults.filter((v) => v.riskLevel === "high").length,
              medium: vaults.filter((v) => v.riskLevel === "medium").length,
              low: vaults.filter((v) => v.riskLevel === "low").length,
              unknown: vaults.filter((v) => v.riskLevel === "unknown").length,
            }}
            onChange={(level) => {
              setRiskFilter(level);
              setPage(1);
            }}
          />

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortKey);
              setPage(1);
            }}
            aria-label="Sort vaults"
            className="h-11 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary focus:shadow-focus"
          >
            <option value="newest">Recently updated</option>
            <option value="oldest">Oldest first</option>
            <option value="risk">Highest risk</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>

          <div
            className="inline-flex h-11 overflow-hidden rounded-sm border border-border-default bg-background-secondary"
            role="group"
            aria-label="Directory layout"
          >
            <button
              type="button"
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              className={`inline-flex h-full w-11 items-center justify-center transition-colors duration-150 ${
                view === "list"
                  ? "bg-surface-elevated text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <IconListView className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              className={`inline-flex h-full w-11 items-center justify-center border-l border-border-default transition-colors duration-150 ${
                view === "grid"
                  ? "bg-surface-elevated text-text-primary"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <IconGridView className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtersActive ? (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-text-secondary">
          <span>
            {filtered.length} match{filtered.length === 1 ? "" : "es"}
            {query.trim() ? ` for “${query.trim()}”` : ""}
          </span>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setRiskFilter("all");
              setPage(1);
            }}
            className="font-semibold text-brand-primary hover:text-brand-primary-hover"
          >
            Clear
          </button>
        </div>
      ) : null}

      {isBooting ? (
        <VaultsSkeleton view={view} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={vaults.length === 0 ? "No vaults yet" : "No matching vaults"}
          body={
            vaults.length === 0
              ? "Create a vault for an environment or team — Production, Staging, or Finance — then add secrets inside it."
              : "Nothing matches this search or risk filter."
          }
          action={
            vaults.length === 0 && canCreate ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
              >
                <IconPlus className="h-4 w-4" />
                Create vault
              </button>
            ) : vaults.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRiskFilter("all");
                  setPage(1);
                }}
                className="mt-5 inline-flex h-10 items-center rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary"
              >
                Clear filters
              </button>
            ) : null
          }
        />
      ) : view === "list" ? (
        <section className="overflow-hidden rounded-md border border-border-subtle bg-surface-card">
          <ul className="m-0 list-none divide-y divide-border-subtle p-0">
            {pageRows.map((vault) => (
              <VaultRow
                key={vault.id}
                vault={vault}
                href={canOpenSecrets ? secretsHref(vault.id) : null}
                actions={rowActions(vault)}
              />
            ))}
          </ul>
          <PaginationFooter
            from={filtered.length === 0 ? 0 : pageStart + 1}
            to={Math.min(pageStart + PAGE_SIZE, filtered.length)}
            total={filtered.length}
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                href={canOpenSecrets ? secretsHref(vault.id) : null}
                actions={rowActions(vault)}
              />
            ))}
          </div>
          <div className="mt-4">
            <PaginationFooter
              from={filtered.length === 0 ? 0 : pageStart + 1}
              to={Math.min(pageStart + PAGE_SIZE, filtered.length)}
              total={filtered.length}
              page={safePage}
              totalPages={totalPages}
              onPage={setPage}
              bordered
            />
          </div>
        </>
      )}

      {editor ? (
        <VaultEditorModal
          mode={editor.mode}
          vault={editor.vault}
          busy={createVault.isPending || updateVault.isPending}
          onClose={() => setEditor(null)}
          onSubmit={async (payload) => {
            try {
              if (editor.mode === "create") {
                await createVault.mutateAsync(payload);
                toast.success("Vault created", payload.name);
              } else if (editor.vault) {
                await updateVault.mutateAsync({
                  vaultId: editor.vault.id,
                  payload,
                });
                toast.success("Vault updated", payload.name);
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
                  ? "Could not create vault"
                  : "Could not update vault",
                err instanceof ApiError ? err.message : "Try again.",
              );
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this vault?"
        description={
          deleteTarget ? (
            <>
              <p>
                <span className="font-semibold text-text-primary">
                  {deleteTarget.name}
                </span>{" "}
                has no secrets. Deleting it cannot be undone.
              </p>
              <p className="mt-2 text-text-muted">
                If this name is reused later, it will be a new empty vault — not
                a recovery of the old one.
              </p>
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Delete vault"
        danger
        loading={deleteVault.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />

      <ConfirmDialog
        open={Boolean(blockedDelete)}
        title="Vault still contains secrets"
        description={
          blockedDelete ? (
            <>
              <p>
                <span className="font-semibold text-text-primary">
                  {blockedDelete.name}
                </span>{" "}
                holds {blockedDelete.secretCount} secret
                {blockedDelete.secretCount === 1 ? "" : "s"}. The API will
                refuse deletion until those are moved or deleted.
              </p>
              <p className="mt-2 text-text-muted">
                Open the vault, empty it, then delete it.
              </p>
            </>
          ) : (
            ""
          )
        }
        confirmLabel={canOpenSecrets ? "Open vault" : "Understood"}
        danger={false}
        onClose={() => setBlockedDelete(null)}
        onConfirm={() => {
          if (blockedDelete && canOpenSecrets) {
            router.push(secretsHref(blockedDelete.id));
          }
          setBlockedDelete(null);
        }}
      />
    </div>
  );
}

function PageIntro({
  canCreate,
  planBlocked = false,
  onCreate,
}: {
  canCreate: boolean;
  planBlocked?: boolean;
  onCreate: () => void;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-page font-semibold tracking-tight text-text-primary">
          Vaults
        </h1>
        <p className="mt-2 text-small text-text-secondary">
          Containers for company secrets. Open a vault to work with the
          credentials inside it — create, edit, or delete only when you have
          permission.
        </p>
      </div>
      {canCreate ? (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary shadow-glow-green transition-colors duration-150 hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus sm:self-auto"
        >
          <IconPlus className="h-4 w-4" />
          Create vault
        </button>
      ) : planBlocked ? (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 self-start rounded-sm border border-border-default px-4 text-[13px] font-semibold text-text-muted sm:self-auto"
        >
          <IconPlus className="h-4 w-4" />
          Vault limit reached
        </button>
      ) : null}
    </header>
  );
}

function InventoryStrip({
  loading,
  vaults,
  secrets,
  highRiskVaults,
  expiring,
  empty,
  onHighRisk,
}: {
  loading: boolean;
  vaults: number;
  secrets: number;
  highRiskVaults: number;
  expiring: number;
  empty: number;
  onHighRisk: () => void;
}) {
  return (
    <div className="mb-6 grid grid-cols-2 divide-x divide-y divide-border-subtle overflow-hidden rounded-md border border-border-subtle bg-surface-card md:grid-cols-4 md:divide-y-0">
      <StripCell
        label="Vaults"
        value={loading ? "—" : String(vaults)}
        hint={
          empty > 0 ? `${empty} empty` : "In this workspace"
        }
      />
      <StripCell
        label="Secrets"
        value={loading ? "—" : String(secrets)}
        hint="Stored across vaults"
        icon={<IconLock className="h-3.5 w-3.5" />}
      />
      <StripCell
        label="High-risk vaults"
        value={loading ? "—" : String(highRiskVaults)}
        hint={highRiskVaults > 0 ? "Needs review" : "None marked high"}
        tone={highRiskVaults > 0 ? "danger" : undefined}
        onClick={highRiskVaults > 0 ? onHighRisk : undefined}
      />
      <StripCell
        label="Expiring (30d)"
        value={loading ? "—" : String(expiring)}
        hint="Secrets nearing expiry"
        tone={expiring > 0 ? "warning" : undefined}
        icon={<IconClock className="h-3.5 w-3.5" />}
      />
    </div>
  );
}

function StripCell({
  label,
  value,
  hint,
  tone,
  icon,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "danger" | "warning";
  icon?: ReactNode;
  onClick?: () => void;
}) {
  const valueClass =
    tone === "danger"
      ? "text-danger"
      : tone === "warning"
        ? "text-warning"
        : "text-text-primary";
  const className = `w-full px-4 py-4 text-left ${
    onClick
      ? "transition-colors duration-150 hover:bg-surface-elevated/60 focus-visible:outline-none focus-visible:shadow-focus"
      : ""
  }`;

  const inner = (
    <>
      <p className="flex items-center gap-1.5 text-label font-medium text-text-muted">
        {icon}
        {label}
      </p>
      <p
        className={`mt-1 text-[1.5rem] font-semibold tracking-tight tabular-nums ${valueClass}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-text-muted">{hint}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

function RiskChips({
  value,
  counts,
  onChange,
}: {
  value: VaultRiskLevel | "all";
  counts: Record<VaultRiskLevel | "all", number>;
  onChange: (v: VaultRiskLevel | "all") => void;
}) {
  const chips: { id: VaultRiskLevel | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
    { id: "unknown", label: "Unknown" },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-1 rounded-sm border border-border-default bg-background-secondary p-1"
      role="group"
      aria-label="Filter by risk"
    >
      {chips.map((chip) => {
        const active = value === chip.id;
        const count = counts[chip.id];
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(chip.id)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-xs px-2.5 text-[12px] font-medium transition-colors duration-150 ${
              active
                ? "bg-surface-elevated text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {chip.label}
            <span
              className={`tabular-nums ${
                chip.id === "high" && count > 0
                  ? "text-danger"
                  : "text-text-muted"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function VaultRow({
  vault,
  href,
  actions,
}: {
  vault: OrganizationVault;
  href: string | null;
  actions: ActionItem[];
}) {
  const body = (
    <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
      <VaultIconTile color={vault.color} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-text-primary">
            {vault.name}
          </span>
          {vault.secretCount === 0 ? (
            <span className="rounded-xs bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Empty
            </span>
          ) : null}
          {vault.riskLevel === "low" ? (
            <span
              className="inline-flex text-brand-primary"
              title="Low risk"
            >
              <IconCheck className="h-3.5 w-3.5" />
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[12px] text-text-secondary">
          {vault.description || "No description"}
        </p>
      </div>
    </div>
  );

  return (
    <li className="group">
      <div className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-surface-elevated/50">
        {href ? (
          <Link
            href={href}
            className="flex min-w-0 flex-1 items-start gap-3 no-underline sm:items-center"
          >
            {body}
          </Link>
        ) : (
          body
        )}

        <div className="hidden shrink-0 items-center gap-6 md:flex">
          <p className="w-24 text-right text-[13px] text-text-secondary">
            <span className="font-semibold tabular-nums text-text-primary">
              {vault.secretCount}
            </span>{" "}
            secrets
          </p>
          <div className="w-20">
            <RiskBadge level={vault.riskLevel} />
          </div>
          <p className="w-36 text-right text-[12px] text-text-muted">
            {formatRelative(vault.lastUpdatedAt)}
            {vault.lastUpdatedBy ? (
              <span className="mt-0.5 block truncate text-[11px]">
                {vault.lastUpdatedBy.name}
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {href ? (
            <Link
              href={href}
              className="hidden h-8 w-8 items-center justify-center rounded-sm text-text-muted no-underline opacity-0 transition-opacity group-hover:opacity-100 hover:bg-background-secondary hover:text-text-primary focus-visible:opacity-100 focus-visible:outline-none focus-visible:shadow-focus lg:inline-flex"
              aria-label={`Open secrets in ${vault.name}`}
            >
              <IconChevronRight className="h-4 w-4" />
            </Link>
          ) : null}
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <RowActionsMenu items={actions} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 md:hidden">
        <span className="text-[12px] text-text-secondary">
          <span className="font-semibold text-text-primary">
            {vault.secretCount}
          </span>{" "}
          secrets
        </span>
        <RiskBadge level={vault.riskLevel} />
        <span className="text-[11px] text-text-muted">
          {formatRelative(vault.lastUpdatedAt)}
        </span>
      </div>
    </li>
  );
}

function VaultCard({
  vault,
  href,
  actions,
}: {
  vault: OrganizationVault;
  href: string | null;
  actions: ActionItem[];
}) {
  const titleBlock = (
    <>
      <div className="flex items-start justify-between gap-2">
        <VaultIconTile color={vault.color} />
        <RiskBadge level={vault.riskLevel} />
      </div>
      <h2 className="mt-4 text-[15px] font-semibold tracking-tight text-text-primary">
        {vault.name}
      </h2>
      <p className="mt-1 line-clamp-2 min-h-10 text-[13px] text-text-secondary">
        {vault.description || "No description"}
      </p>
    </>
  );

  return (
    <article className="flex flex-col rounded-md border border-border-subtle bg-surface-card p-5 shadow-card transition-colors duration-150 hover:border-border-default hover:bg-surface-elevated/30">
      {href ? (
        <Link href={href} className="min-w-0 no-underline">
          {titleBlock}
        </Link>
      ) : (
        <div>{titleBlock}</div>
      )}
      <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-4">
        <div className="text-[12px] text-text-muted">
          <p>
            <span className="font-semibold tabular-nums text-text-primary">
              {vault.secretCount}
            </span>{" "}
            secrets
            {vault.secretCount === 0 ? " · empty" : ""}
          </p>
          <p className="mt-0.5">{formatRelative(vault.lastUpdatedAt)}</p>
        </div>
        <RowActionsMenu items={actions} />
      </div>
    </article>
  );
}

function VaultEditorModal({
  mode,
  vault,
  busy,
  onClose,
  onSubmit,
}: {
  mode: "create" | "edit";
  vault?: OrganizationVault;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    description: string;
    riskLevel: VaultRiskLevel;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(vault?.name ?? "");
  const [description, setDescription] = useState(vault?.description ?? "");
  const [riskLevel, setRiskLevel] = useState<VaultRiskLevel>(
    vault?.riskLevel ?? "unknown",
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }
    setFormError(null);
    await onSubmit({
      name: trimmed,
      description: description.trim(),
      riskLevel,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-editor-title"
        className="w-full max-w-md overflow-hidden rounded-lg border border-border-subtle bg-surface-elevated shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2
              id="vault-editor-title"
              className="text-[15px] font-semibold text-text-primary"
            >
              {mode === "create" ? "Create vault" : "Edit vault"}
            </h2>
            <p className="mt-0.5 text-[12px] text-text-muted">
              A vault is a container. Secrets are added after it exists.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-muted hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="mb-1.5 block text-label font-medium text-text-secondary">
              Vault name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              maxLength={120}
              placeholder="Production, Staging, Finance…"
              className="h-12 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-label font-medium text-text-secondary">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="What belongs here, and who typically uses it?"
              className="w-full resize-none rounded-sm border border-border-default bg-background-secondary px-3 py-2.5 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <fieldset>
            <legend className="mb-1.5 text-label font-medium text-text-secondary">
              Risk level
            </legend>
            <div className="flex flex-wrap gap-2">
              {RISK_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRiskLevel(opt.value)}
                  className={`inline-flex h-9 items-center rounded-sm border px-2.5 text-[12px] font-medium transition-colors duration-150 ${
                    riskLevel === opt.value
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-border-default text-text-secondary hover:border-border-subtle hover:text-text-primary"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-text-muted">
              {RISK_HELP[riskLevel]}
            </p>
          </fieldset>
          {formError ? (
            <p className="text-[12px] text-danger" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-11 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-11 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-60"
            >
              {busy
                ? "Saving…"
                : mode === "create"
                  ? "Create vault"
                  : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VaultIconTile({ color }: { color: VaultColor }) {
  const map: Record<VaultColor, string> = {
    brand: "bg-brand-primary/15 text-brand-primary",
    purple: "bg-purple/15 text-purple",
    info: "bg-info/15 text-info",
    warning: "bg-warning/15 text-warning",
    danger: "bg-danger/15 text-danger",
  };
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${map[color]}`}
    >
      <IconVault className="h-4 w-4" />
    </span>
  );
}

function RiskBadge({ level }: { level: VaultRiskLevel }) {
  const map: Record<VaultRiskLevel, { label: string; className: string }> = {
    high: { label: "High", className: "bg-danger/15 text-danger" },
    medium: { label: "Medium", className: "bg-warning/15 text-warning" },
    low: { label: "Low", className: "bg-brand-primary/15 text-brand-primary" },
    unknown: {
      label: "Unknown",
      className: "bg-surface-elevated text-text-muted",
    },
  };
  const tone = map[level];
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}
    >
      {tone.label}
    </span>
  );
}

function PaginationFooter({
  from,
  to,
  total,
  page,
  totalPages,
  onPage,
  bordered = false,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  bordered?: boolean;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    0,
    Math.min(totalPages, 5),
  );

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 ${
        bordered
          ? "rounded-md border border-border-subtle bg-surface-card"
          : "border-t border-border-subtle"
      }`}
    >
      <p className="text-[12px] text-text-muted">
        Showing {from}–{to} of {total}
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPage(page - 1)}
            aria-label="Previous page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary hover:border-brand-primary disabled:opacity-40"
          >
            ‹
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[12px] font-semibold ${
                p === page
                  ? "border-brand-primary text-brand-primary"
                  : "border-border-default text-text-secondary hover:border-brand-primary"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPage(page + 1)}
            aria-label="Next page"
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary hover:border-brand-primary disabled:opacity-40"
          >
            ›
          </button>
        </div>
      ) : null}
    </div>
  );
}

function VaultsSkeleton({ view }: { view: ViewMode }) {
  if (view === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-md border border-border-subtle bg-surface-card"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-surface-card">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border-subtle px-4 py-4 last:border-b-0"
        >
          <div className="h-10 w-10 animate-pulse rounded-sm bg-surface-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded-sm bg-surface-elevated" />
            <div className="h-2.5 w-56 animate-pulse rounded-sm bg-background-secondary" />
          </div>
        </div>
      ))}
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
    <div className="rounded-md border border-dashed border-border-default bg-surface-card/60 px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-border-subtle bg-background-secondary text-text-secondary">
        <IconVault className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-card font-semibold text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-small text-text-secondary">
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
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
