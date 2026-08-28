import type { Metadata } from "next";
import { MembersPage } from "../../../components/app/pages/MembersPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Members") };

export default function Page() {
  return <MembersPage />;
}
