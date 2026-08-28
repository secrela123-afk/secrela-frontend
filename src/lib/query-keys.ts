/**
 * Central TanStack Query keys — invalidate by these names after mutations.
 */
export const queryKeys = {
  workspace: ["workspace"] as const,
  session: ["session"] as const,
  landingSession: ["landing", "session"] as const,
  mfaStatus: ["account", "mfa-status"] as const,
  members: ["organization", "members"] as const,
  rolesMatrix: ["organization", "roles-matrix"] as const,
  roles: ["organization", "roles"] as const,
  invites: ["organization", "invites"] as const,
  vaults: ["organization", "vaults"] as const,
  secrets: ["organization", "secrets"] as const,
  accessRequests: ["organization", "access-requests"] as const,
  notifications: ["organization", "notifications"] as const,
  auditLogs: ["organization", "audit-logs"] as const,
  securityCenter: ["organization", "security-center"] as const,
  entitlements: ["organization", "entitlements"] as const,
  overview: ["organization", "overview"] as const,
  invitePreview: (token: string) => ["invite", "preview", token] as const,
};
