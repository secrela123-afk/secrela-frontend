import type { Metadata } from "next";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { TERMS_SECTIONS } from "../../lib/legal-content";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Terms of Service"),
  description:
    "Terms of Service for Secrela — company secrets and access management.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      intro="These terms govern your organization's use of Secrela. Please read them before creating a workspace or purchasing a plan."
      sections={TERMS_SECTIONS}
    />
  );
}
