"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveAccessRequestRequest,
  createAccessRequestRequest,
  denyAccessRequestRequest,
  listAccessRequestsRequest,
  revokeAccessRequestRequest,
  type CreateAccessRequestPayload,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useAccessRequestsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.accessRequests,
    queryFn: () => listAccessRequestsRequest(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 12_000,
  });
}

function invalidateAccess(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.accessRequests }),
    queryClient.invalidateQueries({ queryKey: queryKeys.secrets }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  ]);
}

export function useCreateAccessRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccessRequestPayload) =>
      createAccessRequestRequest(payload),
    onSuccess: async () => {
      await invalidateAccess(queryClient);
    },
  });
}

export function useApproveAccessRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: string; note?: string }) =>
      approveAccessRequestRequest(input.requestId, input.note),
    onSuccess: async () => {
      await invalidateAccess(queryClient);
    },
  });
}

export function useDenyAccessRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: string; note?: string }) =>
      denyAccessRequestRequest(input.requestId, input.note),
    onSuccess: async () => {
      await invalidateAccess(queryClient);
    },
  });
}

export function useRevokeAccessRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => revokeAccessRequestRequest(requestId),
    onSuccess: async () => {
      await invalidateAccess(queryClient);
    },
  });
}
