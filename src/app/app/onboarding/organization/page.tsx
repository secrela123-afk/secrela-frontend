import type { Metadata } from "next";
import { pageTitle } from "../../../../lib/brand";
import { CreateOrganizationScreen } from "./create-organization-screen";

export const metadata: Metadata = {
  title: pageTitle("Create organization"),
  description: "Create your company workspace in SecureVault.",
};

export default function CreateOrganizationPage() {
  return <CreateOrganizationScreen />;
}
