"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { ApiError } from "../../lib/api";
import { planLimitErrorToast } from "../../lib/plan-entitlements";
import { useCreateInviteMutation } from "../../hooks/queries/useInvitesQuery";
import { useOrganizationRolesQuery } from "../../hooks/queries/useRolesMutations";
import { toast } from "../../stores/toast-store";

type InviteMemberModalProps = {
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
  initialEmail?: string;
  /** Organization role id (not system key). */
  initialRoleId?: string;
};

/**
 * Owner/Admin form: email + roleId → POST invites.
 * Success → toast. Validation/API errors → inline in modal.
 */
export function InviteMemberModal({
  open,
  onClose,
  onInvited,
  initialEmail = "",
  initialRoleId,
}: InviteMemberModalProps) {
  const titleId = useId();
  const [email, setEmail] = useState(initialEmail);
  const [roleId, setRoleId] = useState(initialRoleId ?? "");
  const [error, setError] = useState<string | null>(null);
  const createInvite = useCreateInviteMutation();
  const { data: rolesData, isPending: rolesPending } =
    useOrganizationRolesQuery(open);

  const inviteableRoles = useMemo(
    () =>
      (rolesData?.roles ?? []).filter((role) => role.systemKey !== "owner"),
    [rolesData?.roles],
  );

  const defaultRoleId = useMemo(() => {
    const admin = inviteableRoles.find((r) => r.systemKey === "admin");
    return admin?.id ?? inviteableRoles[0]?.id ?? "";
  }, [inviteableRoles]);

  useEffect(() => {
    if (!open) {
      setError(null);
      return;
    }
    setEmail(initialEmail);
    setError(null);
    const preferred =
      initialRoleId &&
      inviteableRoles.some((r) => r.id === initialRoleId)
        ? initialRoleId
        : defaultRoleId;
    setRoleId(preferred);
  }, [open, initialEmail, initialRoleId, inviteableRoles, defaultRoleId]);

  if (!open) return null;

  const selectedRole = inviteableRoles.find((r) => r.id === roleId);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Enter a work email address.");
      return;
    }
    if (!roleId) {
      setError("Select a role for this invitation.");
      return;
    }

    try {
      await createInvite.mutateAsync({
        email: trimmed,
        roleId,
      });
      toast.success(
        "Invitation sent",
        `We emailed ${trimmed} to join as ${selectedRole?.name ?? "Admin"}.`,
      );
      onInvited?.();
      onClose();
    } catch (err) {
      const planToast = planLimitErrorToast(err);
      setError(
        planToast?.message ??
          (err instanceof ApiError ? err.message : "Unable to send invitation"),
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !createInvite.isPending) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-md border border-border-subtle bg-surface-card p-5 shadow-card">
        <h2
          id={titleId}
          className="text-[1.125rem] font-semibold text-text-primary"
        >
          Invite member
        </h2>
        <p className="mt-1 text-small text-text-secondary">
          Invite an Admin (full permissions) or any custom role. Owner cannot be
          assigned via invite.
        </p>

        <form className="mt-4 space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
              Work email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              className={`h-10 w-full rounded-sm border bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:shadow-focus ${
                error
                  ? "border-danger focus:border-danger"
                  : "border-border-default focus:border-brand-primary"
              }`}
              placeholder="teammate@company.com"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-semibold text-text-secondary">
              Role
            </span>
            <select
              value={roleId}
              onChange={(e) => {
                setRoleId(e.target.value);
                if (error) setError(null);
              }}
              disabled={rolesPending || inviteableRoles.length === 0}
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus disabled:opacity-50"
            >
              {rolesPending ? (
                <option value="">Loading roles…</option>
              ) : inviteableRoles.length === 0 ? (
                <option value="">No roles available</option>
              ) : (
                inviteableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))
              )}
            </select>
          </label>

          {error ? (
            <div
              className="rounded-sm border border-danger/35 bg-danger/10 px-3 py-2.5"
              role="alert"
            >
              <p className="text-[12px] font-semibold text-danger">
                Could not send invite
              </p>
              <p className="mt-0.5 text-[12px] text-text-secondary">{error}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={createInvite.isPending}
              onClick={onClose}
              className="inline-flex h-9 items-center rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createInvite.isPending ||
                rolesPending ||
                inviteableRoles.length === 0
              }
              className="inline-flex h-9 items-center rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-50"
            >
              {createInvite.isPending ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
