/** Shared UI mock types — mirror future API shapes for MVP screens. */

export type VaultStatus = "healthy" | "attention" | "critical";

export type SecretRisk = "low" | "medium" | "high";

export type AccessRequestStatus = "pending" | "approved" | "denied" | "expired";

export type MemberRole = "Owner" | "Admin" | "Security Manager" | "Developer" | "Viewer";

export type MemberStatus = "active" | "invited" | "disabled";

export type AuditAction =
  | "secret.revealed"
  | "secret.created"
  | "secret.updated"
  | "secret.copied"
  | "vault.created"
  | "access.approved"
  | "access.denied"
  | "access.requested"
  | "member.invited"
  | "login.success"
  | "login.failed"
  | "mfa.enabled";

export type MockVault = {
  id: string;
  name: string;
  description: string;
  secretCount: number;
  memberCount: number;
  status: VaultStatus;
  updatedAt: string;
};

export type MockSecret = {
  id: string;
  name: string;
  vaultId: string;
  vaultName: string;
  category: string;
  risk: SecretRisk;
  lastAccessedAt: string;
  accessCount: number;
  tags: string[];
};

export type MockAccessRequest = {
  id: string;
  userName: string;
  userInitials: string;
  resource: string;
  vaultName: string;
  reason: string;
  duration: string;
  status: AccessRequestStatus;
  requestedAt: string;
  expiresAt?: string;
};

export type MockMember = {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: MemberRole;
  status: MemberStatus;
  mfaEnabled: boolean;
  lastActiveAt: string;
};

export type MockAuditEvent = {
  id: string;
  action: AuditAction;
  actor: string;
  actorInitials: string;
  target: string;
  ip: string;
  createdAt: string;
};

export type MockActivity = {
  id: string;
  userName: string;
  initials: string;
  action: string;
  target: string;
  timeAgo: string;
};

export type VaultSlice = {
  name: string;
  percent: number;
  colorToken: "brand-primary" | "info" | "warning" | "purple" | "danger";
};

export type TopSecret = {
  id: string;
  name: string;
  provider: string;
  users: number;
  maxUsers: number;
};

export type RiskAxis = {
  label: string;
  org: number;
  industry: number;
};

export type QuickAction = {
  id: string;
  label: string;
  href: string;
  tone: "brand" | "info" | "purple" | "warning" | "danger";
};

export type SecurityFinding = {
  id: string;
  title: string;
  severity: SecretRisk;
  count: number;
  description: string;
};
