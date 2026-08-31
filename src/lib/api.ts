const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5005";

export type ApiErrorDetails = {
  level?: "medium" | "high";
  mfaRequired?: boolean;
  retryAfterSeconds?: number;
};

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetails;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorDetails;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorDetails,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: "include",
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const data = (await response.json().catch(() => ({}))) as T & ApiErrorBody;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error?.code ?? "REQUEST_FAILED",
        data.error?.message ?? "Request failed",
        data.error?.details,
      );
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        0,
        "TIMEOUT",
        "Request timed out. Check that the API and MongoDB are running.",
      );
    }
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "Cannot reach the API. Is the backend running on port 5005?",
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  freeTrialUsed?: boolean;
  reinviteRequired?: boolean;
};

export type LoginResponse = {
  mfaRequired: boolean;
  user: AuthUser | { id: string; email: string; name: string };
};

export function loginRequest(
  email: string,
  password: string,
  inviteToken?: string,
) {
  return apiRequest<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      ...(inviteToken ? { inviteToken } : {}),
    }),
  });
}

export function verifyMfaRequest(code: string) {
  return apiRequest<LoginResponse>("/api/v1/auth/mfa/verify", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

/** Deduplicate Strict Mode double-mount so the same token is only verified once. */
const verifyEmailInflight = new Map<
  string,
  Promise<{ user: AuthUser }>
>();

export function verifyEmailRequest(token: string) {
  const existing = verifyEmailInflight.get(token);
  if (existing) return existing;

  const request = apiRequest<{ user: AuthUser }>("/api/v1/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  }).finally(() => {
    verifyEmailInflight.delete(token);
  });

  verifyEmailInflight.set(token, request);
  return request;
}

export function forgotPasswordRequest(email: string) {
  return apiRequest<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPasswordRequest(token: string, password: string) {
  return apiRequest<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export type MeResponse = {
  user: AuthUser;
  session: {
    fresh: boolean;
    freshUntil: string | null;
    medium?: { fresh: boolean; freshUntil: string | null };
    high?: { fresh: boolean; freshUntil: string | null };
  };
};

export function meRequest() {
  return apiRequest<MeResponse>("/api/v1/auth/me", {
    method: "GET",
  });
}

export function logoutRequest() {
  return apiRequest<void>("/api/v1/auth/logout", {
    method: "POST",
  });
}

export type ReauthLevel = "medium" | "high";

export function reauthenticateRequest(input: {
  password: string;
  code?: string;
  level: ReauthLevel;
}) {
  return apiRequest<{
    user: AuthUser;
    session: MeResponse["session"];
  }>("/api/v1/auth/reauthenticate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getMfaStatusRequest() {
  return apiRequest<{
    mfa: { enabled: boolean; recoveryCodesRemaining: number };
  }>("/api/v1/auth/mfa/status", { method: "GET" });
}

export function startMfaSetupRequest() {
  return apiRequest<{ secret: string; otpauthUri: string }>(
    "/api/v1/auth/mfa/setup",
    { method: "POST" },
  );
}

export function startMfaEnableRequest(input: {
  email: string;
  password: string;
}) {
  return apiRequest<{
    sentTo: string;
    expiresInSeconds: number;
    resendAvailableInSeconds: number;
  }>(
    "/api/v1/auth/mfa/enable/start",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function verifyMfaEnableEmailRequest(code: string) {
  return apiRequest<{ authorizedUntil: string }>(
    "/api/v1/auth/mfa/enable/verify-email",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
  );
}

export function enableMfaRequest(code: string) {
  return apiRequest<{ user: AuthUser; recoveryCodes: string[] }>(
    "/api/v1/auth/mfa/enable",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
  );
}

export function disableMfaRequest(code: string) {
  return apiRequest<{ user: AuthUser }>("/api/v1/auth/mfa/disable", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}

export function regenerateRecoveryCodesRequest(code: string) {
  return apiRequest<{ recoveryCodes: string[] }>(
    "/api/v1/auth/mfa/recovery/regenerate",
    {
      method: "POST",
      body: JSON.stringify({ code }),
    },
  );
}

export function logoutAllSessionsRequest() {
  return apiRequest<void>("/api/v1/auth/logout-all", {
    method: "POST",
  });
}

export type Organization = {
  id: string;
  name: string;
  slug: string;
  type: "startup" | "sme" | "enterprise" | "agency" | "other";
  phone: string;
  plan: string;
  planSlug?: "free" | "starter" | "team" | "enterprise";
  subscriptionStatus?:
    | "trialing"
    | "active"
    | "pending_payment"
    | "expired";
  billingInterval?: "monthly" | "yearly" | null;
  subscriptionAmountCents?: number | null;
  currency?: string;
  autoRenew?: boolean;
  autoRenewInterval?: "monthly" | "yearly" | null;
  trialEndsAt?: string | null;
  currentPeriodEndsAt?: string | null;
  trialBonusDaysGranted?: number;
  daysUntilExpiry?: number | null;
  website: string | null;
  country: string | null;
  companySize: "1-10" | "11-50" | "51-200" | "201-1000" | "1000+" | null;
  industry: string | null;
  billingEmail: string | null;
  address: string | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  createdAt: string;
};

export type MembershipRole = "owner" | "admin";

export type Permission =
  | "org.read"
  | "org.update"
  | "member.read"
  | "member.invite"
  | "member.remove"
  | "member.disable"
  | "member.role.update"
  | "role.read"
  | "role.manage"
  | "vault.read"
  | "vault.create"
  | "vault.update"
  | "vault.delete"
  | "secret.read"
  | "secret.create"
  | "secret.update"
  | "secret.delete"
  | "secret.reveal"
  | "access_request.create"
  | "access_request.review"
  | "audit.read";

export type ResolvedRole = {
  roleId: string;
  name: string;
  systemKey: MembershipRole | null;
  permissions: Permission[];
  kind: "system" | "custom";
};

export type OrgRoleRef = {
  id: string;
  name: string;
  systemKey: MembershipRole | null;
};

export type OrganizationRole = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: Permission[];
  kind: "system" | "custom";
  systemKey: MembershipRole | null;
  isActive: boolean;
  memberCount: number;
  createdAt: string;
};

export type CurrentOrganizationResponse = {
  organization: Organization;
  role: ResolvedRole;
  permissions: Permission[];
};

export type RolesMatrixResponse = {
  roles: OrganizationRole[];
  permissionCatalog: Permission[];
  matrix: Record<string, Permission[]>;
  yourRoleId: string;
  yourRoleName: string;
  yourSystemKey: MembershipRole | null;
  yourPermissions: Permission[];
};

export type OrganizationMember = {
  id: string;
  role: OrgRoleRef;
  status: "active" | "disabled";
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
  createdAt: string;
};

export type RegisterPayload = {
  companyName: string;
  email: string;
  password: string;
  phone?: string;
  plan?: "free" | "starter" | "team" | "enterprise";
  createOrganization?: boolean;
};

export type UpdateOrganizationPayload = {
  name?: string;
  type?: Organization["type"];
  phone?: string;
  website?: string | null;
  country?: string | null;
  companySize?: Organization["companySize"];
  industry?: string | null;
  billingEmail?: string | null;
  address?: string | null;
};

export function registerRequest(payload: RegisterPayload) {
  return apiRequest<LoginResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentOrganizationRequest() {
  return apiRequest<CurrentOrganizationResponse>(
    "/api/v1/organizations/current",
    { method: "GET" },
  );
}

export function getPlanEntitlementsRequest() {
  return apiRequest<import("./plan-entitlements").PlanEntitlementSnapshot>(
    "/api/v1/organizations/current/entitlements",
    { method: "GET" },
  );
}

export function createOrganizationRequest(input: {
  name: string;
  type?: Organization["type"];
  phone?: string;
}) {
  return apiRequest<CurrentOrganizationResponse>("/api/v1/organizations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOrganizationRequest(payload: UpdateOrganizationPayload) {
  return apiRequest<CurrentOrganizationResponse>(
    "/api/v1/organizations/current",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export type TrialSummaryResponse = {
  role: ResolvedRole;
  subscriptionStatus: Organization["subscriptionStatus"];
  trialEndsAt: string | null;
  bonusDaysGranted: number;
  bonusDaysRemaining: number;
  canExtendTrial: boolean;
};

export type ExtendTrialResponse = CurrentOrganizationResponse & {
  trialExtension: {
    daysAdded: number;
    trialEndsAt: string | null;
    bonusDaysGranted: number;
    bonusDaysRemaining: number;
  };
};

export function getTrialSummaryRequest() {
  return apiRequest<TrialSummaryResponse>(
    "/api/v1/organizations/current/subscription/trial-summary",
    { method: "GET" },
  );
}

export function extendTrialRequest(days: number) {
  return apiRequest<ExtendTrialResponse>(
    "/api/v1/organizations/current/subscription/extend-trial",
    {
      method: "POST",
      body: JSON.stringify({ days }),
    },
  );
}

export function activateSubscriptionRequest(input: {
  planSlug: "starter" | "team" | "enterprise" | "free";
  interval: "monthly" | "yearly";
}) {
  return apiRequest<{
    organization: Organization;
    role: ResolvedRole;
    permissions: Permission[];
  }>("/api/v1/organizations/current/subscription/activate", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAutoRenewRequest(input: {
  autoRenew: boolean;
  autoRenewInterval?: "monthly" | "yearly" | null;
}) {
  return apiRequest<{
    organization: Organization;
    role: ResolvedRole;
    permissions: Permission[];
  }>("/api/v1/organizations/current/subscription/auto-renew", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function getSubscriptionBillingRequest() {
  return apiRequest<{
    organization: Organization;
    subscription: {
      planSlug: Organization["planSlug"];
      subscriptionStatus: Organization["subscriptionStatus"];
      billingInterval: "monthly" | "yearly" | null;
      subscriptionAmountCents: number | null;
      currency: string;
      autoRenew: boolean;
      autoRenewInterval: "monthly" | "yearly" | null;
      trialEndsAt: string | null;
      currentPeriodEndsAt: string | null;
      daysUntilExpiry: number | null;
      planLabel: string;
    };
  }>("/api/v1/organizations/current/subscription", { method: "GET" });
}

export type BillingPaymentMethod = {
  brand: string;
  last4: string;
  isDefault: boolean;
  firstSeenAt: string;
  lastUsedAt: string;
};

export type BillingOverview = {
  paypalConfigured: boolean;
  paddleConfigured: boolean;
  planSlug: Organization["planSlug"];
  planLabel: string;
  subscriptionStatus: Organization["subscriptionStatus"];
  billingInterval: "monthly" | "yearly" | null;
  subscriptionAmountCents: number | null;
  currency: string;
  autoRenew: boolean;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  cardBrand: string | null;
  cardLast4: string | null;
  paymentMethods: BillingPaymentMethod[];
  updatePaymentUrl: string | null;
  customerPortalUrl: string | null;
  paypalSubscriptionId: string | null;
};

export function getBillingOverviewRequest() {
  return apiRequest<{ billing: BillingOverview }>(
    "/api/v1/billing/overview",
    { method: "GET" },
  );
}

export function createBillingCheckoutRequest(input: {
  planSlug: "starter" | "team";
  interval: "monthly" | "yearly";
}) {
  return apiRequest<{ checkoutUrl: string; mockActivated?: boolean }>(
    "/api/v1/billing/checkout",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function getPaypalCardConfigRequest() {
  return apiRequest<{
    clientId: string;
    mode: "sandbox" | "live";
    currency: string;
  }>("/api/v1/billing/card/config", { method: "GET" });
}

export function getPaypalCardClientTokenRequest() {
  return apiRequest<{ clientToken: string }>(
    "/api/v1/billing/card/client-token",
    { method: "POST" },
  );
}

export function createPaypalCardOrderRequest(input: {
  planSlug: "starter" | "team";
  interval: "monthly" | "yearly";
}) {
  return apiRequest<{ orderId: string; amount: string; currency: string }>(
    "/api/v1/billing/card/orders",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function capturePaypalCardOrderRequest(orderId: string) {
  return apiRequest<{ billing: BillingOverview }>(
    "/api/v1/billing/card/capture",
    {
      method: "POST",
      body: JSON.stringify({ orderId }),
    },
    30_000,
  );
}

export function getPaddleCheckoutConfigRequest() {
  return apiRequest<{
    configured: boolean;
    clientToken: string;
    environment: "sandbox" | "production";
  }>("/api/v1/billing/paddle/config", { method: "GET" });
}

export function createPaddleCheckoutRequest(input: {
  planSlug: "starter" | "team";
  interval: "monthly" | "yearly";
}) {
  return apiRequest<{ transactionId: string }>(
    "/api/v1/billing/paddle/checkout",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function confirmPaddleCheckoutRequest(transactionId: string) {
  return apiRequest<{ billing: BillingOverview }>(
    "/api/v1/billing/paddle/confirm",
    {
      method: "POST",
      body: JSON.stringify({ transactionId }),
    },
    30_000,
  );
}

export function listOrganizationMembersRequest() {
  return apiRequest<{
    organizationId: string;
    members: OrganizationMember[];
  }>("/api/v1/organizations/current/members", { method: "GET" });
}

export function updateMemberRoleRequest(
  membershipId: string,
  roleId: string,
) {
  return apiRequest<{ member: OrganizationMember }>(
    `/api/v1/organizations/current/members/${encodeURIComponent(membershipId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ roleId }),
    },
  );
}

export function removeMemberRequest(membershipId: string) {
  return apiRequest<{ removedMembershipId: string }>(
    `/api/v1/organizations/current/members/${encodeURIComponent(membershipId)}`,
    { method: "DELETE" },
  );
}

export function disableMemberRequest(membershipId: string) {
  return apiRequest<{ member: OrganizationMember }>(
    `/api/v1/organizations/current/members/${encodeURIComponent(membershipId)}/disable`,
    { method: "POST" },
  );
}

export function enableMemberRequest(membershipId: string) {
  return apiRequest<{ member: OrganizationMember }>(
    `/api/v1/organizations/current/members/${encodeURIComponent(membershipId)}/enable`,
    { method: "POST" },
  );
}

export function getRolesMatrixRequest() {
  return apiRequest<RolesMatrixResponse>(
    "/api/v1/organizations/current/roles-matrix",
    { method: "GET" },
  );
}

export function listOrganizationRolesRequest() {
  return apiRequest<{
    roles: OrganizationRole[];
    permissionCatalog: Permission[];
  }>("/api/v1/organizations/current/roles", { method: "GET" });
}

export function createOrganizationRoleRequest(input: {
  name: string;
  description?: string | null;
  permissions: Permission[];
}) {
  return apiRequest<{ role: OrganizationRole }>(
    "/api/v1/organizations/current/roles",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function updateOrganizationRoleRequest(
  roleId: string,
  input: {
    name?: string;
    description?: string | null;
    permissions?: Permission[];
  },
) {
  return apiRequest<{ role: OrganizationRole }>(
    `/api/v1/organizations/current/roles/${encodeURIComponent(roleId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteOrganizationRoleRequest(roleId: string) {
  return apiRequest<{ deletedRoleId: string }>(
    `/api/v1/organizations/current/roles/${encodeURIComponent(roleId)}`,
    { method: "DELETE" },
  );
}

export type OrganizationInvitation = {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  };
};

export type CreateInvitationPayload = {
  email: string;
  roleId: string;
};

export function listPendingInvitationsRequest() {
  return apiRequest<{ invitations: OrganizationInvitation[] }>(
    "/api/v1/organizations/current/invites",
    { method: "GET" },
  );
}

export function createInvitationRequest(payload: CreateInvitationPayload) {
  return apiRequest<{ invitation: OrganizationInvitation }>(
    "/api/v1/organizations/current/invites",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function revokeInvitationRequest(invitationId: string) {
  return apiRequest<{ invitation: OrganizationInvitation }>(
    `/api/v1/organizations/current/invites/${encodeURIComponent(invitationId)}`,
    { method: "DELETE" },
  );
}

export function resendInvitationRequest(invitationId: string) {
  return apiRequest<{ invitation: OrganizationInvitation }>(
    `/api/v1/organizations/current/invites/${encodeURIComponent(invitationId)}/resend`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export type InvitationPreviewResponse = {
  usable: boolean;
  reason: "ok" | "expired" | "revoked" | "accepted" | "invalid";
  invitation: {
    email: string;
    roleId: string;
    roleName: string;
    expiresAt: string;
    organization: {
      id: string;
      name: string;
    };
  } | null;
};

export type AcceptInvitationResponse = CurrentOrganizationResponse & {
  invitation: OrganizationInvitation;
};

export function getInvitationPreviewRequest(token: string) {
  return apiRequest<InvitationPreviewResponse>(
    `/api/v1/invites/by-token/${encodeURIComponent(token)}`,
    { method: "GET" },
  );
}

export function acceptInvitationRequest(token: string) {
  return apiRequest<AcceptInvitationResponse>("/api/v1/invites/accept", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function getPendingInviteForMeRequest() {
  return apiRequest<{ invitation: OrganizationInvitation | null }>(
    "/api/v1/invites/pending-for-me",
    { method: "GET" },
  );
}

export function acceptPendingInviteRequest() {
  return apiRequest<AcceptInvitationResponse>("/api/v1/invites/accept-pending", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type VaultColor = "brand" | "purple" | "info" | "warning" | "danger";
export type VaultRiskLevel = "unknown" | "low" | "medium" | "high";

export type VaultMemberPreview = {
  id: string;
  name: string;
  initials: string;
};

export type OrganizationVault = {
  id: string;
  name: string;
  description: string;
  color: VaultColor;
  riskLevel: VaultRiskLevel;
  secretCount: number;
  memberCount: number;
  memberPreviews: VaultMemberPreview[];
  lastUpdatedAt: string;
  lastUpdatedBy: { id: string; name: string } | null;
  createdAt: string;
};

export type VaultsListResponse = {
  vaults: OrganizationVault[];
  summary: {
    totalVaults: number;
    totalSecrets: number;
    totalMembers: number;
    highRiskSecrets: number;
    expiringSoon: number;
    vaultsCreatedThisMonth: number;
  };
};

export type CreateVaultPayload = {
  name: string;
  description?: string;
  riskLevel?: VaultRiskLevel;
};

export type UpdateVaultPayload = {
  name?: string;
  description?: string;
  riskLevel?: VaultRiskLevel;
};

export function listVaultsRequest() {
  return apiRequest<VaultsListResponse>(
    "/api/v1/organizations/current/vaults",
    { method: "GET" },
  );
}

export function createVaultRequest(payload: CreateVaultPayload) {
  return apiRequest<{ vault: OrganizationVault }>(
    "/api/v1/organizations/current/vaults",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateVaultRequest(vaultId: string, payload: UpdateVaultPayload) {
  return apiRequest<{ vault: OrganizationVault }>(
    `/api/v1/organizations/current/vaults/${encodeURIComponent(vaultId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteVaultRequest(vaultId: string) {
  return apiRequest<{ deletedVaultId: string }>(
    `/api/v1/organizations/current/vaults/${encodeURIComponent(vaultId)}`,
    { method: "DELETE" },
  );
}

export type SecretType =
  | "credential"
  | "api_key"
  | "database"
  | "token"
  | "key_pair"
  | "other";

export type SecretRiskLevel = "unknown" | "low" | "medium" | "high";

export type OrganizationSecret = {
  id: string;
  name: string;
  description: string;
  type: SecretType;
  riskLevel: SecretRiskLevel;
  status: "active" | "expired";
  vault: { id: string; name: string; color: string };
  owner: { id: string; name: string; initials: string };
  lastUpdatedAt: string;
  lastAccessedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  canReveal: boolean;
  temporaryAccessExpiresAt: string | null;
  hasPendingAccessRequest: boolean;
};

export type SecretActivityItem = {
  id: string;
  secretId: string;
  secretName: string;
  action: "accessed" | "updated" | "created";
  actorName: string;
  at: string;
};

export type SecretsListResponse = {
  secrets: OrganizationSecret[];
  summary: {
    totalSecrets: number;
    activeSecrets: number;
    highRiskSecrets: number;
    expiredSecrets: number;
  };
  byRisk: Record<SecretRiskLevel, number>;
  byType: Record<SecretType, number>;
  recentActivity: SecretActivityItem[];
  viewerAccessBlock: {
    blocked: boolean;
    blockedUntil: string | null;
    consecutiveDenials: number;
  } | null;
};

export type CreateSecretPayload = {
  vaultId: string;
  name: string;
  description?: string;
  type: SecretType;
  riskLevel?: SecretRiskLevel;
  value: string;
  expiresAt?: string | null;
};

export type UpdateSecretPayload = {
  vaultId?: string;
  name?: string;
  description?: string;
  type?: SecretType;
  riskLevel?: SecretRiskLevel;
  value?: string;
  expiresAt?: string | null;
};

export function listSecretsRequest() {
  return apiRequest<SecretsListResponse>(
    "/api/v1/organizations/current/secrets",
    { method: "GET" },
  );
}

export function createSecretRequest(payload: CreateSecretPayload) {
  return apiRequest<{ secret: OrganizationSecret }>(
    "/api/v1/organizations/current/secrets",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateSecretRequest(
  secretId: string,
  payload: UpdateSecretPayload,
) {
  return apiRequest<{ secret: OrganizationSecret }>(
    `/api/v1/organizations/current/secrets/${encodeURIComponent(secretId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteSecretRequest(secretId: string) {
  return apiRequest<{ deletedSecretId: string }>(
    `/api/v1/organizations/current/secrets/${encodeURIComponent(secretId)}`,
    { method: "DELETE" },
  );
}

export function revealSecretRequest(secretId: string) {
  return apiRequest<{ secretId: string; value: string }>(
    `/api/v1/organizations/current/secrets/${encodeURIComponent(secretId)}/reveal`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export type AccessRequestStatus =
  | "pending"
  | "approved"
  | "denied"
  | "expired"
  | "revoked";

export type OrganizationAccessRequest = {
  id: string;
  status: AccessRequestStatus;
  permission: "use";
  durationMinutes: number;
  reason: string;
  reviewNote: string;
  requestedAt: string;
  reviewedAt: string | null;
  grantedAt: string | null;
  expiresAt: string | null;
  remainingMs: number | null;
  requester: { id: string; name: string; initials: string };
  reviewer: { id: string; name: string } | null;
  secret: {
    id: string;
    name: string;
    vault: { id: string; name: string };
  };
};

export type AccessRequestsListResponse = {
  requests: OrganizationAccessRequest[];
  summary: {
    pending: number;
    approved: number;
    denied: number;
    expired: number;
    revoked: number;
  };
};

export type CreateAccessRequestPayload = {
  secretId: string;
  permission?: "use";
  durationMinutes: number;
  reason: string;
};

export function listAccessRequestsRequest() {
  return apiRequest<AccessRequestsListResponse>(
    "/api/v1/organizations/current/access-requests",
    { method: "GET" },
  );
}

export function createAccessRequestRequest(payload: CreateAccessRequestPayload) {
  return apiRequest<{ request: OrganizationAccessRequest }>(
    "/api/v1/organizations/current/access-requests",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function approveAccessRequestRequest(
  requestId: string,
  note = "",
) {
  return apiRequest<{ request: OrganizationAccessRequest }>(
    `/api/v1/organizations/current/access-requests/${encodeURIComponent(requestId)}/approve`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
}

export function denyAccessRequestRequest(requestId: string, note = "") {
  return apiRequest<{ request: OrganizationAccessRequest }>(
    `/api/v1/organizations/current/access-requests/${encodeURIComponent(requestId)}/deny`,
    {
      method: "POST",
      body: JSON.stringify({ note }),
    },
  );
}

export function revokeAccessRequestRequest(requestId: string) {
  return apiRequest<{ request: OrganizationAccessRequest }>(
    `/api/v1/organizations/current/access-requests/${encodeURIComponent(requestId)}/revoke`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export type AppNotification = {
  id: string;
  type:
    | "access_request.created"
    | "access_request.approved"
    | "access_request.denied"
    | "access_request.revoked"
    | "audit.event";
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
  meta: Record<string, unknown>;
};

export type NotificationsListResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

export function listNotificationsRequest() {
  return apiRequest<NotificationsListResponse>(
    "/api/v1/organizations/current/notifications",
    { method: "GET" },
  );
}

export function markNotificationReadRequest(notificationId: string) {
  return apiRequest<{ notification: AppNotification }>(
    `/api/v1/organizations/current/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function markAllNotificationsReadRequest() {
  return apiRequest<{ marked: number }>(
    "/api/v1/organizations/current/notifications/read-all",
    { method: "POST", body: JSON.stringify({}) },
  );
}

export function deleteNotificationRequest(notificationId: string) {
  return apiRequest<{ deleted: boolean }>(
    `/api/v1/organizations/current/notifications/${encodeURIComponent(notificationId)}`,
    { method: "DELETE" },
  );
}

export function deleteAllNotificationsRequest() {
  return apiRequest<{ deleted: number }>(
    "/api/v1/organizations/current/notifications",
    { method: "DELETE" },
  );
}

export type AuditLogEvent = {
  id: string;
  action: string;
  actor: {
    id: string | null;
    name: string;
    email: string;
    initials: string;
  };
  targetType: string | null;
  targetId: string | null;
  targetLabel: string;
  ip: string | null;
  createdAt: string;
};

export type AuditLogsListResponse = {
  events: AuditLogEvent[];
  retention: {
    limited: boolean;
    days: number | null;
    cutoffAt: string | null;
  };
};

export function listAuditLogsRequest(options?: {
  limit?: number;
  action?: string;
}) {
  const params = new URLSearchParams();
  if (options?.limit) params.set("limit", String(options.limit));
  if (options?.action) params.set("action", options.action);
  const qs = params.toString();
  return apiRequest<AuditLogsListResponse>(
    `/api/v1/organizations/current/audit-logs${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
}

export type SecurityFindingSeverity = "high" | "medium" | "low";

export type SecurityFinding = {
  id: string;
  title: string;
  description: string;
  severity: SecurityFindingSeverity;
  count: number;
  href: string;
};

export type SecurityCenterResponse = {
  score: number;
  label: string;
  risks: { high: number; medium: number; low: number };
  findings: SecurityFinding[];
  metrics: {
    activeMembers: number;
    mfaEnabledMembers: number;
    mfaCoveragePct: number;
    totalSecrets: number;
    highRiskSecrets: number;
    expiredSecrets: number;
    oldSecrets: number;
    pendingAccessRequests: number;
  };
};

export function getSecurityCenterRequest() {
  return apiRequest<SecurityCenterResponse>(
    "/api/v1/organizations/current/security-center",
    { method: "GET" },
  );
}

export type OverviewResponse = {
  metrics: {
    securityScore: number | null;
    securityLabel: string | null;
    totalSecrets: number;
    vaults: number;
    members: number;
    accessRequestsTotal: number;
    accessPending: number;
    highRiskSecrets: number;
  };
  risks: { high: number; medium: number; low: number } | null;
  vaultSlices: Array<{
    id: string;
    name: string;
    count: number;
    percent: number;
    colorToken: "brand-primary" | "info" | "warning" | "purple" | "danger";
  }>;
  recentActivity: Array<{
    id: string;
    actorName: string;
    initials: string;
    action: string;
    target: string;
    timeAgo: string;
  }>;
  pendingRequests: Array<{
    id: string;
    requesterName: string;
    requesterInitials: string;
    secretName: string;
    requestedAt: string;
  }>;
  topSecrets: Array<{
    id: string;
    name: string;
    vaultName: string;
    riskLevel: string;
    lastAccessedAt: string | null;
  }>;
  expiringSoon: Array<{
    id: string;
    name: string;
    expiresAt: string;
  }>;
};

export function getOverviewRequest() {
  return apiRequest<OverviewResponse>(
    "/api/v1/organizations/current/overview",
    { method: "GET" },
  );
}

