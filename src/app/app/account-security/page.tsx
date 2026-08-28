import type { Metadata } from "next";
import { SecuritySettingsPage } from "../../../components/security/SecuritySettingsPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Account security") };

export default function Page() {
  return <SecuritySettingsPage />;
}
