"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSecretRequest,
  deleteSecretRequest,
  listSecretsRequest,
  revealSecretRequest,
  updateSecretRequest,
  type CreateSecretPayload,
  type UpdateSecretPayload,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useSecretsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.secrets,
    queryFn: () => listSecretsRequest(),
    enabled,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}

function invalidateSecrets(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.secrets }),
    queryClient.invalidateQueries({ queryKey: queryKeys.vaults }),
    queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
  ]);
}

export function useCreateSecretMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSecretPayload) => createSecretRequest(payload),
    onSuccess: async () => {
      await invalidateSecrets(queryClient);
    },
  });
}

export function useUpdateSecretMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { secretId: string; payload: UpdateSecretPayload }) =>
      updateSecretRequest(input.secretId, input.payload),
    onSuccess: async () => {
      await invalidateSecrets(queryClient);
    },
  });
}

export function useDeleteSecretMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (secretId: string) => deleteSecretRequest(secretId),
    onSuccess: async () => {
      await invalidateSecrets(queryClient);
    },
  });
}

export function useRevealSecretMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (secretId: string) => revealSecretRequest(secretId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.secrets });
    },
  });
}
