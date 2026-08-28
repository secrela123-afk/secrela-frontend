"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  type MembershipRole,
  type OrgRoleRef,
  type OrganizationMember,
} from "../../../lib/api";
import {
  usePendingInvitesQuery,
  useResendInviteMutation,
  useRevokeInviteMutation,
} from "../../../hooks/queries/useInvitesQuery";
import { useMembersQuery } from "../../../hooks/queries/useMembersQuery";
import {
  useDisableMemberMutation,
  useEnableMemberMutation,
  useRemoveMemberMutation,
  useUpdateMemberRoleMutation,
} from "../../../hooks/queries/useMembersMutations";
import { useOrganizationRolesQuery } from "../../../hooks/queries/useRolesMutations";
import { InviteMemberModal } from "../InviteMemberModal";
import { ConfirmDialog, RowActionsMenu } from "../RowActionsMenu";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { formatPlanLimit } from "../../../lib/plan-entitlements";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import { isOwnerOrAdminRole } from "../../../lib/app-nav";
import { toast } from "../../../stores/toast-store";
import { isAnyQueryBooting } from "../../../lib/query-status";
import { Avatar, PageLoading } from "../ui";
import {
  IconPlus,
  IconSecurity,
  IconUsers,
} from "../icons";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/** Display label for a role name (or legacy system key). */
function roleLabel(name: string) {
  return name;
}

function RolePill({ role }: { role: string }) {
  const key = role.trim().toLowerCase();
  if (key === "owner") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-brand-primary/40 bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
        <IconSecurity className="h-3 w-3" />
        {role}
      </span>
    );
  }
  if (key === "admin") {
    return (
      <span className="inline-flex items-center rounded-sm bg-purple/15 px-2 py-0.5 text-[11px] font-semibold text-purple">
        {role}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-sm bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
      {role}
    </span>
  );
}

type TableRow =
  | {
      kind: "member";
      id: string;
      userId: string;
      name: string;
      email: string;
      role: OrgRoleRef;
      status: "active" | "unverified" | "disabled";
      mfa: boolean;
      joinedAt: string;
    }
  | {
      kind: "invite";
      id: string;
      email: string;
      roleId: string;
      roleName: string;
      status: "invited";
      expiresAt: string;
    };

/**
 * Members hub — layout aligned to design reference (SecureVault roles only).
 * Page feedback → toast. Modal/form errors → inline.
 */
export function MembersPage() {
  const { can, role: myRole, user } = useRequiredWorkspace();
  const canChangeRole = can("member.role.update");
  const canRemove = can("member.remove");
  const canDisable = can("member.disable");
  const membersQuery = useMembersQuery();
  const invitesQuery = usePendingInvitesQuery();
  const { data: rolesData } = useOrganizationRolesQuery();
  const revokeInvite = useRevokeInviteMutation();
  const resendInvite = useResendInviteMutation();
  const updateRole = useUpdateMemberRoleMutation();
  const removeMember = useRemoveMemberMutation();
  const disableMember = useDisableMemberMutation();
  const enableMember = useEnableMemberMutation();

  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];
  const entitlementsQuery = usePlanEntitlementsQuery();
  const planCaps = entitlementsQuery.data?.capabilities;
  const planEntitlements = entitlementsQuery.data?.entitlements;
  const planUsage = entitlementsQuery.data?.usage;
  const canInviteByPlan = planCaps?.inviteMember ?? true;
  const canInvite =
    isOwnerOrAdminRole(myRole) && can("member.invite") && canInviteByPlan;
  const isSoloOwner =
    myRole?.systemKey === "owner" &&
    members.length === 1 &&
    invites.length === 0;
  const isBooting = isAnyQueryBooting(membersQuery, invitesQuery);
  const error = membersQuery.error ?? invitesQuery.error;
  const refetch = () => {
    void membersQuery.refetch();
    void invitesQuery.refetch();
  };

  const inviteableRoles = useMemo(
    () =>
      (rolesData?.roles ?? []).filter((role) => role.systemKey !== "owner"),
    [rolesData?.roles],
  );

  const allRoles = rolesData?.roles ?? [];

  const defaultInviteRoleId = useMemo(() => {
    const admin = inviteableRoles.find((r) => r.systemKey === "admin");
    return admin?.id ?? inviteableRoles[0]?.id ?? "";
  }, [inviteableRoles]);

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "invited" | "unverified" | "disabled"
  >("all");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sidebarEmail, setSidebarEmail] = useState("");
  const [sidebarRoleId, setSidebarRoleId] = useState("");
  const [roleEdit, setRoleEdit] = useState<{
    id: string;
    name: string;
    roleId: string;
    roleName: string;
  } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [disableTarget, setDisableTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!sidebarRoleId && defaultInviteRoleId) {
      setSidebarRoleId(defaultInviteRoleId);
    }
  }, [sidebarRoleId, defaultInviteRoleId]);

  useEffect(() => {
    if (error) {
      toast.error(
        "Could not load members",
        error instanceof ApiError ? error.message : "Refresh and try again.",
      );
    }
  }, [error]);

  const stats = useMemo(() => {
    const total = members.length;
    const disabled = members.filter((m) => m.status === "disabled").length;
    const active = members.filter(
      (m) => m.status !== "disabled" && m.user.emailVerified,
    ).length;
    const unverified = members.filter(
      (m) => m.status !== "disabled" && !m.user.emailVerified,
    ).length;
    const pending = invites.length;
    const activePct = total === 0 ? 0 : Math.round((active / total) * 100);
    return { total, active, unverified, pending, activePct, disabled };
  }, [members, invites]);

  const roleCounts = useMemo(() => {
    const counts = { owner: 0, admin: 0, member: 0 };
    for (const m of members) {
      if (m.role.systemKey === "owner") counts.owner += 1;
      else if (m.role.systemKey === "admin") counts.admin += 1;
      else counts.member += 1;
    }
    return counts;
  }, [members]);

  const rows = useMemo((): TableRow[] => {
    const memberRows: TableRow[] = members.map((m: OrganizationMember) => ({
      kind: "member",
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status:
        m.status === "disabled"
          ? "disabled"
          : m.user.emailVerified
            ? "active"
            : "unverified",
      mfa: m.user.mfaEnabled,
      joinedAt: m.createdAt,
    }));
    const inviteRows: TableRow[] = invites.map((inv) => ({
      kind: "invite",
      id: inv.id,
      email: inv.email,
      roleId: inv.roleId,
      roleName: inv.roleName,
      status: "invited",
      expiresAt: inv.expiresAt,
    }));
    return [...memberRows, ...inviteRows];
  }, [members, invites]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (roleFilter !== "all") {
        if (row.kind === "member") {
          const matchId = row.role.id === roleFilter;
          const matchName =
            row.role.name.toLowerCase() === roleFilter.toLowerCase();
          if (!matchId && !matchName) return false;
        } else {
          const matchId = row.roleId === roleFilter;
          const matchName =
            row.roleName.toLowerCase() === roleFilter.toLowerCase();
          if (!matchId && !matchName) return false;
        }
      }
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      if (row.kind === "member") {
        return (
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.role.name.toLowerCase().includes(q)
        );
      }
      return (
        row.email.toLowerCase().includes(q) ||
        row.roleName.toLowerCase().includes(q)
      );
    });
  }, [rows, query, roleFilter, statusFilter]);

  async function onRevoke(invitationId: string, email: string) {
    try {
      await revokeInvite.mutateAsync(invitationId);
      toast.success(
        "Invitation revoked",
        `${email} can no longer join with that link.`,
      );
    } catch (err) {
      toast.error(
        "Could not revoke invite",
        err instanceof ApiError ? err.message : "Try again in a moment.",
      );
    }
  }

  async function onResend(invitationId: string, email: string) {
    try {
      await resendInvite.mutateAsync(invitationId);
      toast.success("Invitation resent", `A new email was sent to ${email}.`);
    } catch (err) {
      toast.error(
        "Could not resend invite",
        err instanceof ApiError ? err.message : "Try again in a moment.",
      );
    }
  }

  async function copyEmail(email: string) {
    try {
      await navigator.clipboard.writeText(email);
      toast.success("Email copied", email);
    } catch {
      toast.error("Could not copy email", "Clipboard access was blocked.");
    }
  }

  /** Target-side gate: never manage Owner or yourself. Action perms use can(). */
  function canManageTarget(
    targetSystemKey: MembershipRole | null,
    targetUserId?: string,
  ) {
    if (targetSystemKey === "owner") return false;
    if (targetUserId && targetUserId === user.id) return false;
    return true;
  }

  async function onConfirmRoleChange() {
    if (!roleEdit) return;
    try {
      await updateRole.mutateAsync({
        membershipId: roleEdit.id,
        roleId: roleEdit.roleId,
      });
      toast.success(
        "Role updated",
        `${roleEdit.name} is now ${roleLabel(roleEdit.roleName)}.`,
      );
      setRoleEdit(null);
    } catch (err) {
      toast.error(
        "Could not update role",
        err instanceof ApiError ? err.message : "Try again in a moment.",
      );
    }
  }

  async function onConfirmRemove() {
    if (!removeTarget) return;
    try {
      await removeMember.mutateAsync(removeTarget.id);
      toast.success(
        "Member deleted",
        `${removeTarget.name} was signed out and needs a new invite to return.`,
      );
      setRemoveTarget(null);
    } catch (err) {
      toast.error(
        "Could not delete member",
        err instanceof ApiError ? err.message : "Try again in a moment.",
      );
    }
  }

  async function onConfirmDisable() {
    if (!disableTarget) return;
    try {
      await disableMember.mutateAsync(disableTarget.id);
      toast.success(
        "Member disabled",
        `${disableTarget.name} cannot use the workspace until re-enabled.`,
      );
      setDisableTarget(null);
    } catch (err) {
      toast.error(
        "Could not disable member",
        err instanceof ApiError ? err.message : "Try again in a moment.",
      );
    }
  }

  async function onEnableMember(row: {
    id: string;
    name: string;
  }) {
    try {
      await enableMember.mutateAsync(row.id);
      toast.success("Member enabled", `${row.name} can use the workspace again.`);
    } catch (err) {
      toast.error(
        "Could not enable member",
        err instanceof ApiError ? err.message : "Try again in a moment.",
      );
    }
  }

  function openInvite(prefill?: { email?: string; roleId?: string }) {
    if (!isOwnerOrAdminRole(myRole) || !can("member.invite")) {
      toast.warning(
        "Permission required",
        "You need permission to invite members.",
      );
      return;
    }
    if (!canInviteByPlan) {
      toast.warning(
        "Plan limit",
        planEntitlements
          ? `Your plan allows ${formatPlanLimit(planEntitlements.maxMembers)} seat(s). Upgrade to invite more team members.`
          : "Your member limit has been reached.",
      );
      return;
    }
    if (prefill?.email) setSidebarEmail(prefill.email);
    if (prefill?.roleId) setSidebarRoleId(prefill.roleId);
    setInviteOpen(true);
  }

  const totalForChart = Math.max(
    roleCounts.owner + roleCounts.admin + roleCounts.member,
    1,
  );

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
            Members
          </h1>
          <p className="mt-1 max-w-2xl text-small text-text-secondary">
            Manage organization members and their access to vaults and secrets.
          </p>
          <p className="mt-1 text-[12px] text-text-muted">
            Your role:{" "}
            <span className="font-semibold text-text-primary">
              {myRole.name}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => openInvite()}
          disabled={!canInvite}
          className="inline-flex h-10 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IconPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {planEntitlements && planUsage && !canInviteByPlan ? (
        <PlanUpgradePrompt
          className="mb-5"
          title="Member limit reached"
          description={`Your plan allows ${formatPlanLimit(planEntitlements.maxMembers)} seat(s). You are using ${planUsage.seatsUsed}. Upgrade to invite more team members.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      {isSoloOwner && !isBooting ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-brand-primary/35 bg-brand-primary/10 px-3.5 py-3">
          <IconUsers className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary" />
          <div className="text-[13px] leading-relaxed text-text-secondary">
            <p className="font-semibold text-text-primary">
              You are the only member
            </p>
            <p className="mt-0.5">
              Admin is a role you assign when you invite someone — not a second
              account. Invite an Admin to help manage the workspace. Owner and
              Admin can both invite more people.
            </p>
            <button
              type="button"
              onClick={() =>
                openInvite({ roleId: defaultInviteRoleId || undefined })
              }
              className="mt-2 text-[12px] font-semibold text-brand-primary hover:text-brand-primary-hover"
            >
              Invite your first Admin →
            </button>
          </div>
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Members"
          value={String(stats.total)}
          hint={`${members.filter((m) => {
            const d = Date.now() - new Date(m.createdAt).getTime();
            return d < 30 * 24 * 60 * 60 * 1000;
          }).length} joined in last 30 days`}
          icon={<IconUsers className="h-4 w-4 text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />
        <StatCard
          label="Active Members"
          value={String(stats.active)}
          hint={`${stats.activePct}% of total verified`}
          icon={<IconSecurity className="h-4 w-4 text-brand-primary" />}
          iconBg="bg-brand-primary/10"
        />
        <StatCard
          label="Pending Invitations"
          value={String(stats.pending)}
          hint={
            stats.pending > 0 ? (
              <button
                type="button"
                className="text-warning hover:underline"
                onClick={() => setStatusFilter("invited")}
              >
                View invitations
              </button>
            ) : (
              "No open invites"
            )
          }
          icon={
            <span className="text-[14px] font-bold text-warning" aria-hidden>
              ✉
            </span>
          }
          iconBg="bg-warning/10"
        />
        <StatCard
          label="Unverified"
          value={String(stats.unverified)}
          hint={
            stats.unverified > 0 ? (
              <button
                type="button"
                className="text-text-muted hover:underline"
                onClick={() => setStatusFilter("unverified")}
              >
                View unverified
              </button>
            ) : (
              "All members verified"
            )
          }
          icon={<IconUsers className="h-4 w-4 text-text-muted" />}
          iconBg="bg-surface-elevated"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
        {/* Main table — full height grows with content; page scrolls, not an inner table scroll */}
        <section className="min-w-0 overflow-visible rounded-md border border-border-subtle bg-surface-card shadow-card">
          <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle p-3 sm:p-4">
            <div className="relative min-w-[220px] flex-1">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted">
                ⌕
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search members…"
                className="h-10 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
            >
              <option value="all">All Roles</option>
              {allRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "all"
                    | "active"
                    | "invited"
                    | "unverified"
                    | "disabled",
                )
              }
              className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="unverified">Unverified</option>
              <option value="disabled">Disabled</option>
            </select>
            <button
              type="button"
              onClick={() => void refetch()}
              className="h-10 rounded-sm border border-border-default px-3 text-[12px] font-semibold text-text-secondary hover:border-brand-primary hover:text-brand-primary"
            >
              Refresh
            </button>
          </div>

          {isBooting ? (
            <PageLoading label="Loading members…" />
          ) : (
            <div className="w-full overflow-visible">
              <table className="w-full table-fixed border-collapse text-left text-[14px]">
                <colgroup>
                  <col className="w-[32%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                  <col className="w-[14%]" />
                  <col className="w-[16%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.08em] text-text-muted">
                    <th className="px-5 py-4 font-semibold">Member</th>
                    <th className="px-4 py-4 font-semibold">Role</th>
                    <th className="px-4 py-4 font-semibold">Status</th>
                    <th className="px-4 py-4 font-semibold">MFA</th>
                    <th className="px-4 py-4 font-semibold">Joined</th>
                    <th className="px-4 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) =>
                    row.kind === "member" ? (
                      <tr
                        key={`m-${row.id}`}
                        className="border-b border-border-subtle/80 transition-colors hover:bg-surface-elevated/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar initials={initials(row.name)} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-text-primary">
                                {row.name}
                              </p>
                              <p className="truncate text-[12px] text-text-muted">
                                {row.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <RolePill role={row.role.name} />
                        </td>
                        <td className="px-4 py-4">
                          {row.status === "active" ? (
                            <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-brand-primary">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
                              Active
                            </span>
                          ) : row.status === "disabled" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-sm bg-danger/10 px-2 py-0.5 text-[11px] font-semibold text-danger">
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-sm bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {row.mfa ? (
                            <span className="inline-flex text-brand-primary" title="MFA enabled">
                              <IconSecurity className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="text-[12px] text-text-muted">Off</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-text-muted">
                          {new Date(row.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <RowActionsMenu
                            items={[
                              {
                                id: "copy",
                                label: "Copy email",
                                onSelect: () => void copyEmail(row.email),
                              },
                              ...(canChangeRole &&
                              canManageTarget(row.role.systemKey, row.userId)
                                ? [
                                    {
                                      id: "role",
                                      label: "Change role",
                                      onSelect: () =>
                                        setRoleEdit({
                                          id: row.id,
                                          name: row.name,
                                          roleId: row.role.id,
                                          roleName: row.role.name,
                                        }),
                                    },
                                  ]
                                : []),
                              ...(canDisable &&
                              canManageTarget(row.role.systemKey, row.userId)
                                ? [
                                    row.status === "disabled"
                                      ? {
                                          id: "enable",
                                          label: "Enable member",
                                          onSelect: () =>
                                            void onEnableMember({
                                              id: row.id,
                                              name: row.name,
                                            }),
                                        }
                                      : {
                                          id: "disable",
                                          label: "Disable member",
                                          onSelect: () =>
                                            setDisableTarget({
                                              id: row.id,
                                              name: row.name,
                                            }),
                                        },
                                  ]
                                : []),
                              ...(canRemove &&
                              canManageTarget(row.role.systemKey, row.userId)
                                ? [
                                    {
                                      id: "remove",
                                      label: "Delete member",
                                      tone: "danger" as const,
                                      onSelect: () =>
                                        setRemoveTarget({
                                          id: row.id,
                                          name: row.name,
                                        }),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={`i-${row.id}`}
                        className="border-b border-border-subtle/80 transition-colors hover:bg-surface-elevated/50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar
                              initials={row.email.slice(0, 2).toUpperCase()}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-text-primary">
                                Pending invite
                              </p>
                              <p className="truncate text-[12px] text-text-muted">
                                {row.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <RolePill role={row.roleName} />
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-warning">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            Invited
                          </span>
                        </td>
                        <td className="px-4 py-4 text-text-muted">—</td>
                        <td className="px-4 py-4 text-[12px] text-text-muted">
                          Exp. {new Date(row.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <RowActionsMenu
                            items={[
                              {
                                id: "copy",
                                label: "Copy email",
                                onSelect: () => void copyEmail(row.email),
                              },
                              ...(canInvite
                                ? [
                                    {
                                      id: "resend",
                                      label: "Resend invite",
                                      tone: "brand" as const,
                                      disabled: resendInvite.isPending,
                                      onSelect: () =>
                                        void onResend(row.id, row.email),
                                    },
                                    {
                                      id: "revoke",
                                      label: "Revoke invite",
                                      tone: "danger" as const,
                                      disabled: revokeInvite.isPending,
                                      onSelect: () =>
                                        void onRevoke(row.id, row.email),
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    ),
                  )}
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-text-muted"
                      >
                        No members match your filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3 text-[12px] text-text-muted">
            <span>
              Showing {filtered.length} of {rows.length} entries
            </span>
          </div>
        </section>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          <section className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
            <h2 className="text-[13px] font-semibold text-text-primary">
              Invite Member
            </h2>
            <p className="mt-1 text-[12px] text-text-muted">
              Send an email invite with a workspace role.
            </p>
            <div className="mt-3 space-y-2.5">
              <input
                type="email"
                value={sidebarEmail}
                onChange={(e) => setSidebarEmail(e.target.value)}
                placeholder="name@company.com"
                disabled={!canInvite}
                className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus disabled:opacity-50"
              />
              <select
                value={sidebarRoleId}
                onChange={(e) => setSidebarRoleId(e.target.value)}
                disabled={!canInvite || inviteableRoles.length === 0}
                className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary disabled:opacity-50"
              >
                {inviteableRoles.length === 0 ? (
                  <option value="">Loading roles…</option>
                ) : (
                  inviteableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() =>
                  openInvite({
                    email: sidebarEmail.trim() || undefined,
                    roleId: sidebarRoleId || undefined,
                  })
                }
                className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-sm bg-brand-primary text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover"
              >
                Send Invitation
              </button>
            </div>
          </section>

          <section className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
            <h2 className="text-[13px] font-semibold text-text-primary">
              Role Distribution
            </h2>
            <div className="mt-4 flex items-center gap-4">
              <RoleDonut
                owner={roleCounts.owner}
                admin={roleCounts.admin}
                member={roleCounts.member}
                total={totalForChart}
              />
              <ul className="space-y-1.5 text-[12px]">
                {roleCounts.owner > 0 ? (
                  <li className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-brand-primary" />
                    Owner {Math.round((roleCounts.owner / totalForChart) * 100)}%
                  </li>
                ) : null}
                {roleCounts.admin > 0 ? (
                  <li className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-purple" />
                    Admin {Math.round((roleCounts.admin / totalForChart) * 100)}%
                  </li>
                ) : (
                  <li className="text-[11px] text-text-muted">
                    Admin — unassigned until you invite someone
                  </li>
                )}
                {roleCounts.member > 0 ? (
                  <li className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-border-default" />
                    Other / custom{" "}
                    {Math.round((roleCounts.member / totalForChart) * 100)}%
                  </li>
                ) : null}
              </ul>
            </div>
          </section>

          <section className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
            <h2 className="text-[13px] font-semibold text-text-primary">
              Member Activity
            </h2>
            <ul className="mt-3 space-y-2 text-[12px] text-text-secondary">
              <li>
                <span className="font-semibold text-text-primary">
                  {
                    members.filter((m) => {
                      const d = Date.now() - new Date(m.createdAt).getTime();
                      return d < 30 * 24 * 60 * 60 * 1000;
                    }).length
                  }
                </span>{" "}
                joined this month
              </li>
              <li>
                <span className="font-semibold text-text-primary">
                  {stats.active}
                </span>{" "}
                verified accounts
              </li>
              <li>
                <span className="font-semibold text-text-primary">
                  {stats.pending}
                </span>{" "}
                pending invitations
              </li>
            </ul>
          </section>
        </aside>
      </div>

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        initialEmail={sidebarEmail}
        initialRoleId={sidebarRoleId || undefined}
      />

      {roleEdit ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !updateRole.isPending) {
              setRoleEdit(null);
            }
          }}
        >
          <div className="w-full max-w-sm rounded-md border border-border-subtle bg-surface-card p-5 shadow-card">
            <h2 className="text-[1.05rem] font-semibold text-text-primary">
              Change role
            </h2>
            <p className="mt-2 text-[13px] text-text-secondary">
              Update access for{" "}
              <span className="font-semibold text-text-primary">
                {roleEdit.name}
              </span>
              .
            </p>
            <div className="mt-4 max-h-56 space-y-2 overflow-y-auto">
              {inviteableRoles.length === 0 ? (
                <p className="text-[13px] text-text-muted">Loading roles…</p>
              ) : (
                inviteableRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() =>
                      setRoleEdit({
                        ...roleEdit,
                        roleId: role.id,
                        roleName: role.name,
                      })
                    }
                    className={`w-full rounded-sm border px-3 py-2 text-left text-[13px] font-semibold ${
                      roleEdit.roleId === role.id
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-border-default text-text-secondary"
                    }`}
                  >
                    {role.name}
                  </button>
                ))
              )}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={updateRole.isPending}
                onClick={() => setRoleEdit(null)}
                className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updateRole.isPending || !roleEdit.roleId}
                onClick={() => void onConfirmRoleChange()}
                className="h-9 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50"
              >
                {updateRole.isPending ? "Saving…" : "Save role"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(disableTarget)}
        title="Disable member"
        description={
          <>
            Disable{" "}
            <span className="font-semibold text-text-primary">
              {disableTarget?.name}
            </span>
            ? They will be signed out and cannot use the workspace until you
            enable them again.
          </>
        }
        confirmLabel="Disable"
        danger
        loading={disableMember.isPending}
        onClose={() => setDisableTarget(null)}
        onConfirm={() => void onConfirmDisable()}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Delete member"
        description={
          <>
            Delete{" "}
            <span className="font-semibold text-text-primary">
              {removeTarget?.name}
            </span>{" "}
            from this workspace? They will be signed out immediately. Old invite
            links stop working — they need a new invitation to join again.
          </>
        }
        confirmLabel="Delete"
        danger
        loading={removeMember.isPending}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void onConfirmRemove()}
      />
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

function RoleDonut({
  owner,
  admin,
  member,
  total,
}: {
  owner: number;
  admin: number;
  member: number;
  total: number;
}) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const ownerLen = (owner / total) * c;
  const adminLen = (admin / total) * c;
  const memberLen = (member / total) * c;

  return (
    <div className="relative h-[88px] w-[88px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden>
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth="8"
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--color-brand-primary)"
          strokeWidth="8"
          strokeDasharray={`${ownerLen} ${c - ownerLen}`}
          strokeDashoffset={0}
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--color-purple)"
          strokeWidth="8"
          strokeDasharray={`${adminLen} ${c - adminLen}`}
          strokeDashoffset={-ownerLen}
        />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--color-border-default)"
          strokeWidth="8"
          strokeDasharray={`${memberLen} ${c - memberLen}`}
          strokeDashoffset={-(ownerLen + adminLen)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-text-primary">
          {owner + admin + member}
        </span>
      </div>
    </div>
  );
}
