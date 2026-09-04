"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAME } from "../../lib/brand";
import {
  APP_NAV,
  canAccessNavItem,
  type AppNavIcon,
} from "../../lib/app-nav";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";
import { usePlanEntitlementsQuery } from "../../hooks/queries/usePlanEntitlementsQuery";
import { useAppUser, useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import {
  IconAccess,
  IconAlert,
  IconAudit,
  IconChevronLeft,
  IconCreditCard,
  IconFolder,
  IconIntegrations,
  IconLock,
  IconMembers,
  IconOrganization,
  IconOverview,
  IconRoles,
  IconSecret,
  IconSecurity,
  IconSettings,
  IconTemplate,
  IconVault,
} from "./icons";

const ICONS: Record<AppNavIcon, typeof IconOverview> = {
  overview: IconOverview,
  vault: IconVault,
  secret: IconSecret,
  folder: IconFolder,
  template: IconTemplate,
  access: IconAccess,
  members: IconMembers,
  roles: IconRoles,
  security: IconSecurity,
  audit: IconAudit,
  alert: IconAlert,
  integrations: IconIntegrations,
  organization: IconOrganization,
  billing: IconCreditCard,
  accountSecurity: IconLock,
  settings: IconSettings,
};

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const { user } = useAppUser();
  const { organization, role, can } = useRequiredWorkspace();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const planSnapshot = entitlementsQuery.data ?? null;

  const navGroups = APP_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) =>
      canAccessNavItem(item, can, role, planSnapshot),
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-border-subtle bg-background-secondary transition-[width] duration-base ease-sv ${
        collapsed ? "w-[72px]" : "w-[248px]"
      }`}
    >
      <div
        className={`flex h-14 items-center border-b border-border-subtle ${collapsed ? "justify-center px-2" : "px-4"}`}
      >
        <Link
          href="/app"
          className="inline-flex items-center gap-2.5 text-inherit no-underline focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={APP_NAME}
        >
          <SecureVaultLogo state="idle" size={28} decorative />
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-tight text-text-primary">
              {APP_NAME}
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Workspace">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                {group.title}
              </p>
            )}
            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`relative flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13px] font-medium no-underline transition-colors duration-fast ease-sv focus-visible:outline-none focus-visible:shadow-focus ${
                        active
                          ? "bg-surface-elevated text-brand-primary"
                          : "text-text-secondary hover:bg-surface-card hover:text-text-primary"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      {active && (
                        <span
                          className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-brand-primary"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div
        className={`border-t border-border-subtle p-2 ${collapsed ? "items-center" : ""}`}
      >
        {!collapsed ? (
          <div className="mb-2 rounded-md border border-border-subtle bg-surface-card p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-primary/15 text-brand-primary">
                <SecureVaultLogo state="idle" size={18} decorative />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-text-primary">
                  {organization.name}
                </p>
                <p className="truncate text-[11px] text-text-muted">
                  {organization.plan}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`mb-2 flex items-center gap-2.5 rounded-md border border-border-subtle bg-surface-card p-2 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[11px] font-semibold text-text-primary">
            {initials(user.name)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-text-primary">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-text-muted">{role.name}</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-sm px-2 py-2 text-text-muted transition-colors hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconChevronLeft
            className={`h-4 w-4 transition-transform duration-base ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </aside>
  );
}
