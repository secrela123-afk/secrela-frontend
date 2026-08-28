"use client";

import { useQuery } from "@tanstack/react-query";
import { getInvitationPreviewRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useInvitePreviewQuery(token: string | null) {
  return useQuery({
    queryKey: queryKeys.invitePreview(token ?? ""),
    queryFn: () => getInvitationPreviewRequest(token!),
    enabled: Boolean(token && token.length >= 20),
    staleTime: 60_000,
    retry: false,
  });
}
