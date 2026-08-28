"use client";

import type { Permission } from "../../lib/api";
import { useWorkspaceQuery } from "../queries/useWorkspaceQuery";
import { useWorkspaceActions } from "./useWorkspaceActions";

/**
 * Workspace snapshot from TanStack Query — single source for /app/* pages.
 * Must render under AppAuthGate (workspace loaded with org).
 */
export function useWorkspace() {
  const query = useWorkspaceQuery();
  const data = query.data;

  return {
    ...query,
    user: data?.user ?? null,
    organization: data?.organization ?? null,
    role: data?.role ?? null,
    permissions: data?.permissions ?? [],
    can: (permission: Permission) =>
      data?.permissions.includes(permission) ?? false,
  };
}

/** Same as useWorkspace but asserts org is loaded (inside AppAuthGate). */
export function useRequiredWorkspace() {
  const ws = useWorkspace();
  if (!ws.user || !ws.organization || !ws.role) {
    throw new Error(
      "useRequiredWorkspace requires a loaded workspace with organization",
    );
  }
  return {
    ...ws,
    user: ws.user,
    organization: ws.organization,
    role: ws.role,
  };
}

/** Sidebar / top bar — user + logout from workspace + actions hooks. */
export function useAppUser() {
  const { user } = useRequiredWorkspace();
  const { logout } = useWorkspaceActions();
  return { user, logout };
}
