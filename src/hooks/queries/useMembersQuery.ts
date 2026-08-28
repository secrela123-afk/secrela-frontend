"use client";

import { useQuery } from "@tanstack/react-query";
import { listOrganizationMembersRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useMembersQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: async () => {
      const data = await listOrganizationMembersRequest();
      return data.members;
    },
    enabled,
    staleTime: 30_000,
  });
}
