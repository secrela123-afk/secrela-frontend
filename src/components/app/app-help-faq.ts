export type HelpFaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** Owner & Admin — workspace management, security, and billing. */
export const ADMIN_HELP_FAQ: HelpFaqItem[] = [
  {
    id: "admin_vaults",
    question: "How do I organize secrets with vaults?",
    answer:
      "Create vaults from Vaults in the sidebar. Each vault groups related secrets (for example Production, Staging, or a team). Assign member permissions so people only see what they need.",
  },
  {
    id: "admin_invite",
    question: "How do I invite my team?",
    answer:
      "Open Members → Invite member, enter a work email, and choose a role. Invited users verify their email, then join your organization workspace. Your plan limits how many seats you can use.",
  },
  {
    id: "admin_access",
    question: "How do access requests work?",
    answer:
      "When someone cannot reveal a secret, they can request temporary access with a reason and duration. Owners and Admins review pending requests, approve or deny them, and approved access expires automatically.",
  },
  {
    id: "admin_audit",
    question: "What appears in Audit Logs?",
    answer:
      "Audit logs record security events — logins, reveals, vault changes, invitations, and access reviews. They never store secret values. Availability and retention depend on your plan (Starter: last 7 days, Team+: full history).",
  },
  {
    id: "admin_security",
    question: "What is Security Center?",
    answer:
      "Security Center scores measurable risks in your workspace — MFA coverage, old secrets, pending access requests, and similar signals. It is available on Team and Enterprise plans.",
  },
  {
    id: "admin_plans",
    question: "What happens when I hit a plan limit?",
    answer:
      "SecureVault blocks the action safely and shows an upgrade prompt — for example when you reach the vault, secret, or seat limit on Free trial or Starter. Upgrade from Organization settings or the pricing page.",
  },
  {
    id: "admin_roles",
    question: "How should I use roles and permissions?",
    answer:
      "Use built-in Owner, Admin, and Member roles for most teams. Custom roles are available on paid plans. Grant the minimum permissions needed — especially secret.reveal and access_request.approve.",
  },
];

/** Regular members — day-to-day secret access. */
export const MEMBER_HELP_FAQ: HelpFaqItem[] = [
  {
    id: "member_secrets",
    question: "How do I open a secret?",
    answer:
      "Go to Secrets, pick a vault, and open a secret you are allowed to read. If your role includes reveal permission, use Reveal to view the value briefly. Every reveal is audited.",
  },
  {
    id: "member_blocked",
    question: "Why can't I reveal a secret?",
    answer:
      "Your role may allow reading metadata but not revealing values, or the secret may require temporary access. Use Request access, explain why you need it, and wait for an Owner or Admin to approve.",
  },
  {
    id: "member_request",
    question: "How long does approved access last?",
    answer:
      "The approver sets a duration when granting access. When it expires, reveal is blocked again automatically. You can submit a new request if you still need the secret.",
  },
  {
    id: "member_vaults",
    question: "Which vaults can I see?",
    answer:
      "You only see vaults and secrets your organization shared with your role. If something is missing, ask an Admin — they control memberships and permissions.",
  },
  {
    id: "member_mfa",
    question: "How do I protect my account?",
    answer:
      "Open Account security in the sidebar to enable MFA (authenticator app). MFA helps prevent unauthorized sign-ins even if a password is exposed.",
  },
  {
    id: "member_audit",
    question: "Can I see who accessed a secret?",
    answer:
      "If your role includes audit.read and your plan includes audit logs, open Audit Logs. Otherwise ask an Owner or Admin — they can review security events for the workspace.",
  },
];
