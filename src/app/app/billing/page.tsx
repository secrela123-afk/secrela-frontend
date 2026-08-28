import type { Metadata } from "next";
import { BillingPage } from "../../../components/app/BillingPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Billing") };

export default function Page() {
  return <BillingPage />;
}
