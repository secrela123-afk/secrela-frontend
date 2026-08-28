"use client";

import { ApiError, type AuditLogEvent } from "../../../lib/api";
import { useAuditLogsQuery } from "../../../hooks/queries/useAuditLogsQuery";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { isQueryBooting } from "../../../lib/query-status";
import { Avatar, PageHeader, PageLoading, StatusBadge } from "../ui";
import { PlanFeatureGate } from "../PlanUpgradePrompt";

function actionTone(action: string) {
  if (action.includes("failed") || action.includes("denied") || action.includes("removed")) {
    return "danger" as const;
  }
  if (
    action.includes("revealed") ||
    action.includes("approved") ||
    action.includes("success") ||
    action.includes("created")
  ) {
    return "brand" as const;
  }
  if (action.includes("requested") || action.includes("updated")) {
    return "warning" as const;
  }
  return "info" as const;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function targetLabel(e: AuditLogEvent): string {
  if (e.targetLabel?.trim()) return e.targetLabel;
  if (e.targetType && e.targetId) return `${e.targetType}:${e.targetId}`;
  return "—";
}

/**
 * Org audit trail — metadata only (never secret values).
 * Requires audit.read (Owner/Admin by default).
 */
export function AuditLogsPage() {
  const { can } = useRequiredWorkspace();
  const canRead = can("audit.read");
  const entitlementsQuery = usePlanEntitlementsQuery(canRead);
  const planAllowed =
    entitlementsQuery.data?.capabilities.viewAuditLogs ?? false;
  const auditQuery = useAuditLogsQuery(canRead && planAllowed);
  const { data, error } = auditQuery;
  const isBooting = isQueryBooting(auditQuery);
  const events = data?.events ?? [];
  const retention = data?.retention;

  if (!canRead) {
    return (
      <div className="p-4 lg:p-6">
        <PageHeader
          title="Audit Logs"
          description="You need permission to view audit logs."
        />
      </div>
    );
  }

  if (!planAllowed && !entitlementsQuery.isPending) {
    return (
      <PlanFeatureGate
        allowed={false}
        snapshot={entitlementsQuery.data}
        featureLabel="Audit logs"
        featureKey="auditLogs"
      />
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="Audit Logs"
        description="Security events with metadata only — never secret values."
      />

      {retention?.limited && retention.days ? (
        <div className="mb-4 rounded-md border border-border-subtle bg-surface-card px-4 py-3 text-[12px] text-text-secondary">
          Showing events from the last{" "}
          <span className="font-semibold text-text-primary">
            {retention.days} days
          </span>{" "}
          on your {entitlementsQuery.data?.planLabel ?? "current"} plan.
          Upgrade to Team for full audit history.
        </div>
      ) : retention && !retention.limited ? (
        <div className="mb-4 rounded-md border border-border-subtle bg-surface-card px-4 py-3 text-[12px] text-text-secondary">
          Full audit history is available on your{" "}
          {entitlementsQuery.data?.planLabel ?? "current"} plan.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] text-danger">
          {error instanceof ApiError
            ? error.message
            : "Could not load audit logs."}
        </div>
      ) : isBooting ? (
        <PageLoading label="Loading audit logs…" />
      ) : (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-surface-card">
          <table className="w-full min-w-[800px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-[11px] uppercase tracking-[0.08em] text-text-muted">
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-text-muted"
                  >
                    No audit events yet. Actions like login, reveal, vault/secret
                    changes, and access reviews will appear here.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-border-subtle/80 transition-colors hover:bg-surface-elevated/60"
                  >
                    <td className="px-4 py-3 text-text-muted">
                      {formatWhen(e.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar initials={e.actor.initials} size="sm" />
                        <span className="font-medium text-text-primary">
                          {e.actor.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={actionTone(e.action)}>
                        {e.action}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {targetLabel(e)}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] text-text-muted">
                      {e.ip ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
