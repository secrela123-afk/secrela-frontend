import type { Metadata } from "next";
import { IntegrationsPage } from "../../../components/app/pages/MorePages";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Integrations") };

export default function Page() {
  return <IntegrationsPage />;
}
