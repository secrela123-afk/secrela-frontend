"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError, meRequest, type AuthUser } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

/** Current session user — null when not signed in (no throw on 401). */
export function useSessionQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async (): Promise<AuthUser | null> => {
      try {
        const me = await meRequest();
        return me.user;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}
