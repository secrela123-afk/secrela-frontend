import type { Metadata } from "next";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { PRIVACY_SECTIONS } from "../../lib/legal-content";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Privacy Policy"),
  description:
    "How Secrela collects, uses, and protects information — including payment processing by Paddle.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This notice describes the information we collect, how we use it, and the role of payment partners such as Paddle and PayPal."
      sections={PRIVACY_SECTIONS}
    />
  );
}
