"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import {
  logoutRequest,
  type Organization,
  type Permission,
  type ResolvedRole,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";
import type { WorkspaceSnapshot } from "../queries/useWorkspaceQuery";

/**
 * Workspace mutations — update cache or sign out (no Context layer).
 */
export function useWorkspaceActions() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const setOrganization = useCallback(
    (
      org: Organization,
      role: ResolvedRole,
      permissions: Permission[],
    ) => {
      queryClient.setQueryData<WorkspaceSnapshot>(queryKeys.workspace, (old) => {
        if (!old) return old;
        return {
          ...old,
          organization: org,
          role,
          permissions,
        };
      });
    },
    [queryClient],
  );

  const invalidateWorkspace = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.workspace });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      /* still clear local UX */
    }
    queryClient.clear();
    router.replace("/login");
    router.refresh();
  }, [queryClient, router]);

  return { setOrganization, invalidateWorkspace, logout };
}
