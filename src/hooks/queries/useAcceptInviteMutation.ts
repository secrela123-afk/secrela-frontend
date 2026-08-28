"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { acceptInvitationRequest } from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useAcceptInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvitationRequest(token),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
        queryClient.invalidateQueries({ queryKey: queryKeys.landingSession }),
        queryClient.invalidateQueries({ queryKey: queryKeys.session }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}
