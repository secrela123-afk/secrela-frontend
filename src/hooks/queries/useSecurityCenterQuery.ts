"use client";

import { useQuery } from "@tanstack/react-query";
import { getSecurityCenterRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useSecurityCenterQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.securityCenter,
    queryFn: () => getSecurityCenterRequest(),
    enabled,
    staleTime: 20_000,
  });
}
