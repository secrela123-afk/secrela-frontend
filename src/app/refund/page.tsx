import type { Metadata } from "next";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { REFUND_SECTIONS } from "../../lib/legal-content";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Refund Policy"),
  description: "When Secrela refunds apply and how to request one.",
};

export default function RefundPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Refund Policy"
      intro="When you can get a refund, when you cannot, and how to ask."
      sections={REFUND_SECTIONS}
    />
  );
}
