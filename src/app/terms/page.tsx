import type { Metadata } from "next";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { TERMS_SECTIONS } from "../../lib/legal-content";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Terms of Service"),
  description: "Rules for using Secrela with your organization.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      intro="The essentials for using Secrela with your team. Pick a topic on the left."
      sections={TERMS_SECTIONS}
    />
  );
}
