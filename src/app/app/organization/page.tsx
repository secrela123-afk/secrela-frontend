import type { Metadata } from "next";
import { OrganizationSettingsPage } from "../../../components/app/OrganizationSettingsPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Organization") };

export default function Page() {
  return <OrganizationSettingsPage />;
}
