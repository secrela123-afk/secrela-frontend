"use client";

import { useQuery } from "@tanstack/react-query";
import { getPlanEntitlementsRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function usePlanEntitlementsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.entitlements,
    queryFn: getPlanEntitlementsRequest,
    staleTime: 30_000,
    enabled,
  });
}
