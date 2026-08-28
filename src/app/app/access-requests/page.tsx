import type { Metadata } from "next";
import { AccessRequestsPage } from "../../../components/app/pages/AccessRequestsPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Access Requests") };

export default function Page() {
  return <AccessRequestsPage />;
}
