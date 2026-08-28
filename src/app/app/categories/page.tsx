import type { Metadata } from "next";
import { CategoriesPage } from "../../../components/app/pages/MorePages";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Categories") };

export default function Page() {
  return <CategoriesPage />;
}
