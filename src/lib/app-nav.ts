import type { Permission } from "./api";
import type { ResolvedRole } from "./api";
import type { PlanEntitlementSnapshot } from "./plan-entitlements";

export type AppNavIcon =
  | "overview"
  | "vault"
  | "secret"
  | "folder"
  | "template"
  | "access"
  | "members"
  | "roles"
  | "security"
  | "audit"
  | "alert"
  | "integrations"
  | "settings";

export type AppNavItemDef = {
  href: string;
  label: string;
  icon: AppNavIcon;
  /**
   * Any of these permissions unlocks the page.
   * Empty = always visible to authenticated workspace members.
   */
  anyOf?: Permission[];
  /** When true, only Owner/Admin system roles see this item. */
  ownerOrAdminOnly?: boolean;
  /** Hide unless the workspace plan includes this feature. */
  planFeature?: "auditLogs" | "securityCenter" | "integrations";
  /**
   * Hidden from sidebar + blocked in route gating until a future release.
   * Keep the href so we remember the planned path.
   */
  comingSoon?: boolean;
};

export type AppNavGroupDef = {
  title: string;
  items: AppNavItemDef[];
};

/**
 * Single source for sidebar visibility + route access.
 * Backend remains the security boundary; this is UX gating.
 */
export const APP_NAV: AppNavGroupDef[] = [
  {
    title: "Main",
    items: [{ href: "/app", label: "Overview", icon: "overview" }],
  },
  {
    title: "Vaults",
    items: [
      {
        href: "/app/vaults",
        label: "Vaults",
        icon: "vault",
        anyOf: ["vault.read"],
      },
      {
        href: "/app/secrets",
        label: "Secrets",
        icon: "secret",
        anyOf: ["secret.read"],
      },
      {
        href: "/app/categories",
        label: "Categories",
        icon: "folder",
        ownerOrAdminOnly: true,
        comingSoon: true,
      },
      {
        href: "/app/templates",
        label: "Templates",
        icon: "template",
        ownerOrAdminOnly: true,
        comingSoon: true,
      },
    ],
  },
  {
    title: "Access",
    items: [
      {
        href: "/app/access-requests",
        label: "Access Requests",
        icon: "access",
        ownerOrAdminOnly: true,
      },
      {
        href: "/app/members",
        label: "Members",
        icon: "members",
        anyOf: ["member.read"],
      },
      {
        href: "/app/roles",
        label: "Roles & Permissions",
        icon: "roles",
        anyOf: ["role.read"],
      },
    ],
  },
  {
    title: "Security",
    items: [
      {
        href: "/app/security",
        label: "Security Center",
        icon: "security",
        ownerOrAdminOnly: true,
        planFeature: "securityCenter",
      },
      {
        href: "/app/audit",
        label: "Audit Logs",
        icon: "audit",
        anyOf: ["audit.read"],
        planFeature: "auditLogs",
      },
      {
        href: "/app/alerts",
        label: "Security Alerts",
        icon: "alert",
        ownerOrAdminOnly: true,
        comingSoon: true,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        href: "/app/integrations",
        label: "Integrations",
        icon: "integrations",
        ownerOrAdminOnly: true,
        comingSoon: true,
      },
      {
        href: "/app/organization",
        label: "Organization",
        icon: "settings",
        anyOf: ["org.read"],
      },
      {
        href: "/app/billing",
        label: "Billing",
        icon: "settings",
        ownerOrAdminOnly: true,
      },
      {
        href: "/app/account-security",
        label: "Account security",
        icon: "security",
      },
    ],
  },
];

const LAST_ALLOWED_KEY = "sv_last_allowed_path";

export function isOwnerOrAdminRole(role: Pick<ResolvedRole, "systemKey"> | null) {
  return role?.systemKey === "owner" || role?.systemKey === "admin";
}

export function planAllowsNavFeature(
  snapshot: PlanEntitlementSnapshot | null | undefined,
  feature: NonNullable<AppNavItemDef["planFeature"]>,
): boolean {
  if (!snapshot) return false;
  if (feature === "auditLogs") return snapshot.capabilities.viewAuditLogs;
  if (feature === "securityCenter") return snapshot.capabilities.viewSecurityCenter;
  return snapshot.capabilities.viewIntegrations;
}

export function canAccessNavItem(
  item: AppNavItemDef,
  can: (permission: Permission) => boolean,
  role: Pick<ResolvedRole, "systemKey"> | null,
  planSnapshot?: PlanEntitlementSnapshot | null,
): boolean {
  if (item.comingSoon) return false;
  if (item.ownerOrAdminOnly && !isOwnerOrAdminRole(role)) return false;
  if (item.planFeature) {
    if (!planAllowsNavFeature(planSnapshot, item.planFeature)) return false;
  }
  if (!item.anyOf || item.anyOf.length === 0) return true;
  return item.anyOf.some((p) => can(p));
}

/** Longest matching nav rule for a pathname (covers nested routes). */
export function findNavRuleForPath(pathname: string): AppNavItemDef | null {
  const candidates = APP_NAV.flatMap((g) => g.items)
    .filter((item) => {
      if (item.href === "/app") return pathname === "/app";
      return pathname === item.href || pathname.startsWith(`${item.href}/`);
    })
    .sort((a, b) => b.href.length - a.href.length);
  return candidates[0] ?? null;
}

export function canAccessPath(
  pathname: string,
  can: (permission: Permission) => boolean,
  role: Pick<ResolvedRole, "systemKey"> | null,
  planSnapshot?: PlanEntitlementSnapshot | null,
): boolean {
  // Onboarding / special paths outside NAV stay allowed when AuthGate lets them through.
  if (pathname.startsWith("/app/onboarding")) return true;

  const rule = findNavRuleForPath(pathname);
  if (!rule) {
    // Unknown /app path — only Owner/Admin (avoid leaking unfinished screens).
    return isOwnerOrAdminRole(role);
  }
  return canAccessNavItem(rule, can, role, planSnapshot);
}

export function rememberAllowedPath(pathname: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(LAST_ALLOWED_KEY, pathname);
  } catch {
    /* ignore */
  }
}

export function getLastAllowedPath(fallback = "/app"): string {
  if (typeof window === "undefined") return fallback;
  try {
    const value = sessionStorage.getItem(LAST_ALLOWED_KEY);
    if (value && value.startsWith("/app") && !value.startsWith("/app/onboarding")) {
      return value;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}
