"use client";

import { useQuery } from "@tanstack/react-query";
import { getMfaStatusRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useMfaStatusQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.mfaStatus,
    queryFn: async () => {
      const result = await getMfaStatusRequest();
      return result.mfa;
    },
    enabled,
    staleTime: 30_000,
  });
}
