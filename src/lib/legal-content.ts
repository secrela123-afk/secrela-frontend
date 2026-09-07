export const LEGAL_EFFECTIVE_DATE = "September 1, 2026";
export const LEGAL_CONTACT = "sales@secrela.com";
export const LEGAL_SITE = "https://secrela.com";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  after?: string[];
};

/** Customer-facing terms — keep essential rules, drop filler. */
export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "Using Secrela",
    paragraphs: [
      "These Terms cover your organization's use of Secrela at secrela.com. By creating a workspace or buying a plan, you agree to them.",
      "Secrela stores and controls access to company secrets (passwords, API keys, credentials). Features depend on your plan.",
    ],
  },
  {
    heading: "Your account",
    paragraphs: [
      "Keep registration details accurate. You are responsible for people you invite, for protecting login access, and for turning on security options like email verification and MFA when available.",
      "Revoke access promptly when someone leaves your organization.",
    ],
  },
  {
    heading: "Acceptable use",
    paragraphs: ["Use Secrela only for lawful business purposes. Do not:"],
    bullets: [
      "Attack the Service or access another organization's data.",
      "Store illegal content or break privacy or export laws.",
      "Resell Secrela without written permission.",
    ],
    after: [
      "We may suspend accounts that create security, legal, or operational risk.",
    ],
  },
  {
    heading: "Your data",
    paragraphs: [
      "You own the secrets and data you submit. We host and process them only to run the Service.",
      "You choose who can reveal or copy secrets. No hosted system is impossible to compromise — we design layered controls so one failure should not expose everything.",
    ],
  },
  {
    heading: "Billing",
    paragraphs: [
      "Paid plans are charged at checkout prices. Card payments are handled by Lemon Squeezy as Merchant of Record (receipts and taxes).",
      "Failed or unpaid periods may lock paid access until payment succeeds. Trials are limited as shown in the product.",
    ],
  },
  {
    heading: "Ending access",
    paragraphs: [
      "You can stop using Secrela anytime. We may suspend access for breach, non-payment, or platform risk.",
      "The Service is provided as is. To the extent allowed by law, liability is limited to fees paid for Secrela in the three months before a claim.",
      "We may update these Terms; the effective date on this page will change when we do.",
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "What we collect",
    paragraphs: [
      "Account: name, work email, hashed password, organization name.",
      "Workspace: vaults, secret names/types/permissions, members, roles, access requests, audit events. Secret values are encrypted — never in logs or URLs.",
      "Technical: IP, browser, security events, and a session cookie to keep you signed in.",
      "Billing: plan, interval, transaction ids, and card brand/last4 from Lemon Squeezy. We never store full card numbers.",
    ],
  },
  {
    heading: "How we use it",
    paragraphs: [
      "To run and secure Secrela, authenticate users, enforce access control, send transactional email (verify, invites, alerts), process subscriptions, and meet legal duties.",
      "We do not sell personal data. We do not use your secrets to train public AI models.",
    ],
  },
  {
    heading: "Sharing",
    paragraphs: [
      "Only with infrastructure and email providers under contract, and with Lemon Squeezy for card payments.",
      "We may disclose information if required by law or to protect users, with appropriate safeguards.",
    ],
  },
  {
    heading: "Security & retention",
    paragraphs: [
      "HTTPS in transit, hashed passwords, session controls, encrypted secret values. You still protect devices, MFA, and who you invite.",
      "We keep data while your organization is active, then delete or anonymize it except where records must be kept (for example invoices at Lemon Squeezy).",
    ],
  },
  {
    heading: "Your choices",
    paragraphs: [
      "Update your profile in the app. Owners can remove members or delete the workspace. Email sales@secrela.com to close an account.",
      "Secrela is for business use and is not directed at children under 16.",
    ],
  },
];

export const REFUND_SECTIONS: LegalSection[] = [
  {
    heading: "When refunds apply",
    paragraphs: [
      "You can request a refund within 14 days of payment if Secrela was not provisioned, was unavailable due to our fault, or you were charged in error (duplicate or wrong plan).",
      "Card charges are processed by Lemon Squeezy as Merchant of Record. Approved refunds go back to the original payment method.",
    ],
  },
  {
    heading: "When refunds do not apply",
    paragraphs: [
      "After 14 days, or if the workspace already used paid features (vaults, secrets, invites), unless law or Lemon Squeezy buyer protection requires otherwise.",
      "Free trial usage is not a paid purchase and is not refundable.",
    ],
  },
  {
    heading: "How to request",
    paragraphs: [
      "Email sales@secrela.com from the billing owner's work email with: organization name, plan, payment date, and reason.",
      "Approved refunds usually appear in 5–10 business days. Contact us before a chargeback so we can fix the issue first.",
    ],
  },
];
