import type { Metadata } from "next";
import { AlertsPage } from "../../../components/app/pages/MorePages";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Security Alerts") };

export default function Page() {
  return <AlertsPage />;
}
