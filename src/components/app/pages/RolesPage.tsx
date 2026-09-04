"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  type OrganizationMember,
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
import { ConfirmDialog, RowActionsMenu, type ActionItem } from "../RowActionsMenu";
import { Avatar } from "../ui";
import {
  IconCheck,
  IconLock,
  IconPlus,
  IconRoles,
  IconSearch,
  IconSecurity,
  IconUser,
  IconUsers,
  IconWarning,
  IconX,
} from "../icons";
import { toast } from "../../../stores/toast-store";

type ViewId = "directory" | "matrix";
type KindFilter = "all" | "system" | "custom";

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

const REQUIRED_PERMISSIONS: Permission[] = [
  "org.read",
  "access_request.create",
];

/** Grants that expand blast radius if assigned carelessly. */
const SENSITIVE_PERMISSIONS = new Set<Permission>([
  "org.update",
  "member.remove",
  "member.disable",
  "member.role.update",
  "role.manage",
  "vault.delete",
  "secret.delete",
  "secret.reveal",
  "access_request.review",
]);

const PERMISSION_GROUPS: {
  id: string;
  label: string;
  hint: string;
  permissions: Permission[];
}[] = [
  {
    id: "org",
    label: "Organization",
    hint: "Workspace profile and settings",
    permissions: ["org.read", "org.update"],
  },
  {
    id: "members",
    label: "Members",
    hint: "Who can enter this workspace",
    permissions: [
      "member.read",
      "member.invite",
      "member.remove",
      "member.disable",
      "member.role.update",
    ],
  },
  {
    id: "roles",
    label: "Roles",
    hint: "Who can change the permission model",
    permissions: ["role.read", "role.manage"],
  },
  {
    id: "vaults",
    label: "Vaults",
    hint: "Containers that hold secrets",
    permissions: ["vault.read", "vault.create", "vault.update", "vault.delete"],
  },
  {
    id: "secrets",
    label: "Secrets",
    hint: "Reveal is the highest-risk grant",
    permissions: [
      "secret.read",
      "secret.create",
      "secret.update",
      "secret.delete",
      "secret.reveal",
    ],
  },
  {
    id: "access",
    label: "Access requests",
    hint: "Temporary access to secrets",
    permissions: ["access_request.create", "access_request.review"],
  },
  {
    id: "audit",
    label: "Audit",
    hint: "Who did what — never secret values",
    permissions: ["audit.read"],
  },
];

function permLabel(perm: Permission) {
  return PERMISSION_LABELS[perm] ?? perm;
}

function isRequired(perm: Permission) {
  return REQUIRED_PERMISSIONS.includes(perm);
}

function roleKindLabel(role: OrganizationRole) {
  if (role.systemKey === "owner") return "Owner";
  if (role.systemKey === "admin") return "Admin";
  if (role.kind === "system") return "System";
  return "Custom";
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Roles & Permissions — who can see, change, reveal, or approve.
 * System roles are templates. Custom roles are the blast-radius control.
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

  const [view, setView] = useState<ViewId>("directory");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    (view === "directory" ? roles.find((r) => r.id === data?.yourRoleId) ?? roles[0] ?? null : null);

  const systemCount = roles.filter((r) => r.kind === "system").length;
  const customCount = roles.filter((r) => r.kind === "custom").length;

  const filteredRoles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return roles.filter((role) => {
      if (kindFilter === "system" && role.kind !== "system") return false;
      if (kindFilter === "custom" && role.kind !== "custom") return false;
      if (!q) return true;
      return (
        role.name.toLowerCase().includes(q) ||
        (role.description ?? "").toLowerCase().includes(q) ||
        role.slug.includes(q)
      );
    });
  }, [roles, query, kindFilter]);

  const createBlockedReason = !canManageRoles
    ? "You can view roles, but creating them requires role.manage"
    : !canCreateCustomRoleByPlan
      ? entitlementsQuery.data?.upgradePlanLabel
        ? `Upgrade to ${entitlementsQuery.data.upgradePlanLabel} to create custom roles`
        : "Custom roles are not on your current plan"
      : undefined;

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
        "Owner and Admin permissions are fixed. Create a custom role to grant a smaller set.",
      );
      return;
    }
    setEditor({ mode: "edit", role });
  }

  function selectRole(role: OrganizationRole, openMobileDrawer: boolean) {
    setSelectedId(role.id);
    if (openMobileDrawer) setDrawerOpen(true);
  }

  async function onConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await deleteRole.mutateAsync(deleteTarget.id);
      toast.success("Role deleted", `${deleteTarget.name} was removed.`);
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
        setDrawerOpen(false);
      }
      setDeleteTarget(null);
    } catch (err) {
      toast.error(
        "Could not delete role",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  function roleActions(role: OrganizationRole): ActionItem[] {
    const items: ActionItem[] = [
      {
        id: "view",
        label: "View permissions",
        onSelect: () => selectRole(role, true),
      },
    ];
    if (canManageRoles && role.kind === "custom") {
      items.push({
        id: "edit",
        label: "Edit permissions",
        onSelect: () => openEdit(role),
      });
      items.push({
        id: "delete",
        label: role.memberCount > 0 ? "Delete role (in use)" : "Delete role",
        tone: "danger",
        disabled: role.memberCount > 0,
        onSelect: () => setDeleteTarget(role),
      });
    }
    return items;
  }

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error
        ? "Unable to load roles"
        : null;

  const kindTabs: { id: KindFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: roles.length },
    { id: "system", label: "System", count: systemCount },
    { id: "custom", label: "Custom", count: customCount },
  ];

  return (
    <div className="p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-section font-semibold tracking-tight text-text-primary">
            Roles & Permissions
          </h1>
          <p className="mt-1 max-w-xl text-small text-text-secondary">
            Bound what people can see, change, reveal, or approve. System roles
            are locked templates. Custom roles are how you shrink blast radius.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-muted">
            <span>
              Your role{" "}
              <span className="font-semibold text-text-primary">{myRole.name}</span>
            </span>
            <span>
              {roles.length} role{roles.length === 1 ? "" : "s"}
              {customCount > 0 ? (
                <>
                  {" "}
                  ·{" "}
                  <span className="font-semibold text-text-primary">
                    {customCount} custom
                  </span>
                </>
              ) : null}
            </span>
          </div>
        </div>
        {canManageRoles ? (
          <button
            type="button"
            onClick={openCreate}
            title={createBlockedReason}
            className="inline-flex h-10 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary shadow-glow-green transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconPlus className="h-4 w-4" />
            Create role
          </button>
        ) : null}
      </header>

      {!canManageRoles ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-border-subtle bg-surface-card px-4 py-3.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
            <IconLock className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-small leading-relaxed text-text-secondary">
            <p className="font-semibold text-text-primary">View only</p>
            <p className="mt-0.5">
              You can inspect roles and the permission matrix. Creating or
              editing roles requires the{" "}
              <span className="font-medium text-text-primary">Manage roles</span>{" "}
              permission.
            </p>
          </div>
        </div>
      ) : null}

      {entitlementsQuery.data &&
      !canCreateCustomRoleByPlan &&
      canManageRoles ? (
        <PlanUpgradePrompt
          className="mb-5"
          title="Custom roles are not on your plan"
          description={`Your ${entitlementsQuery.data.planLabel} plan includes Owner and Admin only. Upgrade to ${entitlementsQuery.data.upgradePlanLabel ?? "a paid plan"} to create roles with a smaller permission set.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-sm border border-border-subtle bg-surface-card p-0.5"
          role="tablist"
          aria-label="Roles view"
        >
          {(
            [
              { id: "directory" as const, label: "Roles" },
              { id: "matrix" as const, label: "Compare permissions" },
            ] as const
          ).map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(item.id)}
                className={`rounded-xs px-3 py-1.5 text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-focus ${
                  active
                    ? "bg-surface-elevated text-text-primary"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {errorMessage ? (
        <p className="text-body text-danger" role="alert">
          {errorMessage}
        </p>
      ) : view === "directory" ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0 overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card">
            <div className="border-b border-border-subtle px-3 pt-2 sm:px-4">
              <div
                className="flex gap-1 overflow-x-auto"
                role="tablist"
                aria-label="Role kinds"
              >
                {kindTabs.map((item) => {
                  const active = kindFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setKindFilter(item.id)}
                      className={`relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                        active
                          ? "text-text-primary"
                          : "text-text-muted hover:text-text-secondary"
                      }`}
                    >
                      {item.label}
                      <span className="ml-1.5 tabular-nums text-text-muted">
                        {item.count}
                      </span>
                      {active ? (
                        <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-pill bg-brand-primary" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-border-subtle p-3 sm:px-4 sm:py-3">
              <label className="relative block">
                <span className="sr-only">Search roles</span>
                <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or description"
                  className="h-10 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
                />
              </label>
            </div>

            {isBooting ? (
              <RoleListSkeleton />
            ) : filteredRoles.length === 0 ? (
              <EmptyRoles
                hasRoles={roles.length > 0}
                kindFilter={kindFilter}
                canCreate={canManageRoles && canCreateCustomRoleByPlan}
                onCreate={openCreate}
                onClear={() => {
                  setQuery("");
                  setKindFilter("all");
                }}
              />
            ) : (
              <>
                <div className="hidden md:block">
                  <table className="w-full table-fixed border-collapse text-left text-small">
                    <colgroup>
                      <col className="w-[42%]" />
                      <col className="w-[16%]" />
                      <col className="w-[18%]" />
                      <col className="w-[14%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-border-subtle text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                        <th className="px-4 py-2.5 font-semibold">Role</th>
                        <th className="px-3 py-2.5 font-semibold">Kind</th>
                        <th className="px-3 py-2.5 font-semibold">Assigned</th>
                        <th className="px-3 py-2.5 font-semibold">Grants</th>
                        <th className="px-3 py-2.5 font-semibold">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.map((role) => {
                        const isSelected = selected?.id === role.id;
                        const isYou = data?.yourRoleId === role.id;
                        const assigned = membersForRole(members, role.id);
                        return (
                          <tr
                            key={role.id}
                            onClick={() => selectRole(role, false)}
                            className={`cursor-pointer border-b border-border-subtle/80 transition-colors last:border-b-0 ${
                              isSelected
                                ? "bg-surface-elevated"
                                : "hover:bg-surface-elevated/60"
                            }`}
                          >
                            <td className="px-4 py-3.5">
                              <div className="flex min-w-0 items-center gap-3">
                                <RoleGlyph role={role} />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-text-primary">
                                    {role.name}
                                    {isYou ? (
                                      <span className="ml-2 text-[11px] font-medium text-text-muted">
                                        You
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="mt-0.5 truncate text-[12px] text-text-muted">
                                    {role.description ||
                                      (role.kind === "system"
                                        ? "Built-in workspace role"
                                        : "No description")}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3.5">
                              <KindBadge role={role} />
                            </td>
                            <td className="px-3 py-3.5">
                              <AssignedCell
                                count={role.memberCount}
                                names={assigned.map((m) => m.user.name)}
                                adminUnassigned={
                                  role.systemKey === "admin" &&
                                  role.memberCount === 0
                                }
                              />
                            </td>
                            <td className="px-3 py-3.5 tabular-nums text-text-secondary">
                              {role.permissions.length}
                              <span className="text-text-muted">
                                /{catalog.length || role.permissions.length}
                              </span>
                            </td>
                            <td
                              className="px-3 py-3.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RowActionsMenu items={roleActions(role)} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ul className="m-0 list-none divide-y divide-border-subtle p-0 md:hidden">
                  {filteredRoles.map((role) => {
                    const isYou = data?.yourRoleId === role.id;
                    return (
                      <li key={role.id}>
                        <button
                          type="button"
                          onClick={() => selectRole(role, true)}
                          className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-elevated/60"
                        >
                          <RoleGlyph role={role} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-text-primary">
                              {role.name}
                              {isYou ? (
                                <span className="ml-2 text-[11px] font-medium text-text-muted">
                                  You
                                </span>
                              ) : null}
                            </p>
                            <p className="mt-0.5 text-[12px] text-text-muted">
                              {role.memberCount} assigned · {role.permissions.length} grants
                            </p>
                          </div>
                          <KindBadge role={role} />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="border-t border-border-subtle px-4 py-2.5 text-[12px] text-text-muted">
                  {filteredRoles.length} of {roles.length} roles
                </div>
              </>
            )}
          </section>

          {selected && !isBooting ? (
            <div className="hidden xl:block">
              <RoleInspector
                role={selected}
                catalog={catalog}
                members={membersForRole(members, selected.id)}
                isYou={data?.yourRoleId === selected.id}
                canManage={canManageRoles}
                onEdit={() => openEdit(selected)}
                onDelete={() => setDeleteTarget(selected)}
              />
            </div>
          ) : null}
        </div>
      ) : isBooting ? (
        <RoleListSkeleton />
      ) : (
        <PermissionMatrixTable roles={roles} catalog={catalog} matrix={matrix} />
      )}

      {selected && drawerOpen ? (
        <RoleDrawer
          role={selected}
          catalog={catalog}
          members={membersForRole(members, selected.id)}
          isYou={data?.yourRoleId === selected.id}
          canManage={canManageRoles}
          onEdit={() => {
            setDrawerOpen(false);
            openEdit(selected);
          }}
          onDelete={() => {
            setDrawerOpen(false);
            setDeleteTarget(selected);
          }}
          onClose={() => setDrawerOpen(false)}
        />
      ) : null}

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
        title="Delete this role?"
        description={
          <>
            <span className="font-semibold text-text-primary">
              {deleteTarget?.name}
            </span>{" "}
            will be removed permanently. Members must already be moved to another
            role — this cannot be undone.
          </>
        }
        confirmLabel="Delete role"
        danger
        loading={deleteRole.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}

function membersForRole(members: OrganizationMember[], roleId: string) {
  return members.filter(
    (m) => m.role.id === roleId && m.status !== "disabled",
  );
}

function KindBadge({ role }: { role: OrganizationRole }) {
  const system = role.kind === "system";
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold ${
        system
          ? "bg-surface-elevated text-text-secondary"
          : "bg-info/10 text-info"
      }`}
    >
      {roleKindLabel(role)}
    </span>
  );
}

function AssignedCell({
  count,
  names,
  adminUnassigned,
}: {
  count: number;
  names: string[];
  adminUnassigned: boolean;
}) {
  if (adminUnassigned) {
    return (
      <span className="text-[12px] text-text-muted">
        Unassigned
        <span className="mt-0.5 block text-[11px]">Invite from Members</span>
      </span>
    );
  }
  if (count === 0) {
    return <span className="text-text-muted">None</span>;
  }
  const shown = names.slice(0, 2);
  const extra = count - shown.length;
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {shown.map((name) => (
          <Avatar key={name} initials={initials(name)} size="sm" />
        ))}
      </div>
      <span className="tabular-nums text-text-secondary">
        {count}
        {extra > 0 ? ` (+${extra})` : ""}
      </span>
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
        : "bg-surface-elevated text-text-secondary";
  const Icon =
    role.systemKey === "owner"
      ? IconSecurity
      : role.systemKey === "admin"
        ? IconRoles
        : IconUser;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-sm ${size} ${tone}`}
    >
      <Icon className={iconSize} />
    </span>
  );
}

function RoleInspector({
  role,
  catalog,
  members,
  isYou,
  canManage,
  onEdit,
  onDelete,
  compact,
}: {
  role: OrganizationRole;
  catalog: Permission[];
  members: OrganizationMember[];
  isYou: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  const granted = role.permissions.length;
  const total = catalog.length || granted;
  const sensitiveGranted = role.permissions.filter((p) =>
    SENSITIVE_PERMISSIONS.has(p),
  );

  return (
    <aside className="rounded-md border border-border-subtle bg-surface-card p-5 shadow-card xl:sticky xl:top-4 xl:self-start">
      <div className="flex items-start gap-3">
        <RoleGlyph role={role} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-card font-semibold text-text-primary">
              {role.name}
            </h2>
            <KindBadge role={role} />
          </div>
          {isYou ? (
            <p className="mt-1 text-[12px] text-text-muted">This is your role.</p>
          ) : null}
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            {role.description ||
              (role.kind === "system"
                ? "Permissions for this role are fixed."
                : "No description yet.")}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 border-y border-border-subtle py-3">
        <div>
          <dt className="text-[11px] text-text-muted">Assigned</dt>
          <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-text-primary">
            {role.memberCount}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-text-muted">Grants</dt>
          <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-text-primary">
            {granted}
            <span className="text-[12px] font-medium text-text-muted">/{total}</span>
          </dd>
        </div>
      </dl>

      {members.length > 0 ? (
        <div className="mt-4">
          <p className="text-[12px] font-semibold text-text-primary">People</p>
          <ul className="mt-2 m-0 list-none space-y-2 p-0">
            {members.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <Avatar initials={initials(m.user.name)} size="sm" />
                <span className="min-w-0 truncate text-[12px] text-text-secondary">
                  {m.user.name}
                </span>
              </li>
            ))}
          </ul>
          {role.memberCount > 5 ? (
            <p className="mt-1 text-[11px] text-text-muted">
              +{role.memberCount - 5} more
            </p>
          ) : null}
          <Link
            href="/app/members"
            className="mt-2 inline-block text-[12px] font-semibold text-brand-primary no-underline hover:text-brand-primary-hover"
          >
            Open members →
          </Link>
        </div>
      ) : role.systemKey === "admin" ? (
        <p className="mt-4 text-[12px] text-text-muted">
          No Admin assigned yet. Invite someone from{" "}
          <Link
            href="/app/members"
            className="font-semibold text-brand-primary no-underline hover:text-brand-primary-hover"
          >
            Members
          </Link>
          .
        </p>
      ) : (
        <p className="mt-4 text-[12px] text-text-muted">
          Nobody is assigned this role.
        </p>
      )}

      {sensitiveGranted.length > 0 ? (
        <div className="mt-4 rounded-sm border border-warning/25 bg-warning/5 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-warning">
            <IconWarning className="h-3.5 w-3.5" />
            Sensitive grants
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
            {sensitiveGranted.map(permLabel).join(" · ")}
          </p>
        </div>
      ) : null}

      <div className={compact ? "mt-4" : "mt-4 max-h-[360px] overflow-y-auto pr-1"}>
        <p className="text-[12px] font-semibold text-text-primary">Permissions</p>
        <div className="mt-2 space-y-3">
          {PERMISSION_GROUPS.map((group) => {
            const inCatalog = group.permissions.filter((p) =>
              catalog.length === 0 ? true : catalog.includes(p),
            );
            if (inCatalog.length === 0) return null;
            const allowed = inCatalog.filter((p) =>
              role.permissions.includes(p),
            ).length;
            return (
              <div key={group.id}>
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                    {group.label}
                  </p>
                  <p className="tabular-nums text-[11px] text-text-muted">
                    {allowed}/{inCatalog.length}
                  </p>
                </div>
                <ul className="m-0 list-none space-y-1 p-0">
                  {inCatalog.map((perm) => {
                    const on = role.permissions.includes(perm);
                    return (
                      <li
                        key={perm}
                        className="flex items-center justify-between gap-2 py-0.5 text-[12px]"
                      >
                        <span
                          className={
                            on ? "text-text-secondary" : "text-text-muted"
                          }
                        >
                          {permLabel(perm)}
                          {SENSITIVE_PERMISSIONS.has(perm) ? (
                            <span className="sr-only"> (sensitive)</span>
                          ) : null}
                        </span>
                        {on ? (
                          <IconCheck
                            className="h-3.5 w-3.5 shrink-0 text-brand-primary"
                            aria-label="Granted"
                          />
                        ) : (
                          <span
                            className="w-3.5 text-center text-[11px] text-text-muted"
                            aria-label="Not granted"
                          >
                            —
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {canManage && role.kind === "custom" ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-border-subtle pt-4">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center rounded-sm bg-brand-primary px-3.5 text-[12px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            Edit permissions
          </button>
          <button
            type="button"
            disabled={role.memberCount > 0}
            title={
              role.memberCount > 0
                ? "Move members to another role first"
                : "Delete role"
            }
            onClick={onDelete}
            className="inline-flex h-9 items-center rounded-sm border border-danger/40 px-3.5 text-[12px] font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-focus"
          >
            Delete
          </button>
        </div>
      ) : role.kind === "system" ? (
        <p className="mt-5 border-t border-border-subtle pt-4 text-[11px] leading-relaxed text-text-muted">
          System roles cannot be edited or deleted. Create a custom role to grant
          a smaller set of permissions.
        </p>
      ) : null}
    </aside>
  );
}

function RoleDrawer({
  role,
  catalog,
  members,
  isYou,
  canManage,
  onEdit,
  onDelete,
  onClose,
}: {
  role: OrganizationRole;
  catalog: Permission[];
  members: OrganizationMember[];
  isYou: boolean;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end xl:hidden" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close role details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border-subtle bg-background-primary shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <p id="role-drawer-title" className="text-[13px] font-semibold text-text-primary">
            Role details
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-muted hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          <RoleInspector
            role={role}
            catalog={catalog}
            members={members}
            isYou={isYou}
            canManage={canManage}
            onEdit={onEdit}
            onDelete={onDelete}
            compact
          />
        </div>
      </div>
    </div>
  );
}

function PermissionMatrixTable({
  roles,
  catalog,
  matrix,
}: {
  roles: OrganizationRole[];
  catalog: Permission[];
  matrix: Record<string, Permission[]>;
}) {
  return (
    <section className="overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card">
      <div className="border-b border-border-subtle px-4 py-3.5 sm:px-5">
        <h2 className="text-[13px] font-semibold text-text-primary">
          Permission matrix
        </h2>
        <p className="mt-0.5 text-[12px] text-text-muted">
          Check means granted. A dash means the role cannot perform that action.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-[11px] font-semibold tracking-[0.06em] text-text-muted uppercase">
              <th className="sticky left-0 z-10 bg-surface-card px-4 py-3 font-semibold sm:px-5">
                Permission
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  className="px-3 py-3 text-center font-semibold normal-case tracking-normal"
                >
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((group) => {
              const rows = group.permissions.filter((p) =>
                catalog.length === 0 ? true : catalog.includes(p),
              );
              if (rows.length === 0) return null;
              return (
                <GroupRows
                  key={group.id}
                  group={group}
                  rows={rows}
                  roles={roles}
                  matrix={matrix}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GroupRows({
  group,
  rows,
  roles,
  matrix,
}: {
  group: (typeof PERMISSION_GROUPS)[number];
  rows: Permission[];
  roles: OrganizationRole[];
  matrix: Record<string, Permission[]>;
}) {
  return (
    <>
      <tr className="border-b border-border-subtle bg-background-secondary/60">
        <td
          colSpan={roles.length + 1}
          className="sticky left-0 px-4 py-2 text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase sm:px-5"
        >
          {group.label}
          <span className="ml-2 font-medium tracking-normal text-text-muted normal-case">
            {group.hint}
          </span>
        </td>
      </tr>
      {rows.map((perm) => (
        <tr key={perm} className="border-b border-border-subtle/70 last:border-b-0">
          <td className="sticky left-0 bg-surface-card px-4 py-2.5 text-text-secondary sm:px-5">
            <span className="flex items-center gap-1.5">
              {permLabel(perm)}
              {SENSITIVE_PERMISSIONS.has(perm) ? (
                <span
                  className="inline-flex h-4 w-4 items-center justify-center text-warning"
                  title="Sensitive grant"
                >
                  <IconWarning className="h-3 w-3" />
                </span>
              ) : null}
            </span>
          </td>
          {roles.map((role) => {
            const allowed = (matrix[role.id] ?? role.permissions).includes(perm);
            return (
              <td key={role.id} className="px-3 py-2.5 text-center">
                {allowed ? (
                  <IconCheck
                    className="mx-auto h-4 w-4 text-brand-primary"
                    aria-label={`${role.name}: granted`}
                  />
                ) : (
                  <span
                    className="text-text-muted"
                    aria-label={`${role.name}: not granted`}
                  >
                    —
                  </span>
                )}
              </td>
            );
          })}
        </tr>
      ))}
    </>
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
    for (const p of REQUIRED_PERMISSIONS) base.add(p);
    return [...base];
  });
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  function toggle(perm: Permission) {
    if (isRequired(perm)) return;
    setSelected((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  }

  function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError("Use at least 2 characters.");
      return;
    }
    setNameError(null);
    void onSave({
      name: trimmed,
      description: description.trim() || null,
      permissions: Array.from(
        new Set<Permission>([...selected, ...REQUIRED_PERMISSIONS]),
      ),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-editor-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-border-subtle bg-surface-elevated shadow-elevated">
        <div className="border-b border-border-subtle px-5 py-4">
          <h2
            id="role-editor-title"
            className="text-card font-semibold text-text-primary"
          >
            {mode === "create" ? "Create role" : "Edit role"}
          </h2>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            You can only grant permissions you already have. View organization
            and create access requests stay required so members can open the
            workspace and request temporary reveal access.
          </p>
        </div>
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <label className="block">
            <span className="mb-1.5 block text-label font-medium text-text-secondary">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              className={`h-12 w-full rounded-sm border bg-background-secondary px-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:shadow-focus ${
                nameError
                  ? "border-danger"
                  : "border-border-default focus:border-brand-primary"
              }`}
              placeholder="e.g. Engineering"
              autoFocus
            />
            {nameError ? (
              <span className="mt-1 block text-[12px] text-danger">{nameError}</span>
            ) : null}
          </label>
          <label className="block">
            <span className="mb-1.5 block text-label font-medium text-text-secondary">
              Description
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
              placeholder="What this role is for"
            />
          </label>
          <div>
            <p className="mb-2 text-label font-medium text-text-secondary">
              Permissions
              <span className="ml-1.5 font-normal text-text-muted">
                {selected.length} selected
              </span>
            </p>
            <div className="max-h-72 space-y-3 overflow-y-auto rounded-sm border border-border-subtle p-3">
              {PERMISSION_GROUPS.map((group) => {
                const perms = group.permissions.filter((p) =>
                  grantable.includes(p),
                );
                if (perms.length === 0) return null;
                return (
                  <fieldset key={group.id} className="min-w-0">
                    <legend className="text-[11px] font-semibold tracking-[0.06em] text-text-muted uppercase">
                      {group.label}
                    </legend>
                    <ul className="mt-1.5 m-0 list-none space-y-0.5 p-0">
                      {perms.map((perm) => {
                        const locked = isRequired(perm);
                        const sensitive = SENSITIVE_PERMISSIONS.has(perm);
                        const checked = selected.includes(perm) || locked;
                        return (
                          <li key={perm}>
                            <label
                              className={`flex items-start gap-2.5 rounded-sm px-2 py-2 text-[12px] ${
                                locked
                                  ? "cursor-default"
                                  : "cursor-pointer hover:bg-surface-card"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={locked || saving}
                                onChange={() => toggle(perm)}
                                className="mt-0.5 accent-brand-primary"
                              />
                              <span className="min-w-0">
                                <span className="text-text-primary">
                                  {permLabel(perm)}
                                </span>
                                {locked ? (
                                  <span className="ml-1.5 text-[10px] text-text-muted">
                                    Required
                                  </span>
                                ) : null}
                                {sensitive ? (
                                  <span className="ml-1.5 text-[10px] font-semibold text-warning">
                                    Sensitive
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="h-10 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || name.trim().length < 2 || selected.length === 0}
            onClick={submit}
            className="h-10 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50 focus-visible:outline-none focus-visible:shadow-focus"
          >
            {saving ? "Saving…" : mode === "create" ? "Create role" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleListSkeleton() {
  return (
    <div className="px-4 py-2" aria-busy="true" aria-label="Loading roles">
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border-subtle py-3.5 last:border-b-0"
        >
          <div className="h-9 w-9 animate-pulse rounded-sm bg-surface-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-36 animate-pulse rounded-sm bg-surface-elevated" />
            <div className="h-2.5 w-52 animate-pulse rounded-sm bg-background-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRoles({
  hasRoles,
  kindFilter,
  canCreate,
  onCreate,
  onClear,
}: {
  hasRoles: boolean;
  kindFilter: KindFilter;
  canCreate: boolean;
  onCreate: () => void;
  onClear: () => void;
}) {
  if (hasRoles) {
    return (
      <div className="px-6 py-14 text-center">
        <p className="text-[14px] font-semibold text-text-primary">No matching roles</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-text-secondary">
          Nothing matches this search or filter.
        </p>
        <button
          type="button"
          onClick={onClear}
          className="mt-4 inline-flex h-9 items-center rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary"
        >
          Clear filters
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-14 text-center">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
        <IconUsers className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[14px] font-semibold text-text-primary">
        {kindFilter === "custom" ? "No custom roles yet" : "No roles loaded"}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-[13px] text-text-secondary">
        {kindFilter === "custom"
          ? "Create a role with only the grants this team actually needs — instead of giving everyone Admin."
          : "Roles will appear here when the workspace finishes loading."}
      </p>
      {canCreate && kindFilter === "custom" ? (
        <button
          type="button"
          onClick={onCreate}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover"
        >
          <IconPlus className="h-4 w-4" />
          Create role
        </button>
      ) : null}
    </div>
  );
}
