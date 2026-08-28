"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  disableMemberRequest,
  enableMemberRequest,
  removeMemberRequest,
  updateMemberRoleRequest,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useUpdateMemberRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { membershipId: string; roleId: string }) =>
      updateMemberRoleRequest(input.membershipId, input.roleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => removeMemberRequest(membershipId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members }),
        queryClient.invalidateQueries({ queryKey: queryKeys.invites }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useDisableMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => disableMemberRequest(membershipId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useEnableMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (membershipId: string) => enableMemberRequest(membershipId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.members }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}
