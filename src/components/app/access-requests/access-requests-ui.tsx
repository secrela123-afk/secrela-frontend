"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import type { AccessRequestStatus, OrganizationAccessRequest } from "../../../lib/api";
import {
  IconAccess,
  IconCheck,
  IconClock,
  IconLock,
  IconSearch,
  IconVault,
  IconWarning,
  IconX,
} from "../icons";
import { Avatar } from "../ui";

export type QueueTab = "pending" | "active" | "closed";

export const PAGE_SIZE = 12;

export function statusLabel(status: AccessRequestStatus): string {
  if (status === "pending") return "Needs review";
  if (status === "approved") return "Active";
  if (status === "denied") return "Denied";
  if (status === "expired") return "Expired";
  return "Revoked";
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes === 60) return "1 hour";
  if (minutes === 1440) return "24 hours";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} hours` : `${minutes} min`;
}

export function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m} min`;
  return `${totalSec}s`;
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatAbsolute(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function matchesQuery(
  row: OrganizationAccessRequest,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [
    row.requester.name,
    row.secret.name,
    row.secret.vault.name,
    row.reason,
    row.reviewer?.name ?? "",
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function inQueue(row: OrganizationAccessRequest, tab: QueueTab): boolean {
  if (tab === "pending") return row.status === "pending";
  if (tab === "active") return row.status === "approved";
  return row.status === "denied" || row.status === "expired" || row.status === "revoked";
}

export function StatusMark({ status }: { status: AccessRequestStatus }) {
  const dot =
    status === "pending"
      ? "bg-warning"
      : status === "approved"
        ? "bg-brand-primary"
        : status === "denied" || status === "revoked"
          ? "bg-danger"
          : "bg-text-muted";
  const label =
    status === "pending"
      ? "text-warning"
      : status === "approved"
        ? "text-brand-primary"
        : status === "denied" || status === "revoked"
          ? "text-danger"
          : "text-text-muted";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />
      <span className={label}>{statusLabel(status)}</span>
    </span>
  );
}

export function QueueTabs({
  tab,
  onTab,
  pending,
  active,
  closed,
}: {
  tab: QueueTab;
  onTab: (tab: QueueTab) => void;
  pending: number;
  active: number;
  closed: number;
}) {
  const items: { id: QueueTab; label: string; count: number }[] = [
    { id: "pending", label: "Needs review", count: pending },
    { id: "active", label: "Active access", count: active },
    { id: "closed", label: "Closed", count: closed },
  ];
  return (
    <div
      role="tablist"
      aria-label="Access request queues"
      className="flex gap-6 border-b border-border-subtle"
    >
      {items.map((item) => {
        const selected = tab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTab(item.id)}
            className={`relative -mb-px pb-3 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-focus ${
              selected
                ? "text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {item.label}
            <span
              className={`ml-2 tabular-nums ${
                selected ? "text-text-primary" : "text-text-muted"
              }`}
            >
              {item.count}
            </span>
            {selected ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function AccessQueueToolbar({
  query,
  onQuery,
  vaultId,
  onVault,
  vaults,
}: {
  query: string;
  onQuery: (value: string) => void;
  vaultId: string;
  onVault: (value: string) => void;
  vaults: { id: string; name: string }[];
}) {
  const searchId = useId();
  const vaultSelectId = useId();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <label htmlFor={searchId} className="sr-only">
          Search access requests
        </label>
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted">
          <IconSearch className="h-4 w-4" />
        </span>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search requester, secret, vault, or reason"
          className="h-11 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
        />
      </div>
      <label className="sr-only" htmlFor={vaultSelectId}>
        Filter by vault
      </label>
      <select
        id={vaultSelectId}
        value={vaultId}
        onChange={(e) => onVault(e.target.value)}
        className="h-11 rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] font-medium text-text-secondary outline-none focus:border-brand-primary focus:shadow-focus"
      >
        <option value="all">All vaults</option>
        {vaults.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AccessQueueSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-md border border-border-subtle bg-surface-card"
      aria-hidden
    >
      <div className="hidden h-10 border-b border-border-subtle bg-background-secondary/60 lg:block" />
      <ul className="m-0 list-none divide-y divide-border-subtle p-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-4">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-elevated" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/5 animate-pulse rounded-xs bg-surface-elevated" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-xs bg-background-secondary" />
            </div>
            <div className="hidden h-3 w-20 animate-pulse rounded-xs bg-surface-elevated sm:block" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccessQueueEmpty({
  tab,
  hasFilters,
}: {
  tab: QueueTab;
  hasFilters: boolean;
}) {
  const copy = hasFilters
    ? {
        title: "No matching requests",
        body: "Nothing in this queue matches your search or vault filter.",
      }
    : tab === "pending"
      ? {
          title: "Review inbox is clear",
          body: "When a teammate requests temporary access to a secret they cannot reveal, it appears here for Owner or Admin review.",
        }
      : tab === "active"
        ? {
            title: "No live grants",
            body: "Approved access appears here until it expires or is revoked.",
          }
        : {
            title: "No closed requests",
            body: "Denied, expired, and revoked requests are kept here for traceability.",
          };

  return (
    <div className="rounded-md border border-border-subtle bg-surface-card px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-sm bg-background-secondary text-text-muted">
        <IconAccess className="h-5 w-5" />
      </div>
      <h2 className="text-card text-text-primary">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-small text-text-secondary">
        {copy.body}
      </p>
    </div>
  );
}

export function GrantWindow({ row }: { row: OrganizationAccessRequest }) {
  if (row.status === "approved" && row.remainingMs != null) {
    const urgent = row.remainingMs < 15 * 60 * 1000;
    return (
      <span
        className={`inline-flex items-center gap-1 text-[12px] font-medium ${
          urgent ? "text-warning" : "text-brand-primary"
        }`}
        title={
          row.expiresAt ? `Expires ${formatAbsolute(row.expiresAt)}` : undefined
        }
      >
        <IconClock className="h-3.5 w-3.5" />
        Expires in {formatRemaining(row.remainingMs)}
      </span>
    );
  }
  return (
    <span className="text-[12px] text-text-secondary">
      {formatDuration(row.durationMinutes)}
    </span>
  );
}

export function ReviewDecisionDialog({
  open,
  kind,
  row,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  kind: "approve" | "deny" | null;
  row: OrganizationAccessRequest | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const titleId = useId();
  const noteId = useId();

  useEffect(() => {
    if (open) setNote("");
  }, [open, row?.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!open || !kind || !row) return null;

  const isApprove = kind === "approve";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-elevated p-6 shadow-elevated">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm ${
              isApprove
                ? "bg-brand-primary/10 text-brand-primary"
                : "bg-danger/10 text-danger"
            }`}
          >
            {isApprove ? (
              <IconCheck className="h-4 w-4" />
            ) : (
              <IconWarning className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-card text-text-primary">
              {isApprove ? "Grant temporary access?" : "Deny this request?"}
            </h2>
            <p className="mt-2 text-small text-text-secondary">
              {isApprove ? (
                <>
                  <span className="font-semibold text-text-primary">
                    {row.requester.name}
                  </span>{" "}
                  will be able to reveal{" "}
                  <span className="font-semibold text-text-primary">
                    {row.secret.name}
                  </span>{" "}
                  for {formatDuration(row.durationMinutes)}. The grant expires
                  automatically and is written to the audit log.
                </>
              ) : (
                <>
                  <span className="font-semibold text-text-primary">
                    {row.requester.name}
                  </span>{" "}
                  will not receive access to{" "}
                  <span className="font-semibold text-text-primary">
                    {row.secret.name}
                  </span>
                  . They can submit a new request later.
                </>
              )}
            </p>
          </div>
        </div>

        <label htmlFor={noteId} className="mt-5 block">
          <span className="mb-1.5 block text-label text-text-secondary">
            Review note{" "}
            <span className="font-normal text-text-muted">(optional)</span>
          </span>
          <textarea
            id={noteId}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={500}
            disabled={loading}
            placeholder="Visible on the request and in the audit trail"
            className="w-full resize-none rounded-sm border border-border-default bg-background-secondary px-3 py-2 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus disabled:text-text-disabled"
          />
        </label>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="h-10 rounded-sm border border-border-default px-4 text-[13px] font-semibold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onConfirm(note.trim())}
            className={`h-10 rounded-sm px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-50 ${
              isApprove
                ? "bg-brand-primary text-brand-on-primary hover:bg-brand-primary-hover"
                : "bg-danger text-white hover:opacity-90"
            }`}
          >
            {loading
              ? "Working…"
              : isApprove
                ? "Grant access"
                : "Deny request"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function RequestDetailDrawer({
  row,
  onClose,
  onApprove,
  onDeny,
  onRevoke,
  closeOnEscape = true,
}: {
  row: OrganizationAccessRequest | null;
  onClose: () => void;
  onApprove: (row: OrganizationAccessRequest) => void;
  onDeny: (row: OrganizationAccessRequest) => void;
  onRevoke: (row: OrganizationAccessRequest) => void;
  closeOnEscape?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!row || !closeOnEscape) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [row, onClose, closeOnEscape]);

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close request details"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border-subtle bg-surface-elevated shadow-elevated"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
          <div className="min-w-0">
            <p className="text-label text-text-muted">Access request</p>
            <h2
              id={titleId}
              className="mt-1 truncate text-card text-text-primary"
            >
              {row.secret.name}
            </h2>
            <div className="mt-2">
              <StatusMark status={row.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-sm text-text-muted hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="text-label font-semibold tracking-wide text-text-muted uppercase">
              Requester
            </h3>
            <div className="mt-2 flex items-center gap-3">
              <Avatar initials={row.requester.initials} />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold text-text-primary">
                  {row.requester.name}
                </p>
                <p className="text-[12px] text-text-muted">
                  Requested {formatRelative(row.requestedAt)} ·{" "}
                  {formatAbsolute(row.requestedAt)}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-label font-semibold tracking-wide text-text-muted uppercase">
              Secret
            </h3>
            <div className="mt-2 rounded-sm border border-border-subtle bg-background-secondary px-3 py-3">
              <p className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
                <IconLock className="h-3.5 w-3.5 text-text-muted" />
                {row.secret.name}
              </p>
              <p className="mt-1 flex items-center gap-2 text-[12px] text-text-secondary">
                <IconVault className="h-3.5 w-3.5 text-text-muted" />
                {row.secret.vault.name}
              </p>
              <p className="mt-2 text-[12px] text-text-muted">
                Permission: temporary reveal (use) ·{" "}
                {formatDuration(row.durationMinutes)}
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-label font-semibold tracking-wide text-text-muted uppercase">
              Reason
            </h3>
            <p className="mt-2 whitespace-pre-wrap text-small leading-relaxed text-text-secondary">
              {row.reason}
            </p>
          </section>

          {row.status === "approved" ? (
            <section>
              <h3 className="text-label font-semibold tracking-wide text-text-muted uppercase">
                Grant
              </h3>
              <p className="mt-2 text-small text-text-secondary">
                Granted {formatAbsolute(row.grantedAt)}
                {row.reviewer ? ` by ${row.reviewer.name}` : ""}.{" "}
                {row.remainingMs != null ? (
                  <>
                    Expires in{" "}
                    <span className="font-semibold text-text-primary">
                      {formatRemaining(row.remainingMs)}
                    </span>
                    .
                  </>
                ) : null}
              </p>
            </section>
          ) : null}

          {row.reviewer && row.status !== "pending" ? (
            <section>
              <h3 className="text-label font-semibold tracking-wide text-text-muted uppercase">
                Review
              </h3>
              <p className="mt-2 text-small text-text-secondary">
                {row.reviewer.name}
                {row.reviewedAt ? ` · ${formatAbsolute(row.reviewedAt)}` : ""}
              </p>
              {row.reviewNote ? (
                <p className="mt-2 rounded-sm border border-border-subtle bg-background-secondary px-3 py-2 text-small text-text-secondary">
                  {row.reviewNote}
                </p>
              ) : (
                <p className="mt-1 text-[12px] text-text-muted">No review note.</p>
              )}
            </section>
          ) : null}
        </div>

        {row.status === "pending" || row.status === "approved" ? (
          <div className="flex gap-2 border-t border-border-subtle px-5 py-4">
            {row.status === "pending" ? (
              <>
                <button
                  type="button"
                  onClick={() => onDeny(row)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-sm border border-danger/40 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <IconX className="h-3.5 w-3.5" />
                  Deny
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(row)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-sm bg-brand-primary text-[13px] font-semibold text-brand-on-primary transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <IconCheck className="h-3.5 w-3.5" />
                  Approve
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onRevoke(row)}
                className="inline-flex h-10 w-full items-center justify-center rounded-sm border border-danger/40 text-[13px] font-semibold text-danger transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus"
              >
                Revoke access
              </button>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

export function PaginationBar({
  page,
  pageCount,
  onPage,
  total,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  total: number;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <p className="text-[12px] text-text-muted">
        {total} {total === 1 ? "request" : "requests"}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-9 rounded-sm border border-border-default px-3 text-[12px] font-semibold text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-[12px] tabular-nums text-text-muted">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className="h-9 rounded-sm border border-border-default px-3 text-[12px] font-semibold text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="p-4 lg:px-8 lg:py-6">{children}</div>;
}
