"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  getCurrentOrganizationRequest,
  meRequest,
  type AuthUser,
  type Organization,
  type Permission,
  type ResolvedRole,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export type WorkspaceSnapshot = {
  user: AuthUser;
  organization: Organization | null;
  role: ResolvedRole | null;
  permissions: Permission[];
};

async function fetchWorkspace(): Promise<WorkspaceSnapshot> {
  const me = await meRequest();

  try {
    const current = await getCurrentOrganizationRequest();
    return {
      user: me.user,
      organization: current.organization,
      role: current.role,
      permissions: current.permissions ?? [],
    };
  } catch (err) {
    if (err instanceof ApiError && err.code === "NO_ORGANIZATION") {
      return {
        user: me.user,
        organization: null,
        role: null,
        permissions: [],
      };
    }
    throw err;
  }
}

export function useWorkspaceQuery() {
  return useQuery({
    queryKey: queryKeys.workspace,
    queryFn: fetchWorkspace,
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof ApiError) {
        if (error.status === 401) return false;
        if (error.code === "SUBSCRIPTION_EXPIRED") return false;
        if (error.code === "SUBSCRIPTION_PAYMENT_REQUIRED") return false;
        // Don't spin on server/DB outages — show error screen immediately.
        if (error.status === 0 || error.status >= 500) return false;
      }
      return failureCount < 1;
    },
  });
}
