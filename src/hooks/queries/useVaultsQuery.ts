"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createVaultRequest,
  deleteVaultRequest,
  listVaultsRequest,
  updateVaultRequest,
  type CreateVaultPayload,
  type UpdateVaultPayload,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useVaultsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vaults,
    queryFn: () => listVaultsRequest(),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateVaultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVaultPayload) => createVaultRequest(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.vaults }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useUpdateVaultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { vaultId: string; payload: UpdateVaultPayload }) =>
      updateVaultRequest(input.vaultId, input.payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.vaults });
    },
  });
}

export function useDeleteVaultMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vaultId: string) => deleteVaultRequest(vaultId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.vaults }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}
