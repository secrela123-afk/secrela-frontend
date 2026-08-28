"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  type OrganizationRole,
  type Permission,
} from "../../../lib/api";
import { useMembersQuery } from "../../../hooks/queries/useMembersQuery";
import { useRolesMatrixQuery } from "../../../hooks/queries/useRolesMatrixQuery";
import {
  useCreateRoleMutation,
  useDeleteRoleMutation,
  useUpdateRoleMutation,
} from "../../../hooks/queries/useRolesMutations";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { planLimitErrorToast } from "../../../lib/plan-entitlements";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import { isAnyQueryBooting } from "../../../lib/query-status";
import { ConfirmDialog, RowActionsMenu } from "../RowActionsMenu";
import { Avatar, PageLoading } from "../ui";
import {
  IconCheck,
  IconKey,
  IconPlus,
  IconRoles,
  IconSecurity,
  IconUsers,
  IconX,
} from "../icons";
import { toast } from "../../../stores/toast-store";

type TabId = "roles" | "matrix" | "policies" | "templates";

const PERMISSION_LABELS: Record<Permission, string> = {
  "org.read": "View organization",
  "org.update": "Edit organization",
  "member.read": "View members",
  "member.invite": "Invite members",
  "member.remove": "Delete members",
  "member.disable": "Disable members",
  "member.role.update": "Change member roles",
  "role.read": "View roles",
  "role.manage": "Manage roles",
  "vault.read": "View vaults",
  "vault.create": "Create vaults",
  "vault.update": "Update vaults",
  "vault.delete": "Delete vaults",
  "secret.read": "View secrets",
  "secret.create": "Create secrets",
  "secret.update": "Update secrets",
  "secret.delete": "Delete secrets",
  "secret.reveal": "Reveal secrets",
  "access_request.create": "Create access requests",
  "access_request.review": "Review access requests",
  "audit.read": "View audit logs",
};

/**
 * Roles & Permissions — custom roles UI (create / edit permissions).
 */
export function RolesPage() {
  const { role: myRole, can } = useRequiredWorkspace();
  const canManageRoles = can("role.manage");
  const entitlementsQuery = usePlanEntitlementsQuery();
  const canCreateCustomRoleByPlan =
    entitlementsQuery.data?.capabilities.createCustomRole ?? true;
  const rolesQuery = useRolesMatrixQuery();
  const membersQuery = useMembersQuery();
  const { data, error } = rolesQuery;
  const members = membersQuery.data ?? [];
  const isBooting = isAnyQueryBooting(rolesQuery, membersQuery);
  const createRole = useCreateRoleMutation();
  const updateRole = useUpdateRoleMutation();
  const deleteRole = useDeleteRoleMutation();

  const [tab, setTab] = useState<TabId>("roles");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<{
    mode: "create" | "edit";
    role?: OrganizationRole;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrganizationRole | null>(
    null,
  );

  const roles = data?.roles ?? [];
  const catalog = data?.permissionCatalog ?? [];
  const matrix = data?.matrix ?? {};

  const selected =
    roles.find((r) => r.id === selectedId) ??
    roles.find((r) => r.id === data?.yourRoleId) ??
    roles[0] ??
    null;

  const activeMembers = members.filter(
    (m) => m.status !== "disabled" && m.user.emailVerified,
  ).length;
  const mfaEnabled = members.filter((m) => m.user.mfaEnabled).length;
  const permissionRuleCount = catalog.length;

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roles.filter((role) => {
      if (!q) return true;
      return (
        role.name.toLowerCase().includes(q) ||
        (role.description ?? "").toLowerCase().includes(q) ||
        role.slug.includes(q)
      );
    });
  }, [roles, query]);

  function openCreate() {
    if (!canManageRoles) {
      toast.warning(
        "Permission required",
        "Only Owner or Admin can create roles.",
      );
      return;
    }
    if (!canCreateCustomRoleByPlan) {
      toast.warning(
        "Feature not on your plan",
        entitlementsQuery.data?.upgradePlanLabel
          ? `Upgrade to ${entitlementsQuery.data.upgradePlanLabel} to create custom roles.`
          : "Custom roles are not included on your current plan.",
      );
      return;
    }
    setEditor({ mode: "create" });
  }

  function openEdit(role: OrganizationRole) {
    if (!canManageRoles) {
      toast.warning(
        "Permission required",
        "Only Owner or Admin can edit roles.",
      );
      return;
    }
    if (role.kind === "system") {
      toast.info(
        "System role",
        "Owner and Admin permissions are fixed. Create a custom role instead.",
      );
      return;
    }
    setEditor({ mode: "edit", role });
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success("Role deleted", `${deleteTarget.name} was removed.`);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        "Could not delete role",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error
        ? "Unable to load roles"
        : null;

  return (
    <div className="p-4 lg:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-sm bg-brand-primary/15 text-brand-primary">
              <IconRoles className="h-5 w-5" />
            </span>
            <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
              Roles & Permissions
            </h1>
          </div>
          <p className="mt-1.5 max-w-2xl text-small text-text-secondary">
            Create roles and assign fine-grained permissions. Your role:{" "}
            <span className="font-semibold text-text-primary">
              {myRole.name}
            </span>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
        >
          <IconPlus className="h-4 w-4" />
          Create Role
        </button>
      </div>

      {entitlementsQuery.data &&
      !canCreateCustomRoleByPlan &&
      canManageRoles ? (
        <PlanUpgradePrompt
          className="mb-5"
          title="Custom roles are not on your plan"
          description={`Your ${entitlementsQuery.data.planLabel} plan includes the Owner and Admin system role templates only — not extra members. Admin stays unassigned until you invite someone from Members. Upgrade to ${entitlementsQuery.data.upgradePlanLabel ?? "a paid plan"} to create custom roles.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      <div className="mb-5 flex gap-6 overflow-x-auto border-b border-border-subtle">
        {(
          [
            { id: "roles" as const, label: "Roles" },
            { id: "matrix" as const, label: "Permission Matrix" },
            { id: "policies" as const, label: "Access Policies" },
            { id: "templates" as const, label: "Role Templates" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative pb-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${
              tab === t.id
                ? "text-brand-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {t.label}
            {tab === t.id ? (
              <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-brand-primary" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "policies" || tab === "templates" ? (
        <ComingSoonPanel
          title={tab === "policies" ? "Access Policies" : "Role Templates"}
          body={
            tab === "policies"
              ? "Time-bound policies will land after custom roles stabilize."
              : "Reusable templates across workspaces come later."
          }
        />
      ) : null}

      {(tab === "roles" || tab === "matrix") && (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Roles"
              value={String(roles.length)}
              hint="System + custom"
              icon={<IconRoles className="h-4 w-4 text-brand-primary" />}
              iconBg="bg-brand-primary/10"
            />
            <StatCard
              label="Active Members"
              value={String(activeMembers)}
              hint={`${members.length} total in workspace`}
              icon={<IconUsers className="h-4 w-4 text-brand-primary" />}
              iconBg="bg-brand-primary/10"
            />
            <StatCard
              label="Permission Rules"
              value={String(permissionRuleCount || "—")}
              hint="Catalog size"
              icon={<IconKey className="h-4 w-4 text-warning" />}
              iconBg="bg-warning/10"
            />
            <StatCard
              label="MFA Coverage"
              value={
                members.length === 0 ? "—" : `${mfaEnabled}/${members.length}`
              }
              hint={
                members.length === 0
                  ? "No members yet"
                  : `${Math.round((mfaEnabled / members.length) * 100)}% enabled`
              }
              icon={<IconSecurity className="h-4 w-4 text-brand-primary" />}
              iconBg="bg-brand-primary/10"
            />
          </div>

          {isBooting ? (
            <PageLoading label="Loading roles…" />
          ) : errorMessage ? (
            <p className="text-body text-danger" role="alert">
              {errorMessage}
            </p>
          ) : (
            <>
              {tab === "roles" ? (
                <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                  <section className="min-w-0 overflow-visible rounded-md border border-border-subtle bg-surface-card shadow-card">
                    <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle p-3 sm:p-4">
                      <div className="relative min-w-[200px] flex-1">
                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted">
                          ⌕
                        </span>
                        <input
                          type="search"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search roles…"
                          className="h-10 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex h-10 items-center gap-1.5 rounded-sm bg-brand-primary px-3 text-[12px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover"
                      >
                        <IconPlus className="h-3.5 w-3.5" />
                        New Role
                      </button>
                    </div>

                    <table className="w-full table-fixed border-collapse text-left text-[14px]">
                      <thead>
                        <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.08em] text-text-muted">
                          <th className="px-5 py-3.5 font-semibold">Role Name</th>
                          <th className="px-4 py-3.5 font-semibold">Members</th>
                          <th className="px-4 py-3.5 font-semibold">
                            Permissions
                          </th>
                          <th className="px-4 py-3.5 font-semibold">Status</th>
                          <th className="px-4 py-3.5 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRoles.map((role) => {
                          const isSelected = selected?.id === role.id;
                          const isYou = data?.yourRoleId === role.id;
                          return (
                            <tr
                              key={role.id}
                              onClick={() => setSelectedId(role.id)}
                              className={`cursor-pointer border-b border-border-subtle/80 transition-colors ${
                                isSelected
                                  ? "bg-brand-primary/5"
                                  : "hover:bg-surface-elevated/50"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                  <RoleGlyph role={role} />
                                  <div className="min-w-0">
                                    <p className="font-semibold text-text-primary">
                                      {role.name}
                                      {isYou ? (
                                        <span className="ml-2 text-[11px] font-semibold text-brand-primary">
                                          You
                                        </span>
                                      ) : null}
                                      {role.kind === "system" ? (
                                        <span className="ml-2 text-[10px] font-semibold text-text-muted">
                                          System
                                        </span>
                                      ) : null}
                                    </p>
                                    <p className="truncate text-[12px] text-text-muted">
                                      {role.description || "Custom role"}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 font-medium text-text-primary">
                                {role.memberCount}
                                {role.systemKey === "admin" &&
                                role.memberCount === 0 ? (
                                  <span className="mt-0.5 block text-[10px] font-semibold text-text-muted">
                                    Unassigned — invite from Members
                                  </span>
                                ) : null}
                              </td>
                              <td className="px-4 py-4 text-[13px] text-text-secondary">
                                {role.permissions.length} rules
                              </td>
                              <td className="px-4 py-4">
                                <span className="inline-flex items-center gap-1.5 rounded-sm bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
                                  <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                                  Active
                                </span>
                              </td>
                              <td
                                className="px-4 py-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <RowActionsMenu
                                  items={[
                                    {
                                      id: "view",
                                      label: "View details",
                                      onSelect: () => setSelectedId(role.id),
                                    },
                                    ...(canManageRoles && role.kind === "custom"
                                      ? [
                                          {
                                            id: "edit",
                                            label: "Edit permissions",
                                            onSelect: () => openEdit(role),
                                          },
                                          {
                                            id: "delete",
                                            label: "Delete role",
                                            tone: "danger" as const,
                                            onSelect: () =>
                                              setDeleteTarget(role),
                                          },
                                        ]
                                      : []),
                                  ]}
                                />
                              </td>
                            </tr>
                          );
                        })}
                        {filteredRoles.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-5 py-10 text-center text-text-muted"
                            >
                              No roles match your search.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                    <div className="border-t border-border-subtle px-5 py-3 text-[12px] text-text-muted">
                      Showing {filteredRoles.length} of {roles.length} roles
                    </div>
                  </section>

                  {selected ? (
                    <aside className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card xl:sticky xl:top-4 xl:self-start">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-[13px] font-semibold text-text-primary">
                          Role Details
                        </h2>
                        {canManageRoles && selected.kind === "custom" ? (
                          <button
                            type="button"
                            onClick={() => openEdit(selected)}
                            className="text-[11px] font-semibold text-brand-primary hover:text-brand-primary-hover"
                          >
                            Edit
                          </button>
                        ) : null}
                      </div>
                      <div className="flex items-start gap-3">
                        <RoleGlyph role={selected} large />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[1.05rem] font-semibold text-text-primary">
                              {selected.name}
                            </h3>
                            <span className="inline-flex items-center gap-1 rounded-sm bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold text-brand-primary">
                              Active
                            </span>
                          </div>
                          <p className="mt-1 text-[12px] text-text-secondary">
                            {selected.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border-subtle py-3 text-center">
                        <div>
                          <p className="text-[15px] font-bold text-text-primary">
                            {selected.memberCount}
                          </p>
                          <p className="text-[10px] font-medium text-text-muted">
                            Members
                          </p>
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-text-primary">
                            {selected.permissions.length}
                          </p>
                          <p className="text-[10px] font-medium text-text-muted">
                            Permissions
                          </p>
                        </div>
                      </div>
                      <h4 className="mt-4 text-[12px] font-semibold text-text-primary">
                        Permissions
                      </h4>
                      <ul className="mt-2 max-h-[320px] space-y-1.5 overflow-y-auto pr-1">
                        {catalog.map((perm) => {
                          const allowed = selected.permissions.includes(perm);
                          return (
                            <li
                              key={perm}
                              className="flex items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-[12px]"
                            >
                              <span className="text-text-secondary">
                                {PERMISSION_LABELS[perm] ?? perm}
                              </span>
                              {allowed ? (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                                  <IconCheck className="h-3 w-3" />
                                </span>
                              ) : (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-danger">
                                  <IconX className="h-3 w-3" />
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </aside>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <section className="min-w-0 overflow-x-auto rounded-md border border-border-subtle bg-surface-card shadow-card">
                  <div className="border-b border-border-subtle px-5 py-3.5">
                    <h2 className="text-[13px] font-semibold text-text-primary">
                      Permission Matrix
                    </h2>
                    <p className="mt-0.5 text-[12px] text-text-muted">
                      Live matrix from organization roles.
                    </p>
                  </div>
                  <table className="w-full min-w-[520px] border-collapse text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.06em] text-text-muted">
                        <th className="px-5 py-3 font-semibold">Permission</th>
                        {roles.map((role) => (
                          <th
                            key={role.id}
                            className="px-3 py-3 text-center font-semibold"
                          >
                            {role.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {catalog.map((perm) => (
                        <tr
                          key={perm}
                          className="border-b border-border-subtle/70"
                        >
                          <td className="px-5 py-3 text-text-secondary">
                            {PERMISSION_LABELS[perm] ?? perm}
                          </td>
                          {roles.map((role) => {
                            const allowed = (
                              matrix[role.id] ?? role.permissions
                            ).includes(perm);
                            return (
                              <td key={role.id} className="px-3 py-3 text-center">
                                {allowed ? (
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
                                    <IconCheck className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-danger/15 text-danger">
                                    <IconX className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <aside className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
                  <h2 className="text-[13px] font-semibold text-text-primary">
                    Recent Role Activity
                  </h2>
                  <ul className="mt-3 space-y-3">
                    <li className="flex gap-2.5">
                      <Avatar initials="SV" size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-text-primary">
                          SecureVault
                        </p>
                        <p className="text-[11px] text-text-secondary">
                          Custom roles enabled for this workspace
                        </p>
                      </div>
                    </li>
                  </ul>
                  <p className="mt-4 text-[11px] text-text-muted">
                    Full activity will connect to audit logs later.
                  </p>
                </aside>
              </div>
            </>
          )}
        </>
      )}

      {editor ? (
        <RoleEditorModal
          mode={editor.mode}
          role={editor.role}
          catalog={catalog}
          actorPermissions={myRole.permissions}
          saving={createRole.isPending || updateRole.isPending}
          onClose={() => setEditor(null)}
          onSave={async (payload) => {
            try {
              if (editor.mode === "create") {
                await createRole.mutateAsync(payload);
                toast.success("Role created", payload.name);
              } else if (editor.role) {
                await updateRole.mutateAsync({
                  roleId: editor.role.id,
                  ...payload,
                });
                toast.success("Role updated", payload.name);
              }
              setEditor(null);
            } catch (err) {
              const planToast = planLimitErrorToast(err);
              if (planToast) {
                toast.warning(planToast.title, planToast.message);
                return;
              }
              toast.error(
                "Could not save role",
                err instanceof ApiError ? err.message : "Try again.",
              );
            }
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete role"
        description={
          <>
            Delete{" "}
            <span className="font-semibold text-text-primary">
              {deleteTarget?.name}
            </span>
            ? Members must be moved off this role first.
          </>
        }
        confirmLabel="Delete"
        danger
        loading={deleteRole.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}

function RoleEditorModal({
  mode,
  role,
  catalog,
  actorPermissions,
  saving,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  role?: OrganizationRole;
  catalog: Permission[];
  actorPermissions: Permission[];
  saving: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    description?: string | null;
    permissions: Permission[];
  }) => Promise<void>;
}) {
  const grantable = catalog.filter((p) => actorPermissions.includes(p));
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Permission[]>(() => {
    const base = new Set<Permission>(role?.permissions ?? []);
    base.add("org.read");
    base.add("access_request.create");
    return [...base];
  });

  function toggle(perm: Permission) {
    if (perm === "org.read" || perm === "access_request.create") return;
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-md border border-border-subtle bg-surface-card shadow-card">
        <div className="border-b border-border-subtle px-5 py-4">
          <h2 className="text-[1.05rem] font-semibold text-text-primary">
            {mode === "create" ? "Create role" : "Edit role"}
          </h2>
          <p className="mt-1 text-[12px] text-text-secondary">
            Pick any permissions you have.{" "}
            <span className="font-semibold text-text-primary">View organization</span>{" "}
            (`org.read`) and{" "}
            <span className="font-semibold text-text-primary">Create access requests</span>{" "}
            are always required so members can open the workspace and request
            temporary secret access.
          </p>
        </div>
        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-text-secondary">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary"
              placeholder="e.g. Developer"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-text-secondary">
              Description
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary"
              placeholder="Optional"
            />
          </label>
          <div>
            <p className="mb-2 text-[12px] font-semibold text-text-secondary">
              Permissions ({selected.length})
            </p>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-sm border border-border-subtle p-2">
              {grantable.map((perm) => {
                const locked =
                  perm === "org.read" || perm === "access_request.create";
                return (
                  <li key={perm}>
                    <label
                      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-[12px] ${
                        locked
                          ? "cursor-default opacity-90"
                          : "cursor-pointer hover:bg-surface-elevated"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.includes(perm) || locked}
                        disabled={locked}
                        onChange={() => toggle(perm)}
                        className="accent-brand-primary"
                      />
                      <span className="text-text-primary">
                        {PERMISSION_LABELS[perm] ?? perm}
                        {locked ? (
                          <span className="ml-1 text-[10px] text-text-muted">
                            (required)
                          </span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || name.trim().length < 2 || selected.length === 0}
            onClick={() =>
              void onSave({
                name: name.trim(),
                description: description.trim() || null,
                permissions: Array.from(
                  new Set<Permission>([
                    ...selected,
                    "org.read",
                    "access_request.create",
                  ]),
                ),
              })
            }
            className="h-9 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleGlyph({
  role,
  large,
}: {
  role: OrganizationRole;
  large?: boolean;
}) {
  const size = large ? "h-11 w-11" : "h-9 w-9";
  const iconSize = large ? "h-5 w-5" : "h-4 w-4";
  const tone =
    role.systemKey === "owner"
      ? "bg-brand-primary/15 text-brand-primary"
      : role.systemKey === "admin"
        ? "bg-purple/15 text-purple"
        : "bg-info/15 text-info";
  const Icon =
    role.systemKey === "owner"
      ? IconSecurity
      : role.systemKey === "admin"
        ? IconRoles
        : IconUsers;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-sm ${size} ${tone}`}
    >
      <Icon className={iconSize} />
    </span>
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
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-medium text-text-muted">{label}</p>
          <p className="mt-1 text-[1.5rem] font-bold tracking-tight text-text-primary">
            {value}
          </p>
          <div className="mt-1 text-[11px] text-text-secondary">{hint}</div>
        </div>
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-sm ${iconBg}`}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}

function ComingSoonPanel({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card px-6 py-16 text-center shadow-card">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
        <IconRoles className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-[1.125rem] font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-text-secondary">
        {body}
      </p>
    </div>
  );
}
