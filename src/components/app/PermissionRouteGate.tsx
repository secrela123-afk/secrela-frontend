"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessPath,
  findNavRuleForPath,
  getLastAllowedPath,
  rememberAllowedPath,
} from "../../lib/app-nav";
import { usePlanEntitlementsQuery } from "../../hooks/queries/usePlanEntitlementsQuery";
import { useRequiredWorkspace } from "../../hooks/workspace/useWorkspace";
import { toast } from "../../stores/toast-store";
import { BrandLoadingScreen } from "../brand/BrandLoadingScreen";

/**
 * Hides unauthorized pages: redirect to the last allowed route (or Overview).
 * Sidebar already hides links; this covers direct URL entry.
 */
export function PermissionRouteGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { can, role } = useRequiredWorkspace();
  const entitlementsQuery = usePlanEntitlementsQuery();
  const planSnapshot = entitlementsQuery.data ?? null;
  const navRule = findNavRuleForPath(pathname);
  const needsPlanGate = Boolean(navRule?.planFeature);
  const planLoading = needsPlanGate && entitlementsQuery.isPending;
  const allowed = canAccessPath(pathname, can, role, planSnapshot);
  const redirectedFor = useRef<string | null>(null);

  useEffect(() => {
    if (planLoading) return;

    if (allowed) {
      rememberAllowedPath(pathname);
      redirectedFor.current = null;
      return;
    }

    if (redirectedFor.current === pathname) return;
    redirectedFor.current = pathname;

    const planBlocked = Boolean(navRule?.planFeature);

    toast.warning(
      planBlocked ? "Not on your plan" : "No access",
      planBlocked
        ? "This feature is not included on your current plan."
        : "You don’t have permission to open this page.",
    );

    const fallback = getLastAllowedPath("/app");
    const target =
      fallback === pathname ||
      !canAccessPath(fallback, can, role, planSnapshot)
        ? "/app"
        : fallback;
    router.replace(target);
  }, [
    allowed,
    pathname,
    can,
    role,
    router,
    planLoading,
    planSnapshot,
    navRule,
  ]);

  if (planLoading) {
    return <BrandLoadingScreen label="Loading workspace" size={56} />;
  }

  if (!allowed) {
    return (
      <BrandLoadingScreen label="Redirecting" size={48} className="min-h-[40vh]" />
    );
  }

  return children;
}
