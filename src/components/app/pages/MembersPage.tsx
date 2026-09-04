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
import { ConfirmDialog, RowActionsMenu, type ActionItem } from "../RowActionsMenu";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { formatPlanLimit, formatPlanUsage } from "../../../lib/plan-entitlements";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import { isOwnerOrAdminRole } from "../../../lib/app-nav";
import { BILLING_PATH } from "../../../lib/routes";
import { toast } from "../../../stores/toast-store";
import { isAnyQueryBooting } from "../../../lib/query-status";
import { Avatar } from "../ui";
import {
  IconCheck,
  IconChevronRight,
  IconMail,
  IconPlus,
  IconSearch,
  IconSecurity,
  IconUser,
  IconUsers,
  IconWarning,
  IconX,
} from "../icons";
import Link from "next/link";

const PAGE_SIZE = 8;

type DirectoryTab = "all" | "active" | "invited" | "attention";
type SortKey = "name-asc" | "name-desc" | "newest" | "oldest" | "role";

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function rowLabel(row: TableRow) {
  return row.kind === "member" ? row.name : row.email;
}

function rowRoleName(row: TableRow) {
  return row.kind === "member" ? row.role.name : row.roleName;
}

function rowSortDate(row: TableRow) {
  return row.kind === "member" ? row.joinedAt : row.expiresAt;
}

function formatJoined(iso: string): string {
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
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isAttentionRow(row: TableRow) {
  if (row.kind === "invite") return true;
  return row.status === "unverified" || row.status === "disabled" || !row.mfa;
}

/**
 * Members directory — who can enter this workspace, and under which role.
 * Page feedback → toast. Modal/form errors → inline. Destructive actions confirm.
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
  const [tab, setTab] = useState<DirectoryTab>("all");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [sidebarEmail, setSidebarEmail] = useState("");
  const [sidebarRoleId, setSidebarRoleId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
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
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    email: string;
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
    const withoutMfa = members.filter(
      (m) => m.status !== "disabled" && !m.user.mfaEnabled,
    ).length;
    const mfaOn = members.filter(
      (m) => m.status !== "disabled" && m.user.mfaEnabled,
    ).length;
    const seated = members.filter((m) => m.status !== "disabled").length;
    const pending = invites.length;
    const mfaPct = seated === 0 ? 0 : Math.round((mfaOn / seated) * 100);
    return {
      total,
      active,
      unverified,
      pending,
      disabled,
      withoutMfa,
      mfaOn,
      mfaPct,
      seated,
    };
  }, [members, invites]);

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
    const next = rows.filter((row) => {
      if (tab === "active") {
        if (row.kind !== "member" || row.status !== "active") return false;
      } else if (tab === "invited") {
        if (row.kind !== "invite") return false;
      } else if (tab === "attention") {
        if (!isAttentionRow(row)) return false;
      }
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

    next.sort((a, b) => {
      if (sort === "name-asc") return rowLabel(a).localeCompare(rowLabel(b));
      if (sort === "name-desc") return rowLabel(b).localeCompare(rowLabel(a));
      if (sort === "role") return rowRoleName(a).localeCompare(rowRoleName(b));
      const da = new Date(rowSortDate(a)).getTime();
      const db = new Date(rowSortDate(b)).getTime();
      return sort === "newest" ? db - da : da - db;
    });
    return next;
  }, [rows, query, roleFilter, tab, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, tab, sort]);

  const selected = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    if (selectedId && !rows.some((row) => row.id === selectedId)) {
      setSelectedId(null);
    }
  }, [rows, selectedId]);

  async function onRevoke(invitationId: string, email: string) {
    try {
      await revokeInvite.mutateAsync(invitationId);
      toast.success(
        "Invitation revoked",
        `${email} can no longer join with that link.`,
      );
      setRevokeTarget(null);
      if (selectedId === invitationId) setSelectedId(null);
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
        `${roleEdit.name} is now ${roleEdit.roleName}.`,
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
      if (selectedId === removeTarget.id) setSelectedId(null);
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

  async function onEnableMember(row: { id: string; name: string }) {
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

  function memberActions(row: Extract<TableRow, { kind: "member" }>): ActionItem[] {
    const items: ActionItem[] = [
      {
        id: "copy",
        label: "Copy email",
        onSelect: () => void copyEmail(row.email),
      },
    ];
    if (canChangeRole && canManageTarget(row.role.systemKey, row.userId)) {
      items.push({
        id: "role",
        label: "Change role",
        onSelect: () =>
          setRoleEdit({
            id: row.id,
            name: row.name,
            roleId: row.role.id,
            roleName: row.role.name,
          }),
      });
    }
    if (canDisable && canManageTarget(row.role.systemKey, row.userId)) {
      items.push(
        row.status === "disabled"
          ? {
              id: "enable",
              label: "Enable member",
              onSelect: () => void onEnableMember({ id: row.id, name: row.name }),
            }
          : {
              id: "disable",
              label: "Disable member",
              onSelect: () => setDisableTarget({ id: row.id, name: row.name }),
            },
      );
    }
    if (canRemove && canManageTarget(row.role.systemKey, row.userId)) {
      items.push({
        id: "remove",
        label: "Delete member",
        tone: "danger",
        onSelect: () => setRemoveTarget({ id: row.id, name: row.name }),
      });
    }
    return items;
  }

  function inviteActions(row: Extract<TableRow, { kind: "invite" }>): ActionItem[] {
    const items: ActionItem[] = [
      {
        id: "copy",
        label: "Copy email",
        onSelect: () => void copyEmail(row.email),
      },
    ];
    if (canInvite) {
      items.push(
        {
          id: "resend",
          label: "Resend invite",
          tone: "brand",
          disabled: resendInvite.isPending,
          onSelect: () => void onResend(row.id, row.email),
        },
        {
          id: "revoke",
          label: "Revoke invite",
          tone: "danger",
          disabled: revokeInvite.isPending,
          onSelect: () => setRevokeTarget({ id: row.id, email: row.email }),
        },
      );
    }
    return items;
  }

  const attentionCount = rows.filter(isAttentionRow).length;
  const inviteDisabledReason = !isOwnerOrAdminRole(myRole) || !can("member.invite")
    ? "You need invite permission"
    : !canInviteByPlan
      ? "Seat limit reached"
      : undefined;

  const tabs: { id: DirectoryTab; label: string; count: number }[] = [
    { id: "all", label: "Everyone", count: rows.length },
    { id: "active", label: "Active", count: stats.active },
    { id: "invited", label: "Invited", count: stats.pending },
    { id: "attention", label: "Needs attention", count: attentionCount },
  ];

  return (
    <div className="p-4 lg:p-6">
      <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-section font-semibold tracking-tight text-text-primary">
            Members
          </h1>
          <p className="mt-1 max-w-xl text-small text-text-secondary">
            People who can enter this workspace — and the role that bounds what
            they can see, reveal, or approve.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-text-muted">
            <span>
              Your role{" "}
              <span className="font-semibold text-text-primary">{myRole.name}</span>
            </span>
            {planUsage && planEntitlements ? (
              isOwnerOrAdminRole(myRole) ? (
                <Link
                  href={BILLING_PATH}
                  className="text-text-muted no-underline hover:text-brand-primary"
                >
                  Seats{" "}
                  <span className="font-semibold text-text-primary">
                    {formatPlanUsage(
                      planUsage.seatsUsed,
                      planEntitlements.maxMembers,
                    )}
                  </span>
                </Link>
              ) : (
                <span>
                  Seats{" "}
                  <span className="font-semibold text-text-primary">
                    {formatPlanUsage(
                      planUsage.seatsUsed,
                      planEntitlements.maxMembers,
                    )}
                  </span>
                </span>
              )
            ) : null}
            <span>
              MFA coverage{" "}
              <span
                className={`font-semibold ${
                  stats.mfaPct === 100
                    ? "text-brand-primary"
                    : stats.seated === 0
                      ? "text-text-primary"
                      : "text-warning"
                }`}
              >
                {stats.seated === 0 ? "—" : `${stats.mfaPct}%`}
              </span>
              <span className="sr-only">
                {stats.mfaOn} of {stats.seated} seated members have MFA enabled
              </span>
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openInvite()}
          disabled={!canInvite}
          title={inviteDisabledReason}
          className="inline-flex h-11 items-center gap-1.5 self-start rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary shadow-glow-green transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          <IconPlus className="h-4 w-4" />
          Invite member
        </button>
      </header>

      {planEntitlements && planUsage && !canInviteByPlan ? (
        <PlanUpgradePrompt
          className="mb-5"
          title="Member limit reached"
          description={`Your plan allows ${formatPlanLimit(planEntitlements.maxMembers)} seat(s). You are using ${planUsage.seatsUsed}. Upgrade to invite more team members.`}
          snapshot={entitlementsQuery.data}
        />
      ) : null}

      {isSoloOwner && !isBooting ? (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-border-subtle bg-surface-card px-4 py-3.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
            <IconUsers className="h-4 w-4" />
          </span>
          <div className="min-w-0 text-small leading-relaxed text-text-secondary">
            <p className="font-semibold text-text-primary">You are the only member</p>
            <p className="mt-0.5">
              Owner stays with the account that created the workspace. Invite an
              Admin if someone else should help manage vaults, access, and seats.
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

      {!isBooting && attentionCount > 0 ? (
        <section
          className="mb-5 rounded-md border border-border-subtle bg-surface-card px-4 py-3"
          aria-label="Access hygiene"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-semibold text-text-primary">
                Access hygiene
              </p>
              <p className="mt-0.5 text-[12px] text-text-muted">
                These items increase exposure if they sit unreviewed.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.withoutMfa > 0 ? (
                <HygieneChip
                  label={`${stats.withoutMfa} without MFA`}
                  tone="warning"
                  onClick={() => setTab("attention")}
                />
              ) : null}
              {stats.unverified > 0 ? (
                <HygieneChip
                  label={`${stats.unverified} unverified`}
                  tone="warning"
                  onClick={() => setTab("attention")}
                />
              ) : null}
              {stats.disabled > 0 ? (
                <HygieneChip
                  label={`${stats.disabled} disabled`}
                  tone="danger"
                  onClick={() => setTab("attention")}
                />
              ) : null}
              {stats.pending > 0 ? (
                <HygieneChip
                  label={`${stats.pending} invite waiting`}
                  tone="info"
                  onClick={() => setTab("invited")}
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card">
        <div className="border-b border-border-subtle px-3 pt-2 sm:px-4">
          <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Member lists">
            {tabs.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`relative shrink-0 px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    active
                      ? "text-text-primary"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {item.label}
                  <span className="ml-1.5 tabular-nums text-text-muted">{item.count}</span>
                  {active ? (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-pill bg-brand-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-border-subtle p-3 sm:flex-row sm:items-center sm:p-4">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search members</span>
            <IconSearch className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, or role"
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
            className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary focus:shadow-focus"
          >
            <option value="all">All roles</option>
            {allRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort directory"
            className="h-10 rounded-sm border border-border-default bg-background-secondary px-2.5 text-[12px] font-medium text-text-secondary outline-none focus:border-brand-primary focus:shadow-focus"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="role">Role</option>
          </select>
        </div>

        {isBooting ? (
          <DirectorySkeleton />
        ) : filtered.length === 0 ? (
          <EmptyDirectory
            hasPeople={rows.length > 0}
            canInvite={canInvite}
            onInvite={() => openInvite()}
            onClear={() => {
              setQuery("");
              setRoleFilter("all");
              setTab("all");
            }}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full table-fixed border-collapse text-left text-small">
                <colgroup>
                  <col className="w-[34%]" />
                  <col className="w-[14%]" />
                  <col className="w-[14%]" />
                  <col className="w-[12%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border-subtle text-label tracking-[0.08em] text-text-muted uppercase">
                    <th className="px-5 py-3 font-semibold">Person</th>
                    <th className="px-4 py-3 font-semibold">Role</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">MFA</th>
                    <th className="px-4 py-3 font-semibold">Since</th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row) => {
                    const isYou =
                      row.kind === "member" && row.userId === user.id;
                    const isSelected = selectedId === row.id;
                    return (
                      <tr
                        key={`${row.kind}-${row.id}`}
                        onClick={() => setSelectedId(row.id)}
                        className={`cursor-pointer border-b border-border-subtle/80 transition-colors last:border-b-0 hover:bg-surface-elevated/60 ${
                          isSelected ? "bg-surface-elevated/80" : ""
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <PersonCell row={row} isYou={isYou} />
                        </td>
                        <td className="px-4 py-3.5">
                          <RolePill role={rowRoleName(row)} />
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusMark status={row.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          {row.kind === "member" ? (
                            <MfaMark on={row.mfa} />
                          ) : (
                            <span className="text-text-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-text-muted">
                          {row.kind === "member" ? (
                            <time dateTime={row.joinedAt} title={new Date(row.joinedAt).toLocaleString()}>
                              {formatJoined(row.joinedAt)}
                            </time>
                          ) : (
                            <span title={new Date(row.expiresAt).toLocaleString()}>
                              Expires {formatJoined(row.expiresAt)}
                            </span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <RowActionsMenu
                            items={
                              row.kind === "member"
                                ? memberActions(row)
                                : inviteActions(row)
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="m-0 list-none divide-y divide-border-subtle p-0 md:hidden">
              {paged.map((row) => {
                const isYou =
                  row.kind === "member" && row.userId === user.id;
                return (
                  <li key={`m-${row.kind}-${row.id}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className="flex w-full items-start gap-3 px-4 py-3.5 text-left hover:bg-surface-elevated/60"
                    >
                      <PersonCell row={row} isYou={isYou} />
                      <IconChevronRight className="mt-2 h-4 w-4 shrink-0 text-text-muted" />
                    </button>
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <RolePill role={rowRoleName(row)} />
                        <StatusMark status={row.status} />
                        {row.kind === "member" ? <MfaMark on={row.mfa} /> : null}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          items={
                            row.kind === "member"
                              ? memberActions(row)
                              : inviteActions(row)
                          }
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {!isBooting && filtered.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-4 py-3 text-[12px] text-text-muted">
            <span>
              {filtered.length} {filtered.length === 1 ? "person" : "people"}
              {query || roleFilter !== "all" || tab !== "all"
                ? ` · filtered from ${rows.length}`
                : null}
            </span>
            {pageCount > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-sm border border-border-default px-2.5 font-semibold text-text-secondary hover:border-brand-primary hover:text-brand-primary disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="tabular-nums">
                  {safePage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="h-8 rounded-sm border border-border-default px-2.5 font-semibold text-text-secondary hover:border-brand-primary hover:text-brand-primary disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {selected ? (
        <MemberDrawer
          row={selected}
          isYou={selected.kind === "member" && selected.userId === user.id}
          actions={
            selected.kind === "member"
              ? memberActions(selected)
              : inviteActions(selected)
          }
          onClose={() => setSelectedId(null)}
        />
      ) : null}

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
          <div className="w-full max-w-sm rounded-lg border border-border-subtle bg-surface-elevated p-5 shadow-elevated">
            <h2 className="text-card font-semibold text-text-primary">Change role</h2>
            <p className="mt-2 text-small text-text-secondary">
              This changes what{" "}
              <span className="font-semibold text-text-primary">{roleEdit.name}</span>{" "}
              can read, reveal, and approve. Owner cannot be assigned here.
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
                        : "border-border-default text-text-secondary hover:border-border-subtle"
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
            ? They will be signed out immediately and cannot use the workspace
            until you enable them again. Secrets stay in place.
          </>
        }
        confirmLabel="Disable access"
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
            from this workspace? They are signed out now. Old invite links stop
            working — they need a new invitation to return.
          </>
        }
        confirmLabel="Delete member"
        danger
        loading={removeMember.isPending}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void onConfirmRemove()}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke invitation"
        description={
          <>
            Revoke the invite to{" "}
            <span className="font-semibold text-text-primary">
              {revokeTarget?.email}
            </span>
            ? The link in their email will stop working.
          </>
        }
        confirmLabel="Revoke invite"
        danger
        loading={revokeInvite.isPending}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) void onRevoke(revokeTarget.id, revokeTarget.email);
        }}
      />
    </div>
  );
}

function PersonCell({ row, isYou }: { row: TableRow; isYou: boolean }) {
  const name = row.kind === "member" ? row.name : "Pending invite";
  const email = row.email;
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar
        initials={
          row.kind === "member"
            ? initials(row.name)
            : row.email.slice(0, 2).toUpperCase()
        }
        size="sm"
      />
      <div className="min-w-0">
        <p className="flex items-center gap-2 truncate font-semibold text-text-primary">
          <span className="truncate">{name}</span>
          {isYou ? (
            <span className="rounded-xs bg-surface-elevated px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              You
            </span>
          ) : null}
        </p>
        <p className="truncate text-[12px] text-text-muted">{email}</p>
      </div>
    </div>
  );
}

function RolePill({ role }: { role: string }) {
  const key = role.trim().toLowerCase();
  if (key === "owner") {
    return (
      <span className="inline-flex items-center gap-1 rounded-xs border border-brand-primary/35 bg-brand-primary/10 px-2 py-0.5 text-[11px] font-semibold text-brand-primary">
        <IconSecurity className="h-3 w-3" />
        {role}
      </span>
    );
  }
  if (key === "admin") {
    return (
      <span className="inline-flex items-center rounded-xs bg-purple/15 px-2 py-0.5 text-[11px] font-semibold text-purple">
        {role}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-xs bg-surface-elevated px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
      {role}
    </span>
  );
}

function StatusMark({ status }: { status: TableRow["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-primary" />
        Active
      </span>
    );
  }
  if (status === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-danger">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Disabled
      </span>
    );
  }
  if (status === "unverified") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        Unverified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-warning">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
      Invited
    </span>
  );
}

function MfaMark({ on }: { on: boolean }) {
  if (on) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-text-primary" title="Multi-factor authentication is on">
        <IconCheck className="h-3.5 w-3.5 text-brand-primary" />
        On
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary" title="Multi-factor authentication is off">
      <IconWarning className="h-3.5 w-3.5 text-warning" />
      Off
    </span>
  );
}

function HygieneChip({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: "warning" | "danger" | "info";
  onClick: () => void;
}) {
  const map = {
    warning: "border-warning/30 bg-warning/10 text-warning",
    danger: "border-danger/30 bg-danger/10 text-danger",
    info: "border-info/30 bg-info/10 text-info",
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-xs border px-2 py-1 text-[11px] font-semibold ${map[tone]}`}
    >
      {label}
    </button>
  );
}

function DirectorySkeleton() {
  return (
    <div className="px-4 py-2" aria-busy="true" aria-label="Loading members">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border-subtle py-3.5 last:border-b-0"
        >
          <div className="h-7 w-7 animate-pulse rounded-full bg-surface-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded-sm bg-surface-elevated" />
            <div className="h-2.5 w-56 animate-pulse rounded-sm bg-background-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyDirectory({
  hasPeople,
  canInvite,
  onInvite,
  onClear,
}: {
  hasPeople: boolean;
  canInvite: boolean;
  onInvite: () => void;
  onClear: () => void;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-border-subtle bg-background-secondary text-text-secondary">
        {hasPeople ? (
          <IconSearch className="h-6 w-6" />
        ) : (
          <IconUser className="h-6 w-6" />
        )}
      </span>
      <h2 className="mt-4 text-card font-semibold text-text-primary">
        {hasPeople ? "No one matches these filters" : "No one else is in this workspace"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-small text-text-secondary">
        {hasPeople
          ? "Try another name, role, or list. Filters only hide rows — they do not change access."
          : "Invite a teammate when you need someone else to manage vaults, review access, or operate secrets."}
      </p>
      <div className="mt-4 flex justify-center gap-2">
        {hasPeople ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary"
          >
            Clear filters
          </button>
        ) : canInvite ? (
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover"
          >
            <IconPlus className="h-4 w-4" />
            Invite member
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MemberDrawer({
  row,
  isYou,
  actions,
  onClose,
}: {
  row: TableRow;
  isYou: boolean;
  actions: ActionItem[];
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = row.kind === "member" ? row.name : row.email;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close member details"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-drawer-title"
        className="relative flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-surface-elevated shadow-elevated"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <p className="text-label font-medium tracking-[0.08em] text-text-muted uppercase">
              {row.kind === "invite" ? "Invitation" : "Member"}
            </p>
            <h2
              id="member-drawer-title"
              className="mt-1 truncate text-card font-semibold text-text-primary"
            >
              {title}
            </h2>
            {isYou ? (
              <p className="mt-1 text-[12px] text-text-muted">This is your account.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-text-muted hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <dl className="space-y-4 text-small">
            <DrawerField label="Email" value={row.email} />
            <DrawerField label="Role" value={<RolePill role={rowRoleName(row)} />} />
            <DrawerField label="Status" value={<StatusMark status={row.status} />} />
            {row.kind === "member" ? (
              <>
                <DrawerField label="MFA" value={<MfaMark on={row.mfa} />} />
                <DrawerField
                  label="Joined"
                  value={
                    <time dateTime={row.joinedAt}>
                      {new Date(row.joinedAt).toLocaleString()}
                    </time>
                  }
                />
              </>
            ) : (
              <DrawerField
                label="Invite expires"
                value={new Date(row.expiresAt).toLocaleString()}
              />
            )}
          </dl>

          {row.kind === "member" && !row.mfa && row.status !== "disabled" ? (
            <p className="mt-5 rounded-sm border border-warning/30 bg-warning/10 px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary">
              <span className="font-semibold text-warning">MFA is off. </span>
              This person can sign in with password only. Ask them to enable MFA
              from Account security before they handle production secrets.
            </p>
          ) : null}

          {row.kind === "invite" ? (
            <p className="mt-5 flex items-start gap-2 rounded-sm border border-border-subtle bg-background-secondary px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary">
              <IconMail className="mt-0.5 h-4 w-4 shrink-0 text-text-muted" />
              They have not joined yet. Revoke the invite if the address is
              wrong or the person should not receive access.
            </p>
          ) : null}
        </div>

        <div className="border-t border-border-subtle px-5 py-4">
          <p className="mb-2 text-label font-medium text-text-muted">Actions</p>
          <div className="flex flex-col gap-1.5">
            {actions.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onSelect();
                  if (item.id !== "copy") onClose();
                }}
                className={`rounded-sm border px-3 py-2 text-left text-[13px] font-semibold disabled:opacity-40 ${
                  item.tone === "danger"
                    ? "border-danger/40 text-danger hover:bg-danger/10"
                    : item.tone === "brand"
                      ? "border-brand-primary/40 text-brand-primary hover:bg-brand-primary/10"
                      : "border-border-default text-text-primary hover:bg-surface-card"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {row.kind === "member" && isYou ? (
            <p className="mt-3 text-[11px] text-text-muted">
              You cannot disable, delete, or change the role of your own
              membership from here.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function DrawerField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-label font-medium text-text-muted">{label}</dt>
      <dd className="mt-1 text-text-primary">{value}</dd>
    </div>
  );
}

