import type { Metadata } from "next";
import { VaultsPage } from "../../../components/app/pages/VaultsPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Vaults") };

export default function Page() {
  return <VaultsPage />;
}
