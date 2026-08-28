"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createInvitationRequest,
  listPendingInvitationsRequest,
  resendInvitationRequest,
  revokeInvitationRequest,
  type CreateInvitationPayload,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function usePendingInvitesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.invites,
    queryFn: async () => {
      const data = await listPendingInvitationsRequest();
      return data.invitations;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInvitationPayload) =>
      createInvitationRequest(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invites }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useRevokeInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => revokeInvitationRequest(invitationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invites }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useResendInviteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => resendInvitationRequest(invitationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invites }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}
