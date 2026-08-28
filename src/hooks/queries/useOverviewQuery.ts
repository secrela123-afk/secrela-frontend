"use client";

import { useQuery } from "@tanstack/react-query";
import { getOverviewRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useOverviewQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: () => getOverviewRequest(),
    enabled,
    staleTime: 20_000,
  });
}
