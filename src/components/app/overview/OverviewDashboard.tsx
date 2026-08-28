"use client";

import { useRequiredWorkspace } from "../../../hooks/workspace/useWorkspace";
import { isOwnerOrAdminRole } from "../../../lib/app-nav";
import { AdminOverview } from "./AdminOverview";
import { MemberOverview } from "./MemberOverview";

/**
 * /app Overview — Owner/Admin get the command center; other roles get a member welcome.
 */
export function OverviewDashboard() {
  const { role } = useRequiredWorkspace();

  if (isOwnerOrAdminRole(role)) {
    return <AdminOverview />;
  }

  return <MemberOverview />;
}
