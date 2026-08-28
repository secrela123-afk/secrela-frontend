"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
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
import { formatPlanLimit, formatPlanUsage, planLimitErrorToast } from "../../../lib/plan-entitlements";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import { ConfirmDialog, RowActionsMenu } from "../RowActionsMenu";
import { Avatar, PageLoading } from "../ui";
import {
  IconCheck,
  IconClock,
  IconFilter,
  IconGridView,
  IconListView,
  IconLock,
  IconPlus,
  IconSearch,
  IconSecurity,
  IconUsers,
  IconVault,
} from "../icons";
import { toast } from "../../../stores/toast-store";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";
type ViewMode = "list" | "grid";

const PAGE_SIZE = 7;

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

/**
 * Vaults hub — layout aligned to design reference.
 * Metrics that depend on Secrets stay honest zeros until that module exists.
 */
export function VaultsPage() {
  const { can } = useRequiredWorkspace();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const canCreateByPlan = entitlementsQuery.data?.capabilities.createVault ?? true;
  const canCreate = can("vault.create") && canCreateByPlan;
  const canUpdate = can("vault.update");
  const canDelete = can("vault.delete");

  const vaultsQuery = useVaultsQuery();
  const { data, error } = vaultsQuery;
  const isBooting = isQueryBooting(vaultsQuery);
  const createVault = useCreateVaultMutation();
  const updateVault = useUpdateVaultMutation();
  const deleteVault = useDeleteVaultMutation();

  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<VaultRiskLevel | "all">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const vaults = data?.vaults ?? [];
  const summary = data?.summary;

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

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Could not load vaults"
          body={
            error instanceof ApiError
              ? error.message
              : "Check your connection and try again."
          }
        />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
            Vaults
          </h1>
          <p className="mt-1 max-w-2xl text-small text-text-secondary">
            Organize and manage your organization&apos;s secret vaults.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
        >
          <IconPlus className="h-4 w-4" />
          Create Vault
        </button>
      </div>

      {entitlementsQuery.data &&
      !canCreateByPlan &&
      can("vault.create") ? (
        <PlanUpgradePrompt
          className="mb-5"
          title="Vault limit reached"
          description={`Your ${entitlementsQuery.data.planLabel} plan allows ${formatPlanLimit(entitlementsQuery.data.entitlements.maxVaults)} vault(s). You are using ${formatPlanUsage(entitlementsQuery.data.usage.vaults, entitlementsQuery.data.entitlements.maxVaults)}. Upgrade to create more.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Vaults"
          value={isBooting ? "—" : String(summary?.totalVaults ?? 0)}
          hint={
            (summary?.vaultsCreatedThisMonth ?? 0) > 0 ? (
              <span className="font-medium text-brand-primary">
                ↑ {summary?.vaultsCreatedThisMonth} new this month
              </span>
            ) : (
              "No new vaults this month"
            )
          }
          icon={<IconVault className="h-4 w-4 text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />
        <StatCard
          label="Total Secrets"
          value={isBooting ? "—" : String(summary?.totalSecrets ?? 0)}
          hint="Across all vaults"
          icon={<IconSecurity className="h-4 w-4 text-purple" />}
          iconBg="bg-purple/10"
        />
        <StatCard
          label="Total Members"
          value={isBooting ? "—" : String(summary?.totalMembers ?? 0)}
          hint="With access"
          icon={<IconUsers className="h-4 w-4 text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />
        <StatCard
          label="High Risk Secrets"
          value={isBooting ? "—" : String(summary?.highRiskSecrets ?? 0)}
          hint={
            <span className="text-warning">Requires attention</span>
          }
          icon={<IconLock className="h-4 w-4 text-warning" />}
          iconBg="bg-warning/10"
        />
        <StatCard
          label="Expiring Soon"
          value={isBooting ? "—" : String(summary?.expiringSoon ?? 0)}
          hint="In the next 30 days"
          icon={<IconClock className="h-4 w-4 text-info" />}
          iconBg="bg-info/10"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
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
            placeholder="Search vaults..."
            className="h-10 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-sm border px-3 text-[12px] font-medium transition-colors ${
              riskFilter !== "all"
                ? "border-brand-primary/50 bg-brand-primary/10 text-brand-primary"
                : "border-border-default bg-background-secondary text-text-secondary hover:border-brand-primary hover:text-brand-primary"
            }`}
          >
            <IconFilter className="h-3.5 w-3.5" />
            Filters
          </button>
          {filtersOpen ? (
            <div className="absolute top-full right-0 z-30 mt-1 w-48 overflow-hidden rounded-md border border-border-subtle bg-surface-elevated py-1 shadow-card">
              <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-text-muted uppercase">
                Risk level
              </p>
              {(
                ["all", "high", "medium", "low", "unknown"] as const
              ).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setRiskFilter(level);
                    setPage(1);
                    setFiltersOpen(false);
                  }}
                  className={`flex w-full px-3 py-2 text-left text-[12px] ${
                    riskFilter === level
                      ? "bg-brand-primary/10 font-semibold text-brand-primary"
                      : "text-text-secondary hover:bg-surface-card"
                  }`}
                >
                  {level === "all"
                    ? "All levels"
                    : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
            setPage(1);
          }}
          className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
        >
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="name-asc">Sort: Name A–Z</option>
          <option value="name-desc">Sort: Name Z–A</option>
        </select>

        <div className="inline-flex h-10 overflow-hidden rounded-sm border border-border-default bg-background-secondary">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className={`inline-flex h-full w-10 items-center justify-center transition-colors ${
              view === "grid"
                ? "bg-brand-primary text-brand-on-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <IconGridView className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => setView("list")}
            className={`inline-flex h-full w-10 items-center justify-center transition-colors ${
              view === "list"
                ? "bg-brand-primary text-brand-on-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            <IconListView className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isBooting ? (
        <PageLoading label="Loading vaults…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={vaults.length === 0 ? "No vaults yet" : "No matching vaults"}
          body={
            vaults.length === 0
              ? "Create your first vault to start organizing secrets."
              : "Try a different search or clear filters."
          }
          action={
            vaults.length === 0 && can("vault.create") ? (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary"
              >
                <IconPlus className="h-3.5 w-3.5" />
                Create Vault
              </button>
            ) : null
          }
        />
      ) : view === "list" ? (
        <section className="overflow-visible rounded-md border border-border-subtle bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] font-semibold tracking-wide text-text-muted uppercase">
                  <th className="px-4 py-3">Vault Name</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Secrets</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3">Risk Level</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((vault) => (
                  <tr
                    key={vault.id}
                    className="border-b border-border-subtle last:border-b-0 hover:bg-surface-elevated/40"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <VaultIconTile color={vault.color} />
                        <span className="text-[13px] font-semibold text-text-primary">
                          {vault.name}
                        </span>
                        {vault.riskLevel === "low" ? (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                            <IconCheck className="h-2.5 w-2.5" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="max-w-[280px] px-4 py-3.5">
                      <p className="truncate text-[13px] text-text-secondary">
                        {vault.description || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-medium text-text-primary">
                      {vault.secretCount}
                    </td>
                    <td className="px-4 py-3.5">
                      <MemberStack
                        previews={vault.memberPreviews}
                        total={vault.memberCount}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[13px] text-text-primary">
                        {formatRelative(vault.lastUpdatedAt)}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        {vault.lastUpdatedBy
                          ? `by ${vault.lastUpdatedBy.name}`
                          : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <RiskBadge level={vault.riskLevel} />
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <RowActionsMenu
                        items={[
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
                                  label: "Delete vault",
                                  tone: "danger" as const,
                                  onSelect: () => openDelete(vault),
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
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pageRows.map((vault) => (
              <article
                key={vault.id}
                className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <VaultIconTile color={vault.color} />
                    <div>
                      <h3 className="text-[14px] font-semibold text-text-primary">
                        {vault.name}
                      </h3>
                      <p className="text-[11px] text-text-muted">
                        Updated {formatRelative(vault.lastUpdatedAt)}
                      </p>
                    </div>
                  </div>
                  <RowActionsMenu
                    items={[
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
                              label: "Delete vault",
                              tone: "danger" as const,
                              onSelect: () => openDelete(vault),
                            },
                          ]
                        : []),
                    ]}
                  />
                </div>
                <p className="mt-3 line-clamp-2 text-[13px] text-text-secondary">
                  {vault.description || "No description"}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                  <div className="flex gap-3 text-[12px] text-text-muted">
                    <span>
                      <span className="font-semibold text-text-primary">
                        {vault.secretCount}
                      </span>{" "}
                      secrets
                    </span>
                    <span>
                      <span className="font-semibold text-text-primary">
                        {vault.memberCount}
                      </span>{" "}
                      members
                    </span>
                  </div>
                  <RiskBadge level={vault.riskLevel} />
                </div>
              </article>
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
        title="Delete vault?"
        description={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete vault"
        danger
        loading={deleteVault.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={onConfirmDelete}
      />
    </div>
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
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            {mode === "create" ? "Create Vault" : "Edit Vault"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-text-muted hover:text-text-primary"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Vault name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Production"
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
              rows={3}
              maxLength={500}
              placeholder="What belongs in this vault?"
              className="w-full resize-none rounded-sm border border-border-default bg-background-secondary px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
            />
          </label>
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
                  className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-2.5 text-[12px] font-medium ${
                    riskLevel === opt.value
                      ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                      : "border-border-default text-text-secondary hover:border-brand-primary"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 items-center rounded-sm px-1.5 text-[10px] font-semibold ${opt.className}`}
                  >
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-text-muted">
              Icon color is assigned automatically in rotation.
            </p>
          </fieldset>
          {formError ? (
            <p className="text-[12px] text-danger">{formError}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-9 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary disabled:opacity-60"
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
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${map[color]}`}
    >
      <IconVault className="h-4 w-4" />
    </span>
  );
}

function MemberStack({
  previews,
  total,
}: {
  previews: OrganizationVault["memberPreviews"];
  total: number;
}) {
  const extra = Math.max(0, total - previews.length);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {previews.map((m) => (
          <span
            key={m.id}
            title={m.name}
            className="rounded-full ring-2 ring-surface-card"
          >
            <Avatar initials={m.initials} size="sm" />
          </span>
        ))}
      </div>
      {extra > 0 ? (
        <span className="ml-1.5 rounded-full bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary">
          +{extra}
        </span>
      ) : null}
      {total === 0 ? (
        <span className="text-[12px] text-text-muted">—</span>
      ) : null}
    </div>
  );
}

function RiskBadge({ level }: { level: VaultRiskLevel }) {
  const map: Record<
    VaultRiskLevel,
    { label: string; className: string }
  > = {
    high: {
      label: "High",
      className: "bg-danger/15 text-danger",
    },
    medium: {
      label: "Medium",
      className: "bg-warning/15 text-warning",
    },
    low: {
      label: "Low",
      className: "bg-brand-primary/15 text-brand-primary",
    },
    unknown: {
      label: "Unknown",
      className: "bg-surface-elevated text-text-muted",
    },
  };
  const tone = map[level];
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}
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
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(
    0,
    Math.min(totalPages, 5),
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3">
      <p className="text-[12px] text-text-muted">
        Showing {from} to {to} of {total} vaults
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
        <IconVault className="h-6 w-6" />
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
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}
