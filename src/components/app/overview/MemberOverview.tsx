"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Permission } from "../../../lib/api";
import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { usePlanEntitlementsQuery } from "../../../hooks/queries/usePlanEntitlementsQuery";
import {
  IconAccess,
  IconAudit,
  IconBell,
  IconLock,
  IconMembers,
  IconRoles,
  IconSecurity,
  IconSettings,
  IconVault,
} from "../icons";
import { Panel, StatusBadge } from "../ui";

type Capability = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: ReactNode;
  tone: string;
  /** If set, card shows only when can(permission). */
  anyOf?: Permission[];
  /** Always show (e.g. account security). */
  always?: boolean;
};

const CAPABILITIES: Capability[] = [
  {
    id: "vaults",
    title: "Vaults",
    description: "Browse the vaults your organization shared with you.",
    href: "/app/vaults",
    icon: <IconVault className="h-5 w-5" />,
    tone: "text-brand-primary bg-brand-primary/10",
    anyOf: ["vault.read"],
  },
  {
    id: "secrets",
    title: "Secrets",
    description:
      "Open secrets you can read. If reveal is blocked, request temporary access.",
    href: "/app/secrets",
    icon: <IconLock className="h-5 w-5" />,
    tone: "text-info bg-info/10",
    anyOf: ["secret.read"],
  },
  {
    id: "members",
    title: "Team members",
    description: "See who else is in this organization.",
    href: "/app/members",
    icon: <IconMembers className="h-5 w-5" />,
    tone: "text-purple bg-purple/10",
    anyOf: ["member.read"],
  },
  {
    id: "roles",
    title: "Roles",
    description: "Understand role names and what permissions mean.",
    href: "/app/roles",
    icon: <IconRoles className="h-5 w-5" />,
    tone: "text-warning bg-warning/10",
    anyOf: ["role.read"],
  },
  {
    id: "audit",
    title: "Audit logs",
    description: "Review security events (metadata only — never secret values).",
    href: "/app/audit",
    icon: <IconAudit className="h-5 w-5" />,
    tone: "text-info bg-info/10",
    anyOf: ["audit.read"],
  },
  {
    id: "org",
    title: "Organization",
    description: "View organization profile and basic settings.",
    href: "/app/organization",
    icon: <IconSettings className="h-5 w-5" />,
    tone: "text-text-secondary bg-background-secondary",
    anyOf: ["org.read"],
  },
  {
    id: "account",
    title: "Account security",
    description: "Enable MFA and keep your login protected.",
    href: "/app/account-security",
    icon: <IconSecurity className="h-5 w-5" />,
    tone: "text-brand-primary bg-brand-primary/10",
    always: true,
  },
];

function firstName(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || "there";
}

/**
 * Member-facing Overview — welcome + only what this role can use.
 * Not the Owner/Admin security command center.
 */
export function MemberOverview() {
  const { user, organization, role, can } = useRequiredWorkspace();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const canViewAudit =
    entitlementsQuery.data?.capabilities.viewAuditLogs ?? false;

  const available = CAPABILITIES.filter((c) => {
    if (c.always) return true;
    if (c.id === "audit" && !canViewAudit) return false;
    if (!c.anyOf || c.anyOf.length === 0) return true;
    return c.anyOf.some((p) => can(p));
  });

  const canSecrets = can("secret.read");
  const canReveal = can("secret.reveal");
  const canRequest = can("access_request.create");

  return (
    <div className="space-y-4 p-4 lg:p-6">
      <section className="relative overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_10%_0%,rgb(34_211_90_/_0.14),transparent_55%)]"
          aria-hidden="true"
        />
        <div className="relative px-5 py-6 sm:px-6 sm:py-7">
          <StatusBadge tone="brand">Member workspace</StatusBadge>
          <h1 className="mt-3 text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.75rem]">
            Welcome, {firstName(user.name)}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            You are signed in to{" "}
            <span className="font-semibold text-text-primary">{organization.name}</span>{" "}
            as{" "}
            <span className="font-semibold text-text-primary">{role.name}</span>.
            Use the areas below — only what your role allows is shown here.
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="How SecureVault works for you">
          <ul className="m-0 list-none space-y-3 p-0 text-[13px] text-text-secondary">
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-brand-primary/10 text-brand-primary">
                <IconVault className="h-3.5 w-3.5" />
              </span>
              <span>
                Secrets live in <strong className="font-semibold text-text-primary">vaults</strong>.
                Open what you can see — you never get other tenants&apos; data.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-info/10 text-info">
                <IconLock className="h-3.5 w-3.5" />
              </span>
              <span>
                {canReveal ? (
                  <>
                    Your role can <strong className="font-semibold text-text-primary">reveal</strong>{" "}
                    secrets you are allowed to open. Reveals are audited.
                  </>
                ) : canRequest ? (
                  <>
                    If you cannot reveal a secret, use{" "}
                    <strong className="font-semibold text-text-primary">Request access</strong> — an
                    Owner or Admin must approve a temporary window.
                  </>
                ) : canSecrets ? (
                  <>
                    You can view secret metadata. Reveal may require a temporary grant from an
                    admin.
                  </>
                ) : (
                  <>Your role does not include secret access yet. Ask an admin if you need it.</>
                )}
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-warning/10 text-warning">
                <IconBell className="h-3.5 w-3.5" />
              </span>
              <span>
                Watch the <strong className="font-semibold text-text-primary">bell</strong> for
                approvals, denials, and important org notices.
              </span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-purple/10 text-purple">
                <IconAccess className="h-3.5 w-3.5" />
              </span>
              <span>
                Access is temporary when granted. When it expires, reveal stops until you request
                again.
              </span>
            </li>
          </ul>
        </Panel>

        <Panel title="Your role">
          <div className="space-y-3 text-[13px] text-text-secondary">
            <p>
              Role:{" "}
              <span className="font-semibold text-text-primary">{role.name}</span>
            </p>
            <p>
              Permissions are decided by your organization admins. The sidebar only lists pages you
              can open — same rule as the cards below.
            </p>
            <p className="rounded-sm border border-border-subtle bg-background-secondary/70 px-3 py-2.5 text-[12px] leading-relaxed">
              Security Center, Access Requests queue, and org-wide scores are for Owner/Admin.
              Your Overview stays focused on what you personally need.
            </p>
            {!user.mfaEnabled ? (
              <Link
                href="/app/account-security"
                className="inline-flex text-[13px] font-semibold text-brand-primary no-underline hover:text-brand-primary-hover"
              >
                Turn on MFA for stronger account security →
              </Link>
            ) : (
              <p className="text-[12px] font-medium text-brand-primary">MFA is enabled on your account.</p>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Available to you">
        {available.length === 0 ? (
          <p className="text-[13px] text-text-muted">
            No workspace areas are available yet. Contact an organization admin.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="flex gap-3 rounded-md border border-border-subtle bg-background-secondary/40 p-3.5 no-underline transition-colors hover:border-border-default hover:bg-surface-elevated"
              >
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${c.tone}`}
                >
                  {c.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-text-primary">
                    {c.title}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-text-muted">
                    {c.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
