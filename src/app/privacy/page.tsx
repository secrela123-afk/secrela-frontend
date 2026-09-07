import type { Metadata } from "next";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { PRIVACY_SECTIONS } from "../../lib/legal-content";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Privacy Policy"),
  description: "What Secrela collects, how we use it, and your choices.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      intro="Clear answers about your data. Card numbers stay with Lemon Squeezy — we never see them."
      sections={PRIVACY_SECTIONS}
    />
  );
}
