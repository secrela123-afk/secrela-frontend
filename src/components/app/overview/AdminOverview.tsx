"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ApiError, type OverviewResponse } from "../../../lib/api";
import { useOverviewQuery } from "../../../hooks/queries/useOverviewQuery";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { isQueryBooting } from "../../../lib/query-status";
import { PlanUpgradePrompt } from "../PlanUpgradePrompt";
import {
  featureUpgradeLabel,
  recommendedUpgradeForFeature,
} from "../../../lib/plan-entitlements";
import {
  IconAccess,
  IconKey,
  IconLock,
  IconPlus,
  IconSecurity,
  IconUsers,
  IconVault,
  IconWarning,
} from "../icons";
import { Avatar, PageLoading, Panel, PrimaryButton, StatusBadge } from "../ui";

const SLICE_COLOR: Record<string, string> = {
  "brand-primary": "var(--color-brand-primary)",
  info: "var(--color-info)",
  warning: "var(--color-warning)",
  purple: "var(--color-purple)",
  danger: "var(--color-danger)",
};

const TONE_ICON: Record<string, string> = {
  brand: "text-brand-primary bg-brand-primary/10",
  info: "text-info bg-info/10",
  purple: "text-purple bg-purple/10",
  warning: "text-warning bg-warning/10",
  danger: "text-danger bg-danger/10",
};

const QUICK_ACTIONS = [
  { id: "qa_1", label: "New Secret", href: "/app/secrets", tone: "brand" },
  { id: "qa_2", label: "New Vault", href: "/app/vaults", tone: "info" },
  { id: "qa_3", label: "Invite Member", href: "/app/members", tone: "purple" },
  {
    id: "qa_4",
    label: "Access Requests",
    href: "/app/access-requests",
    tone: "warning",
  },
  { id: "qa_5", label: "Security Center", href: "/app/security", tone: "danger" },
  { id: "qa_6", label: "Audit Logs", href: "/app/audit", tone: "info" },
] as const;

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function riskBarWidth(level: string): string {
  if (level === "high") return "90%";
  if (level === "medium") return "55%";
  if (level === "low") return "30%";
  return "20%";
}

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative h-[88px] w-[88px]">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={r} fill="none" stroke="var(--color-border-subtle)" strokeWidth="7" />
        <circle
          cx="44"
          cy="44"
          r={r}
          fill="none"
          stroke="var(--color-brand-primary)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold text-text-primary">{score}</span>
        <span className="text-[10px] text-text-muted">/100</span>
      </div>
    </div>
  );
}

function VaultDonut({
  slices,
  total,
}: {
  slices: OverviewResponse["vaultSlices"];
  total: number;
}) {
  const r = 54;
  const c = 2 * Math.PI * r;
  let cursor = 0;
  const usable = slices.filter((s) => s.percent > 0);
  const segments =
    usable.length > 0
      ? usable.map((s) => {
          const len = (s.percent / 100) * c;
          const dash = `${len} ${c - len}`;
          const offset = -cursor;
          cursor += len;
          return { ...s, dash, offset };
        })
      : [];

  return (
    <div className="relative h-[140px] w-[140px] shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140" aria-hidden="true">
        {segments.length === 0 ? (
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth="16"
          />
        ) : (
          segments.map((s) => (
            <circle
              key={s.id}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={SLICE_COLOR[s.colorToken]}
              strokeWidth="16"
              strokeDasharray={s.dash}
              strokeDashoffset={s.offset}
            />
          ))
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-text-primary">{total}</span>
        <span className="text-[11px] text-text-muted">Total</span>
      </div>
    </div>
  );
}

/**
 * Owner/Admin command-center Overview — live org metrics & security snapshot.
 */
export function AdminOverview() {
  const query = useOverviewQuery(true);
  const entitlementsQuery = usePlanEntitlementsQuery();
  const isBooting = isQueryBooting(query);
  const data = query.data;
  const snapshot = entitlementsQuery.data;
  const canViewSecurity = snapshot?.capabilities.viewSecurityCenter ?? false;
  const canViewAudit = snapshot?.capabilities.viewAuditLogs ?? false;
  const auditRetentionDays = snapshot?.entitlements.auditRetentionDays ?? null;

  if (query.error) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
          Overview
        </h1>
        <p className="text-[13px] text-danger">
          {query.error instanceof ApiError
            ? query.error.message
            : "Could not load overview."}
        </p>
      </div>
    );
  }

  if (isBooting || !data) {
    return (
      <div className="space-y-4 p-4 lg:p-6">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
          Overview
        </h1>
        <PageLoading label="Loading overview…" />
      </div>
    );
  }

  const { metrics, risks, vaultSlices, recentActivity, pendingRequests, topSecrets, expiringSoon } =
    data;
  const score = metrics.securityScore;
  const label = metrics.securityLabel;

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
          Overview
        </h1>
        <StatusBadge tone="brand">Live</StatusBadge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Panel bodyClassName="p-4">
          <div className="flex items-center gap-3">
            {score != null ? (
              <ScoreRing score={score} />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full border border-border-subtle text-[12px] text-text-muted">
                —
              </div>
            )}
            <div>
              <p className="text-[12px] font-medium text-text-muted">Security Score</p>
              <p className="mt-0.5 text-[15px] font-semibold text-text-primary">
                {score != null ? `${score}/100` : "Unavailable"}
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-brand-primary">
                {score != null
                  ? label
                  : canViewSecurity
                    ? "Requires audit access"
                    : "Upgrade to unlock"}
              </p>
            </div>
          </div>
        </Panel>

        <MetricStat
          label="Total Secrets"
          value={metrics.totalSecrets}
          hint="Across all vaults"
          icon={<IconLock className="h-4 w-4" />}
          iconClass="text-info bg-info/10"
        />
        <MetricStat
          label="Vaults"
          value={metrics.vaults}
          hint="Organization vaults"
          icon={<IconVault className="h-4 w-4" />}
          iconClass="text-brand-primary bg-brand-primary/10"
        />
        <MetricStat
          label="Members"
          value={metrics.members}
          hint="Active memberships"
          icon={<IconUsers className="h-4 w-4" />}
          iconClass="text-purple bg-purple/10"
        />
        <MetricStat
          label="Access Requests"
          value={metrics.accessRequestsTotal}
          hint={`${metrics.accessPending} pending`}
          hintClass="text-warning"
          icon={<IconKey className="h-4 w-4" />}
          iconClass="text-warning bg-warning/10"
        />
        <Panel bodyClassName="p-4">
          <div className="flex h-full flex-col justify-between gap-2">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12px] font-medium text-text-muted">High Risk Secrets</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-text-primary">
                  {metrics.highRiskSecrets}
                </p>
              </div>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-danger/10 text-danger">
                <IconWarning className="h-4 w-4" />
              </span>
            </div>
            <Link
              href="/app/secrets"
              className="text-[12px] font-semibold text-brand-primary no-underline hover:text-brand-primary-hover"
            >
              View all →
            </Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Secrets by Vault">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <VaultDonut slices={vaultSlices} total={metrics.totalSecrets} />
            <ul className="m-0 flex w-full list-none flex-col gap-2 p-0">
              {vaultSlices.length === 0 ? (
                <li className="text-[12px] text-text-muted">No vaults yet.</li>
              ) : (
                vaultSlices.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: SLICE_COLOR[s.colorToken] }}
                      />
                      {s.name}
                    </span>
                    <span className="font-semibold tabular-nums text-text-primary">
                      {s.count} · {s.percent}%
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </Panel>

        <Panel
          title="Recent Activity"
          action={
            canViewAudit ? (
              <Link href="/app/audit" className="text-[12px] font-medium text-brand-primary no-underline">
                View all
              </Link>
            ) : null
          }
        >
          {!canViewAudit && snapshot ? (
            <PlanUpgradePrompt
              compact
              title="Audit logs are not on your plan"
              description={`Your ${snapshot.planLabel} workspace does not include audit history. Upgrade to Starter to see recent activity here.`}
              snapshot={snapshot}
            />
          ) : recentActivity.length === 0 ? (
            <p className="text-[12px] text-text-muted">No recent audit events yet.</p>
          ) : (
            <>
              {auditRetentionDays ? (
                <p className="mb-3 text-[11px] text-text-muted">
                  Last {auditRetentionDays} days on your {snapshot?.planLabel} plan.
                </p>
              ) : null}
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-2.5">
                  <Avatar initials={a.initials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-text-secondary">
                      <span className="font-semibold text-text-primary">{a.actorName}</span>{" "}
                      {a.action}{" "}
                      <span className="font-medium text-text-primary">{a.target}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-text-muted">{a.timeAgo}</p>
                  </div>
                </li>
              ))}
            </ul>
            </>
          )}
        </Panel>

        <Panel className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgb(34_211_90_/_0.12),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center text-center">
            {!canViewSecurity && snapshot ? (
              <PlanUpgradePrompt
                compact
                title="Security Center is not on your plan"
                description={`Your ${snapshot.planLabel} workspace does not include Security Center. ${
                  featureUpgradeLabel(snapshot, "securityCenter")
                    ? `Upgrade to ${featureUpgradeLabel(snapshot, "securityCenter")} to unlock score, findings, and risk signals.`
                    : "Contact sales for Enterprise access."
                }`}
                snapshot={{
                  ...snapshot,
                  upgradePlanSlug: recommendedUpgradeForFeature(
                    snapshot.planSlug,
                    "securityCenter",
                  ),
                  upgradePlanLabel: featureUpgradeLabel(snapshot, "securityCenter"),
                }}
              />
            ) : (
              <>
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary shadow-glow-green">
              <IconSecurity className="h-8 w-8" />
            </div>
            <p className="text-[12px] font-medium text-text-muted">Security Center</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
              {score != null ? score : "—"}
              <span className="text-base font-semibold text-text-muted">/100</span>
            </p>
            {risks ? (
              <>
                <div className="mt-4 flex w-full items-center gap-1">
                  <RiskBar count={risks.high} label="High" tone="danger" flex={Math.max(risks.high, 1)} />
                  <RiskBar count={risks.medium} label="Med" tone="warning" flex={Math.max(risks.medium, 1)} />
                  <RiskBar count={risks.low} label="Low" tone="purple" flex={Math.max(risks.low, 1)} />
                </div>
                <div className="mt-3 flex w-full justify-between text-[11px] text-text-muted">
                  <span>
                    <span className="font-semibold text-danger">{risks.high}</span> High
                  </span>
                  <span>
                    <span className="font-semibold text-warning">{risks.medium}</span> Medium
                  </span>
                  <span>
                    <span className="font-semibold text-purple">{risks.low}</span> Low
                  </span>
                </div>
              </>
            ) : (
              <p className="mt-3 text-[12px] text-text-muted">Open Security Center for details.</p>
            )}
            <Link
              href="/app/security"
              className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-sm border border-brand-primary/50 bg-brand-primary/10 text-[13px] font-semibold text-brand-primary no-underline transition-colors hover:bg-brand-primary/20"
            >
              Go to Security Center
            </Link>
              </>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel
          title="Pending Access Requests"
          action={
            <Link
              href="/app/access-requests"
              className="text-[12px] font-medium text-brand-primary no-underline"
            >
              View all
            </Link>
          }
        >
          {pendingRequests.length === 0 ? (
            <p className="text-[12px] text-text-muted">No pending requests.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {pendingRequests.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2.5 rounded-sm border border-border-subtle bg-background-secondary/60 px-2.5 py-2"
                >
                  <Avatar initials={r.requesterInitials} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-text-primary">
                      {r.requesterName}
                    </p>
                    <p className="truncate text-[11px] text-text-muted">{r.secretName}</p>
                  </div>
                  <Link
                    href="/app/access-requests"
                    className="text-[11px] font-semibold text-brand-primary no-underline"
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recently accessed secrets">
          {topSecrets.length === 0 ? (
            <p className="text-[12px] text-text-muted">No secrets yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {topSecrets.map((s) => (
                <li key={s.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-semibold text-text-primary">{s.name}</p>
                      <p className="text-[11px] text-text-muted">{s.vaultName}</p>
                    </div>
                    <span className="text-[11px] capitalize tabular-nums text-text-secondary">
                      {s.riskLevel}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-pill bg-border-subtle">
                    <div
                      className="h-full rounded-pill bg-info"
                      style={{ width: riskBarWidth(s.riskLevel) }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Risk snapshot">
          {!canViewSecurity && snapshot ? (
            <p className="text-[12px] text-text-secondary">
              Upgrade to Team to see risk breakdown from Security Center.
            </p>
          ) : risks ? (
            <div className="space-y-3">
              <RiskRow label="High findings" count={risks.high} tone="danger" />
              <RiskRow label="Medium findings" count={risks.medium} tone="warning" />
              <RiskRow label="Low findings" count={risks.low} tone="purple" />
              <p className="text-[11px] text-text-muted">
                Counts match Security Center findings — not an industry benchmark.
              </p>
            </div>
          ) : (
            <p className="text-[12px] text-text-muted">
              Risk breakdown requires Security Center access.
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Panel title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.id}
                href={a.href}
                className="flex flex-col items-center gap-2 rounded-md border border-border-subtle bg-background-secondary/50 px-2 py-3 text-center no-underline transition-colors hover:border-border-default hover:bg-surface-elevated"
              >
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-sm ${TONE_ICON[a.tone]}`}
                >
                  <IconPlus className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-medium text-text-secondary">{a.label}</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel
          title="Secrets expiring soon"
          action={<StatusBadge tone="warning">14 days</StatusBadge>}
        >
          {expiringSoon.length === 0 ? (
            <p className="text-[12px] text-text-muted">No secrets expiring in the next 14 days.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {expiringSoon.map((e) => (
                <li key={e.id} className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-sm bg-warning/10 text-warning">
                    <IconWarning className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-text-primary">{e.name}</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-warning">
                      {formatShortDate(e.expiresAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link href="/app/secrets" className="no-underline">
              <PrimaryButton>
                <IconAccess className="h-3.5 w-3.5" />
                Review secrets
              </PrimaryButton>
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MetricStat({
  label,
  value,
  hint,
  hintClass = "text-text-muted",
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  hint: string;
  hintClass?: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <Panel bodyClassName="p-4">
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-start justify-between">
          <p className="text-[12px] font-medium text-text-muted">{label}</p>
          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-sm ${iconClass}`}>
            {icon}
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums text-text-primary">{value}</p>
          <p className={`mt-1 text-[11px] font-medium ${hintClass}`}>{hint}</p>
        </div>
      </div>
    </Panel>
  );
}

function RiskBar({
  count,
  label,
  tone,
  flex,
}: {
  count: number;
  label: string;
  tone: "danger" | "warning" | "purple";
  flex: number;
}) {
  const bg =
    tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-purple";
  return (
    <div className={`${bg} h-2 rounded-pill`} style={{ flex }} title={`${count} ${label}`} />
  );
}

function RiskRow({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "danger" | "warning" | "purple";
}) {
  const bar =
    tone === "danger" ? "bg-danger" : tone === "warning" ? "bg-warning" : "bg-purple";
  const max = Math.max(count, 1);
  return (
    <div>
      <div className="mb-1 flex justify-between text-[12px]">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold tabular-nums text-text-primary">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-pill bg-border-subtle">
        <div
          className={`h-full rounded-pill ${bar}`}
          style={{ width: `${Math.min(100, count === 0 ? 4 : (count / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
