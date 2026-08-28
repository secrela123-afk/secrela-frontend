"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  type AccessRequestStatus,
  type OrganizationAccessRequest,
} from "../../../lib/api";
import {
  useAccessRequestsQuery,
  useApproveAccessRequestMutation,
  useDenyAccessRequestMutation,
  useRevokeAccessRequestMutation,
} from "../../../hooks/queries/useAccessRequestsQuery";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { isQueryBooting } from "../../../lib/query-status";
import { ConfirmDialog } from "../RowActionsMenu";
import { Avatar, PageLoading } from "../ui";
import { IconCheck, IconX } from "../icons";
import { toast } from "../../../stores/toast-store";

type StatusFilter = "all" | AccessRequestStatus;

function statusTone(s: AccessRequestStatus) {
  if (s === "pending") return "warning" as const;
  if (s === "approved") return "brand" as const;
  if (s === "denied") return "danger" as const;
  if (s === "revoked") return "danger" as const;
  return "muted" as const;
}

/**
 * Owner/Admin review inbox for temporary secret access.
 * Requesters do not see this page — they request from Secrets → Reveal.
 */
export function AccessRequestsPage() {
  const router = useRouter();
  const { role } = useRequiredWorkspace();
  const isOwnerOrAdmin =
    role.systemKey === "owner" || role.systemKey === "admin";

  const requestsQuery = useAccessRequestsQuery(isOwnerOrAdmin);
  const { data, error } = requestsQuery;
  const isBooting = isQueryBooting(requestsQuery);
  const approveRequest = useApproveAccessRequestMutation();
  const denyRequest = useDenyAccessRequestMutation();
  const revokeRequest = useRevokeAccessRequestMutation();

  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [revokeTarget, setRevokeTarget] =
    useState<OrganizationAccessRequest | null>(null);

  const requests = data?.requests ?? [];
  const summary = data?.summary;

  const filtered = useMemo(() => {
    if (filter === "all") return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  if (!isOwnerOrAdmin) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Owner & Admin only"
          body="Access requests are reviewed here by Owner or Admin. Request access from Secrets → Reveal."
          action={
            <button
              type="button"
              onClick={() => router.push("/app/secrets")}
              className="mt-4 inline-flex h-9 items-center rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary"
            >
              Go to Secrets
            </button>
          }
        />
      </div>
    );
  }

  async function onApprove(row: OrganizationAccessRequest) {
    try {
      await approveRequest.mutateAsync({ requestId: row.id });
      toast.success(
        "Access granted",
        `${row.requester.name} can use ${row.secret.name} for ${formatDuration(row.durationMinutes)}.`,
      );
    } catch (err) {
      toast.error(
        "Could not approve",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  async function onDeny(row: OrganizationAccessRequest) {
    try {
      await denyRequest.mutateAsync({ requestId: row.id });
      toast.success("Request denied", `${row.requester.name}'s request was denied.`);
    } catch (err) {
      toast.error(
        "Could not deny",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  async function onConfirmRevoke() {
    if (!revokeTarget) return;
    try {
      await revokeRequest.mutateAsync(revokeTarget.id);
      toast.success(
        "Access revoked",
        `Temporary access to ${revokeTarget.secret.name} was revoked.`,
      );
      setRevokeTarget(null);
    } catch (err) {
      toast.error(
        "Could not revoke",
        err instanceof ApiError ? err.message : "Try again.",
      );
    }
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <EmptyState
          title="Could not load access requests"
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
      <div className="mb-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
          Access Requests
        </h1>
        <p className="mt-1 max-w-2xl text-small text-text-secondary">
          Review temporary access requests. Approve or reject — grants expire
          automatically.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={String(summary?.pending ?? 0)} hint="Awaiting your review" />
        <StatCard label="Approved" value={String(summary?.approved ?? 0)} hint="Active timed grants" />
        <StatCard label="Denied" value={String(summary?.denied ?? 0)} hint="Rejected requests" />
        <StatCard label="Expired" value={String(summary?.expired ?? 0)} hint="Auto-revoked" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["denied", "Denied"],
            ["expired", "Expired"],
            ["revoked", "Revoked"],
            ["all", "All"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={`h-9 rounded-sm border px-3 text-[12px] font-semibold ${
              filter === id
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border-default text-text-secondary hover:border-brand-primary hover:text-brand-primary"
            }`}
          >
            {label}
            {id !== "all" && summary
              ? ` (${summary[id as keyof typeof summary] ?? 0})`
              : ""}
          </button>
        ))}
      </div>

      {isBooting ? (
        <PageLoading label="Loading access requests…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No requests here"
          body={
            filter === "pending"
              ? "No pending requests right now."
              : "Nothing matches this filter."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <article
              key={r.id}
              className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <Avatar initials={r.requester.initials} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-text-primary">
                        {r.requester.name} requested access
                      </h3>
                      <StatusPill status={r.status} />
                    </div>
                    <p className="mt-1 text-[13px] text-text-secondary">
                      <span className="font-medium text-text-primary">
                        {r.secret.name}
                      </span>
                      <span className="text-text-muted">
                        {" "}
                        · {r.secret.vault.name} · Use ·{" "}
                        {formatDuration(r.durationMinutes)}
                      </span>
                    </p>
                    <p className="mt-2 max-w-xl text-[12px] text-text-muted">
                      {r.reason}
                    </p>
                    <p className="mt-2 text-[11px] text-text-muted">
                      Requested {formatRelative(r.requestedAt)}
                      {r.status === "approved" && r.remainingMs != null ? (
                        <span className="ml-1 font-semibold text-brand-primary">
                          · Access granted · Expires in{" "}
                          {formatRemaining(r.remainingMs)}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {r.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void onApprove(r)}
                        disabled={approveRequest.isPending}
                        className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-primary px-3 text-[12px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover disabled:opacity-60"
                      >
                        <IconCheck className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => void onDeny(r)}
                        disabled={denyRequest.isPending}
                        className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-danger/40 px-3 text-[12px] font-semibold text-danger hover:bg-danger/10 disabled:opacity-60"
                      >
                        <IconX className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </>
                  ) : null}
                  {r.status === "approved" ? (
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(r)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-danger/40 px-3 text-[12px] font-semibold text-danger hover:bg-danger/10"
                    >
                      Revoke
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke temporary access?"
        description={
          revokeTarget
            ? `Revoke ${revokeTarget.requester.name}'s access to “${revokeTarget.secret.name}” now?`
            : ""
        }
        confirmLabel="Revoke access"
        danger
        loading={revokeRequest.isPending}
        onClose={() => setRevokeTarget(null)}
        onConfirm={onConfirmRevoke}
      />
    </div>
  );
}

function StatusPill({ status }: { status: AccessRequestStatus }) {
  const tone = statusTone(status);
  const map = {
    brand: "bg-brand-primary/10 text-brand-primary",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    muted: "bg-surface-elevated text-text-muted",
  } as const;
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold capitalize ${map[tone]}`}
    >
      {status}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card p-4 shadow-card">
      <p className="text-[12px] font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-[1.5rem] font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] text-text-secondary">{hint}</p>
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
      <h2 className="text-[1.125rem] font-semibold text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-[13px] text-text-secondary">
        {body}
      </p>
      {action}
    </div>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  if (minutes === 1440) return "24 hours";
  const h = minutes / 60;
  return h === 1 ? "1 hour" : `${h} hours`;
}

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} minutes`;
  return `${totalSec}s`;
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
  return new Date(iso).toLocaleDateString();
}
