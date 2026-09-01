import type { Metadata } from "next";
import { LegalDocument } from "../../components/legal/LegalDocument";
import { REFUND_SECTIONS } from "../../lib/legal-content";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Refund Policy"),
  description:
    "Secrela refund policy for paid plans. Card payments are processed by Paddle as Merchant of Record.",
};

export default function RefundPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Refund Policy"
      intro="How refunds work for Secrela paid plans, including purchases processed by Paddle as Merchant of Record."
      sections={REFUND_SECTIONS}
    />
  );
}
