import type { Metadata } from "next";
import { SecurityCenterPage } from "../../../components/app/pages/SecurityCenterPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Security Center") };

export default function Page() {
  return <SecurityCenterPage />;
}
