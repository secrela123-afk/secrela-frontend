"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
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
import { Avatar, PageHeader } from "../ui";
import { IconCheck, IconX } from "../icons";
import { toast } from "../../../stores/toast-store";
import {
  AccessQueueEmpty,
  AccessQueueSkeleton,
  AccessQueueToolbar,
  formatDuration,
  formatRelative,
  GrantWindow,
  inQueue,
  matchesQuery,
  PAGE_SIZE,
  PaginationBar,
  PageShell,
  QueueTabs,
  RequestDetailDrawer,
  ReviewDecisionDialog,
  StatusMark,
  type QueueTab,
} from "../access-requests/access-requests-ui";

/**
 * Owner/Admin review queue for temporary secret access.
 * Requesters never land here — they request from Secrets → Reveal.
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

  const [tab, setTab] = useState<QueueTab>("pending");
  const [query, setQuery] = useState("");
  const [vaultId, setVaultId] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [decision, setDecision] = useState<{
    kind: "approve" | "deny";
    row: OrganizationAccessRequest;
  } | null>(null);
  const [revokeTarget, setRevokeTarget] =
    useState<OrganizationAccessRequest | null>(null);

  const requests = data?.requests ?? [];
  const summary = data?.summary;

  const vaults = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requests) {
      map.set(r.secret.vault.id, r.secret.vault.name);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const filtered = useMemo(() => {
    const rows = requests.filter((r) => {
      if (!inQueue(r, tab)) return false;
      if (vaultId !== "all" && r.secret.vault.id !== vaultId) return false;
      return matchesQuery(r, query);
    });
    if (tab === "pending") {
      rows.sort(
        (a, b) =>
          new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime(),
      );
    }
    return rows;
  }, [requests, tab, vaultId, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const selected =
    requests.find((r) => r.id === selectedId) ?? null;

  const closedCount =
    (summary?.denied ?? 0) + (summary?.expired ?? 0) + (summary?.revoked ?? 0);
  const pendingCount = summary?.pending ?? 0;
  const oldestPending = useMemo(() => {
    const pending = requests.filter((r) => r.status === "pending");
    if (pending.length === 0) return null;
    return pending.reduce((oldest, row) =>
      new Date(row.requestedAt) < new Date(oldest.requestedAt) ? row : oldest,
    );
  }, [requests]);

  function changeTab(next: QueueTab) {
    setTab(next);
    setPage(1);
    setSelectedId(null);
  }

  async function submitDecision(note: string) {
    if (!decision) return;
    const { kind, row } = decision;
    try {
      if (kind === "approve") {
        await approveRequest.mutateAsync({ requestId: row.id, note });
        toast.success(
          "Access granted",
          `${row.requester.name} can reveal ${row.secret.name} for ${formatDuration(row.durationMinutes)}.`,
        );
      } else {
        await denyRequest.mutateAsync({ requestId: row.id, note });
        toast.success(
          "Request denied",
          `${row.requester.name} was not granted access to ${row.secret.name}.`,
        );
      }
      setDecision(null);
    } catch (err) {
      toast.error(
        kind === "approve" ? "Could not approve" : "Could not deny",
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

  if (!isOwnerOrAdmin) {
    return (
      <PageShell>
        <PageHeader
          title="Access Requests"
          description="Temporary secret access is reviewed here by Owner or Admin."
        />
        <div className="rounded-md border border-border-subtle bg-surface-card px-6 py-16 text-center">
          <h2 className="text-card text-text-primary">You cannot review requests</h2>
          <p className="mx-auto mt-2 max-w-md text-small text-text-secondary">
            If you need a secret you cannot reveal, open it from Secrets and
            request access. An Owner or Admin will review it.
          </p>
          <button
            type="button"
            onClick={() => router.push("/app/secrets")}
            className="mt-6 inline-flex h-10 items-center rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            Go to Secrets
          </button>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader
          title="Access Requests"
          description="Review temporary access before anyone reveals a secret they do not own."
        />
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-small text-danger">
          {error instanceof ApiError
            ? error.message
            : "Could not load access requests. Check your connection and try again."}
        </div>
      </PageShell>
    );
  }

  const hasFilters = query.trim().length > 0 || vaultId !== "all";

  return (
    <PageShell>
      <PageHeader
        title="Access Requests"
        description="Grant or deny temporary reveal access. Every decision is audited. Grants expire on their own."
      />

      {!isBooting ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {pendingCount > 0 ? (
            <button
              type="button"
              onClick={() => changeTab("pending")}
              className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-warning/30 bg-warning/10 px-2.5 text-[11px] font-semibold text-warning hover:border-warning/50 focus-visible:outline-none focus-visible:shadow-focus"
            >
              {pendingCount} awaiting review
              {oldestPending ? (
                <span className="font-medium text-warning/80">
                  · oldest {formatRelative(oldestPending.requestedAt)}
                </span>
              ) : null}
            </button>
          ) : (
            <p className="text-small text-text-secondary">
              No requests waiting
            </p>
          )}
          {(summary?.approved ?? 0) > 0 ? (
            <button
              type="button"
              onClick={() => changeTab("active")}
              className="inline-flex h-8 items-center rounded-xs border border-border-subtle bg-surface-card px-2.5 text-[11px] font-semibold text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
            >
              {summary?.approved} live {summary?.approved === 1 ? "grant" : "grants"}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mb-5">
        <QueueTabs
          tab={tab}
          onTab={changeTab}
          pending={pendingCount}
          active={summary?.approved ?? 0}
          closed={closedCount}
        />
      </div>

      <div className="mb-4">
        <AccessQueueToolbar
          query={query}
          onQuery={(value) => {
            setQuery(value);
            setPage(1);
          }}
          vaultId={vaultId}
          onVault={(value) => {
            setVaultId(value);
            setPage(1);
          }}
          vaults={vaults}
        />
      </div>

      {isBooting ? (
        <AccessQueueSkeleton />
      ) : filtered.length === 0 ? (
        <AccessQueueEmpty tab={tab} hasFilters={hasFilters} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-md border border-border-subtle bg-surface-card lg:block">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead>
                <tr className="border-b border-border-subtle text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                  <th className="px-4 py-3 font-semibold">Requester</th>
                  <th className="px-4 py-3 font-semibold">Secret</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Window</th>
                  <th className="px-4 py-3 font-semibold">Requested</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paged.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    className={`cursor-pointer border-b border-border-subtle/80 transition-colors last:border-b-0 hover:bg-surface-elevated/60 ${
                      selectedId === row.id ? "bg-surface-elevated/70" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar initials={row.requester.initials} size="sm" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(row.id);
                          }}
                          className="text-left font-medium text-text-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
                        >
                          {row.requester.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">
                        {row.secret.name}
                      </p>
                      <p className="text-[12px] text-text-muted">
                        {row.secret.vault.name}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate text-text-secondary" title={row.reason}>
                        {row.reason}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <GrantWindow row={row} />
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 text-text-muted"
                      title={new Date(row.requestedAt).toLocaleString()}
                    >
                      {formatRelative(row.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusMark status={row.status} />
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        row={row}
                        onApprove={() => setDecision({ kind: "approve", row })}
                        onDeny={() => setDecision({ kind: "deny", row })}
                        onRevoke={() => setRevokeTarget(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="m-0 flex list-none flex-col gap-3 p-0 lg:hidden">
            {paged.map((row) => (
              <li key={row.id}>
                <article className="rounded-md border border-border-subtle bg-surface-card p-4">
                  <button
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    className="w-full text-left focus-visible:outline-none focus-visible:shadow-focus"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar initials={row.requester.initials} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text-primary">
                            {row.requester.name}
                          </p>
                          <p className="truncate text-[12px] text-text-muted">
                            {row.secret.name} · {row.secret.vault.name}
                          </p>
                        </div>
                      </div>
                      <StatusMark status={row.status} />
                    </div>
                    <p className="mt-3 line-clamp-2 text-small text-text-secondary">
                      {row.reason}
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-muted">
                      <GrantWindow row={row} />
                      <span>Requested {formatRelative(row.requestedAt)}</span>
                    </p>
                  </button>
                  <div className="mt-3 border-t border-border-subtle pt-3">
                    <RowActions
                      row={row}
                      onApprove={() => setDecision({ kind: "approve", row })}
                      onDeny={() => setDecision({ kind: "deny", row })}
                      onRevoke={() => setRevokeTarget(row)}
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <PaginationBar
              page={safePage}
              pageCount={pageCount}
              onPage={setPage}
              total={filtered.length}
            />
          </div>
        </>
      )}

      <RequestDetailDrawer
        row={selected}
        closeOnEscape={!decision && !revokeTarget}
        onClose={() => setSelectedId(null)}
        onApprove={(row) => setDecision({ kind: "approve", row })}
        onDeny={(row) => setDecision({ kind: "deny", row })}
        onRevoke={(row) => setRevokeTarget(row)}
      />

      <ReviewDecisionDialog
        open={Boolean(decision)}
        kind={decision?.kind ?? null}
        row={decision?.row ?? null}
        loading={approveRequest.isPending || denyRequest.isPending}
        onClose={() => setDecision(null)}
        onConfirm={(note) => void submitDecision(note)}
      />

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke temporary access?"
        description={
          revokeTarget
            ? `${revokeTarget.requester.name} will immediately lose access to “${revokeTarget.secret.name}”. This is written to the audit log.`
            : ""
        }
        confirmLabel="Revoke access"
        danger
        loading={revokeRequest.isPending}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => void onConfirmRevoke()}
      />
    </PageShell>
  );
}

function RowActions({
  row,
  onApprove,
  onDeny,
  onRevoke,
}: {
  row: OrganizationAccessRequest;
  onApprove: () => void;
  onDeny: () => void;
  onRevoke: () => void;
}) {
  if (row.status === "pending") {
    return (
      <div
        className="flex justify-end gap-2"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDeny}
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-danger/40 px-2.5 text-[12px] font-semibold text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <IconX className="h-3.5 w-3.5" />
          Deny
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="inline-flex h-8 items-center gap-1 rounded-sm border border-brand-primary/40 bg-brand-primary/10 px-2.5 text-[12px] font-semibold text-brand-primary hover:bg-brand-primary/20 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <IconCheck className="h-3.5 w-3.5" />
          Approve
        </button>
      </div>
    );
  }

  if (row.status === "approved") {
    return (
      <div
        className="flex justify-end"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onRevoke}
          className="inline-flex h-8 items-center rounded-sm border border-danger/40 px-2.5 text-[12px] font-semibold text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus"
        >
          Revoke
        </button>
      </div>
    );
  }

  return <span className="block text-right text-text-muted">—</span>;
}
