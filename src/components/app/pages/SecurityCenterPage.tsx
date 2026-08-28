"use client";

import Link from "next/link";
import { ApiError, type SecurityFindingSeverity } from "../../../lib/api";
import { useSecurityCenterQuery } from "../../../hooks/queries/useSecurityCenterQuery";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { isOwnerOrAdminRole } from "../../../lib/app-nav";
import { isQueryBooting } from "../../../lib/query-status";
import { IconSecurity } from "../icons";
import { PageHeader, PageLoading, Panel, StatusBadge } from "../ui";
import { PlanFeatureGate } from "../PlanUpgradePrompt";

function severityTone(s: SecurityFindingSeverity) {
  if (s === "high") return "danger" as const;
  if (s === "medium") return "warning" as const;
  return "purple" as const;
}

/**
 * Live Security Center — score + findings from real org data.
 */
export function SecurityCenterPage() {
  const { role, can } = useRequiredWorkspace();
  const canRead =
    isOwnerOrAdminRole(role) || can("audit.read");
  const entitlementsQuery = usePlanEntitlementsQuery(canRead);
  const planAllowed =
    entitlementsQuery.data?.capabilities.viewSecurityCenter ?? true;
  const query = useSecurityCenterQuery(canRead && planAllowed);
  const isBooting = isQueryBooting(query);
  const data = query.data;

  if (!canRead) {
    return (
      <div className="p-4 lg:p-6">
        <PageHeader
          title="Security Center"
          description="You need permission to view security findings."
        />
      </div>
    );
  }

  if (!planAllowed && !entitlementsQuery.isPending) {
    return (
      <PlanFeatureGate
        allowed={false}
        snapshot={entitlementsQuery.data}
        featureLabel="Security Center"
        featureKey="securityCenter"
      />
    );
  }

  if (query.error) {
    return (
      <div className="p-4 lg:p-6">
        <PageHeader
          title="Security Center"
          description="Measurable risk signals for this organization."
        />
        <p className="text-[13px] text-danger">
          {query.error instanceof ApiError
            ? query.error.message
            : "Could not load security center."}
        </p>
      </div>
    );
  }

  if (isBooting || !data) {
    return (
      <div className="p-4 lg:p-6">
        <PageHeader
          title="Security Center"
          description="Measurable risk signals for this organization."
        />
        <PageLoading label="Calculating security posture…" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <PageHeader
        title="Security Center"
        description="Measurable risk signals — MFA, secret hygiene, and access requests. Not a vanity score."
      />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Panel bodyClassName="p-6">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary shadow-glow-green">
              <IconSecurity className="h-7 w-7" />
            </div>
            <p className="text-[12px] text-text-muted">
              Organization security score
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-text-primary">
              {data.score}
              <span className="text-lg text-text-muted">/100</span>
            </p>
            <p className="mt-1 text-[13px] font-semibold text-brand-primary">
              {data.label}
            </p>
            <div className="mt-5 flex w-full gap-2 text-center text-[12px]">
              <div className="flex-1 rounded-sm border border-border-subtle bg-background-secondary py-2">
                <p className="font-bold text-danger">{data.risks.high}</p>
                <p className="text-text-muted">High</p>
              </div>
              <div className="flex-1 rounded-sm border border-border-subtle bg-background-secondary py-2">
                <p className="font-bold text-warning">{data.risks.medium}</p>
                <p className="text-text-muted">Med</p>
              </div>
              <div className="flex-1 rounded-sm border border-border-subtle bg-background-secondary py-2">
                <p className="font-bold text-purple">{data.risks.low}</p>
                <p className="text-text-muted">Low</p>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-text-muted">
              MFA coverage {data.metrics.mfaCoveragePct}% ·{" "}
              {data.metrics.totalSecrets} secrets ·{" "}
              {data.metrics.pendingAccessRequests} pending requests
            </p>
          </div>
        </Panel>

        <Panel title="How the score is calculated">
          <ul className="m-0 list-none space-y-2 p-0 text-[13px] text-text-secondary">
            <li>• MFA coverage across active members (up to −35)</li>
            <li>• High-risk secrets (up to −25)</li>
            <li>• Expired secrets (up to −15)</li>
            <li>• Secrets not updated in 90+ days (up to −10)</li>
            <li>• Pending access requests (up to −10)</li>
            <li>• Non-admin permanent reveal rights (up to −10)</li>
          </ul>
          <p className="mt-4 text-[12px] text-text-muted">
            Score updates from live organization data. Improving findings raises
            the score.
          </p>
        </Panel>
      </div>

      {data.findings.length === 0 ? (
        <Panel>
          <p className="text-[14px] font-semibold text-text-primary">
            No open findings
          </p>
          <p className="mt-1 text-[13px] text-text-secondary">
            Current checks did not flag MFA gaps, stale secrets, or pending
            access backlog.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.findings.map((f) => (
            <Panel
              key={f.id}
              title={f.title}
              action={
                <StatusBadge tone={severityTone(f.severity)}>
                  {f.severity}
                </StatusBadge>
              }
            >
              <p className="text-2xl font-semibold tabular-nums text-text-primary">
                {f.count}
              </p>
              <p className="mt-2 text-[13px] text-text-secondary">
                {f.description}
              </p>
              <Link
                href={f.href}
                className="mt-3 inline-block text-[12px] font-semibold text-brand-primary no-underline hover:text-brand-primary-hover"
              >
                Review →
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
