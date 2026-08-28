import type { Metadata } from "next";
import { RolesPage } from "../../../components/app/pages/RolesPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Roles") };

export default function Page() {
  return <RolesPage />;
}
