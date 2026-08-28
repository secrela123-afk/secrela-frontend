"use client";

import { useQuery } from "@tanstack/react-query";
import { getRolesMatrixRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useRolesMatrixQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.rolesMatrix,
    queryFn: async () => {
      const data = await getRolesMatrixRequest();
      return data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
