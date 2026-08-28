"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditLogsRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useAuditLogsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditLogs,
    queryFn: () => listAuditLogsRequest({ limit: 100 }),
    enabled,
    staleTime: 8_000,
    refetchInterval: 12_000,
  });
}
