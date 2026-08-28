"use client";

import { PageHeader, Panel } from "../ui";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import { PlanFeatureGate } from "../PlanUpgradePrompt";

function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={title} description={description} />
      <Panel bodyClassName="p-6">
        <p className="text-[14px] font-semibold text-text-primary">Coming in a later release</p>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-text-secondary">
          This area is intentionally disabled for the current MVP. Navigation is hidden so the
          product stays focused on live vaults, secrets, access, security, and audit.
        </p>
      </Panel>
    </div>
  );
}

export function CategoriesPage() {
  return (
    <ComingSoonPage
      title="Categories"
      description="Classify secrets for filtering and Security Center rules."
    />
  );
}

export function TemplatesPage() {
  return (
    <ComingSoonPage
      title="Templates"
      description="Reusable secret field layouts for faster creation."
    />
  );
}

export function SecurityAlertsPage() {
  return (
    <ComingSoonPage
      title="Security Alerts"
      description="Push and in-app alerts for high-severity security events."
    />
  );
}

/** Route alias used by /app/alerts */
export const AlertsPage = SecurityAlertsPage;

export function IntegrationsPage() {
  const entitlementsQuery = usePlanEntitlementsQuery();
  const allowed =
    entitlementsQuery.data?.capabilities.viewIntegrations ?? true;

  return (
    <PlanFeatureGate
      allowed={allowed}
      snapshot={entitlementsQuery.data}
      featureLabel="Integrations"
      featureKey="integrations"
    >
      <ComingSoonPage
        title="Integrations"
        description="Connect SecureVault with cloud providers and internal tooling."
      />
    </PlanFeatureGate>
  );
}
