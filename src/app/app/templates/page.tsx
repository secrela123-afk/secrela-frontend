import type { Metadata } from "next";
import { TemplatesPage } from "../../../components/app/pages/MorePages";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Templates") };

export default function Page() {
  return <TemplatesPage />;
}
