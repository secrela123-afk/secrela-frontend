export const LEGAL_EFFECTIVE_DATE = "September 1, 2026";
export const LEGAL_CONTACT = "sales@secrela.com";
export const LEGAL_SITE = "https://secrela.com";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  after?: string[];
};

export const TERMS_SECTIONS: LegalSection[] = [
  {
    heading: "1. Agreement",
    paragraphs: [
      "These Terms of Service (\"Terms\") govern access to and use of Secrela (the \"Service\"), a company secrets and access-control platform available at secrela.com. By creating an account, inviting teammates, or paying for a plan, you agree to these Terms on behalf of the organization you represent.",
      "If you do not agree, do not use the Service.",
    ],
  },
  {
    heading: "2. The Service",
    paragraphs: [
      "Secrela lets organizations store, control, and audit access to company secrets such as passwords, API keys, and infrastructure credentials. Features, limits, and support levels depend on the plan you purchase (including the free trial, Starter, Team, or Business).",
      "We may improve, add, or remove features. We will not materially reduce paid plan capabilities during an already-paid period without notice, except where required for security or legal reasons.",
    ],
  },
  {
    heading: "3. Accounts and organizations",
    paragraphs: [
      "You must provide accurate registration information and keep it current. You are responsible for everyone who accesses the Service through your organization, for safeguarding credentials, and for enabling security controls such as email verification and multi-factor authentication where available.",
      "You must not share Owner/Admin access in a way that bypasses access control, and you must promptly revoke access for people who leave your organization.",
    ],
  },
  {
    heading: "4. Acceptable use",
    paragraphs: [
      "You may use Secrela only for lawful business purposes. You must not:",
    ],
    bullets: [
      "Probe, scan, or attack the Service, or attempt to access another tenant's data.",
      "Store illegal content or use the Service to violate export, sanctions, or privacy laws.",
      "Interfere with other customers, or resell the Service without our written consent.",
    ],
    after: [
      "We may suspend or terminate accounts that create security, legal, or operational risk.",
    ],
  },
  {
    heading: "5. Customer data and secrets",
    paragraphs: [
      "You retain ownership of the secrets and other data you submit (\"Customer Data\"). You grant us a limited license to host, process, and display Customer Data solely to provide the Service.",
      "You are responsible for the legality of Customer Data and for configuring who may reveal or copy secrets. We do not claim we are impossible to compromise. We design the Service so that a failure of one control should not automatically expose all customer secrets, but no hosted system can guarantee absolute security.",
    ],
  },
  {
    heading: "6. Fees, taxes, and payment processors",
    paragraphs: [
      "Paid plans are billed according to the prices shown at checkout. Card payments are processed by Paddle.com Market Ltd and/or its affiliates (\"Paddle\") as Merchant of Record. For those purchases, Paddle is the seller of record, collects payment (including applicable taxes), and issues the customer receipt. PayPal may be offered as an alternative checkout method.",
      "Unless stated otherwise, prices may be tax-inclusive or tax-exclusive depending on your location and Paddle's tax calculation. Failed, expired, or unpaid periods may result in restricted access until payment succeeds.",
    ],
  },
  {
    heading: "7. Trials",
    paragraphs: [
      "Where a free trial is offered, it is limited in time and features as described in the product. One trial per organization unless we agree otherwise. After a trial ends, continued use of paid features requires a paid plan.",
    ],
  },
  {
    heading: "8. Termination",
    paragraphs: [
      "You may stop using the Service at any time. We may suspend or terminate access for breach of these Terms, non-payment, or risk to the platform. Upon termination, your right to access the Service ends. We may delete Customer Data after a reasonable retention window unless law requires longer retention.",
    ],
  },
  {
    heading: "9. Disclaimers and liability",
    paragraphs: [
      "The Service is provided \"as is.\" To the fullest extent permitted by law, we disclaim implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant uninterrupted or error-free operation.",
      "To the fullest extent permitted by law, our total liability arising out of the Service is limited to the fees you paid to us (or to Paddle for Secrela) in the three months before the claim. We are not liable for indirect, incidental, special, or consequential damages, or for loss of secrets caused by your access-control choices, compromised user devices, or credentials you share.",
    ],
  },
  {
    heading: "10. Changes",
    paragraphs: [
      "We may update these Terms. The \"Effective date\" at the top of this page will change when we do. Continued use after an update constitutes acceptance of the revised Terms. Material changes will be signaled in the product or by email where practical.",
    ],
  },
  {
    heading: "11. Contact",
    paragraphs: [
      "Questions about these Terms: sales@secrela.com. Website: https://secrela.com.",
    ],
  },
];

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    heading: "1. Who we are",
    paragraphs: [
      "This Privacy Policy explains how Secrela (\"we\", \"us\") collects, uses, and shares information when you use secrela.com and the Secrela application.",
      "For card checkout processed by Paddle, Paddle also acts as an independent controller/processor of payment data as described in Paddle's own privacy notice. We do not receive or store full payment card numbers.",
    ],
  },
  {
    heading: "2. Information we collect",
    paragraphs: [
      "Account data: name, work email, password (stored as a hash), organization name, and optional profile details you provide.",
      "Workspace data: vaults, secret metadata (names, types, permissions), membership, roles, access requests, and audit-log events. Secret values are stored encrypted. We do not put secret values in logs, URLs, or analytics.",
      "Usage and technical data: IP address, browser type, approximate location derived by our hosting provider or payment partner, security events (failed login, MFA changes), and cookies required to keep you signed in.",
      "Payment data: plan, billing interval, transaction identifiers, and limited card brand/last4 returned by the payment provider. Full PAN/CVV is handled only by Paddle or PayPal.",
    ],
  },
  {
    heading: "3. How we use information",
    paragraphs: [
      "We use information to provide and secure the Service, authenticate users, enforce access control, prevent abuse, send transactional email (verification, invites, security alerts), process subscriptions, and comply with law.",
      "We do not sell personal information. We do not use Customer Data (including secrets) to train public AI models.",
    ],
  },
  {
    heading: "4. Sharing",
    paragraphs: [
      "Infrastructure and email providers that host or deliver the Service under contract.",
      "Payment partners: Paddle (Merchant of Record for card checkout) and PayPal when you choose PayPal. They process payments, taxes, and receipts.",
      "We may disclose information if required by law, to protect users, or in connection with a merger or sale of the business, with appropriate safeguards.",
    ],
  },
  {
    heading: "5. Cookies and sessions",
    paragraphs: [
      "We use an HttpOnly session cookie to keep you signed in. This is necessary for the Service to function. We do not use advertising cookies on the application.",
    ],
  },
  {
    heading: "6. Retention",
    paragraphs: [
      "We keep account and workspace data while your organization is active. After deletion or prolonged inactivity, we delete or anonymize data except where we must retain records (for example security incidents or invoices held by Paddle).",
    ],
  },
  {
    heading: "7. Security",
    paragraphs: [
      "We use encryption in transit (HTTPS), hashed passwords, session controls, and encryption for stored secret values. No method of transmission or storage is completely secure. You must also protect your devices, MFA, and who you invite.",
    ],
  },
  {
    heading: "8. Your choices",
    paragraphs: [
      "You may access or update profile details in the product, invite or remove members if you are authorized, and request account closure by emailing sales@secrela.com. Organization Owners control workspace deletion.",
    ],
  },
  {
    heading: "9. International processing",
    paragraphs: [
      "We and our processors may process data in countries other than yours. Payment data is processed according to Paddle's and PayPal's locations and policies.",
    ],
  },
  {
    heading: "10. Children",
    paragraphs: [
      "The Service is for business use and is not directed at children under 16. We do not knowingly collect information from children.",
    ],
  },
  {
    heading: "11. Contact",
    paragraphs: [
      "Privacy questions: sales@secrela.com.",
    ],
  },
];

export const REFUND_SECTIONS: LegalSection[] = [
  {
    heading: "1. Overview",
    paragraphs: [
      "This Refund Policy explains how refunds work for Secrela paid plans. It applies to purchases made on secrela.com.",
      "Card checkout is processed by Paddle as Merchant of Record. Paddle is the seller of record for those transactions, collects the payment, and is responsible for issuing refunds on eligible card payments. PayPal purchases follow PayPal's refund process for that payment method.",
    ],
  },
  {
    heading: "2. Digital service",
    paragraphs: [
      "Secrela is a digital software-as-a-service. Access to the workspace (vaults, secrets, members, and security features) is delivered immediately when a paid plan is activated.",
    ],
  },
  {
    heading: "3. Eligibility",
    paragraphs: [
      "You may request a refund within 14 days of a successful payment if the Service was not provisioned, was unavailable due to our fault, or you were charged in error (duplicate charge or wrong plan).",
      "Refunds are generally not available after the 14-day window, or where the organization has actively used paid features (creating vaults, storing secrets, inviting members) unless required by law or Paddle's buyer-protection rules.",
      "Free-trial usage is not a paid purchase and is not refundable.",
    ],
  },
  {
    heading: "4. How to request a refund",
    paragraphs: [
      "Email sales@secrela.com from the billing owner's work email. Include: organization name, plan (Starter or Team), approximate payment date, and the reason.",
      "We will review the request and, for Paddle card payments, work with Paddle to process an approved refund to the original payment method. Refunds typically appear within 5–10 business days depending on the card network and bank.",
    ],
  },
  {
    heading: "5. Taxes and fees",
    paragraphs: [
      "If a refund is issued, taxes collected by Paddle may be reversed according to tax rules in the buyer's jurisdiction. Payment-processor fees are handled by Paddle or PayPal and may not always be returned in full.",
    ],
  },
  {
    heading: "6. Chargebacks",
    paragraphs: [
      "Please contact us before opening a chargeback so we can resolve the issue. Unwarranted chargebacks may lead to account suspension while the dispute is investigated.",
    ],
  },
  {
    heading: "7. Contact",
    paragraphs: [
      "Refund requests and billing questions: sales@secrela.com.",
    ],
  },
];
