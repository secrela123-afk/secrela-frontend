"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrganizationRoleRequest,
  deleteOrganizationRoleRequest,
  listOrganizationRolesRequest,
  updateOrganizationRoleRequest,
  type Permission,
} from "../../lib/api";
import { queryKeys } from "../../lib/query-keys";

export function useOrganizationRolesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.roles,
    queryFn: async () => {
      const data = await listOrganizationRolesRequest();
      return data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string | null;
      permissions: Permission[];
    }) => createOrganizationRoleRequest(input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesMatrix }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      roleId: string;
      name?: string;
      description?: string | null;
      permissions?: Permission[];
    }) =>
      updateOrganizationRoleRequest(input.roleId, {
        name: input.name,
        description: input.description,
        permissions: input.permissions,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesMatrix }),
        queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
        queryClient.invalidateQueries({ queryKey: queryKeys.members }),
      ]);
    },
  });
}

export function useDeleteRoleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roleId: string) => deleteOrganizationRoleRequest(roleId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.roles }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rolesMatrix }),
        queryClient.invalidateQueries({ queryKey: queryKeys.entitlements }),
      ]);
    },
  });
}
