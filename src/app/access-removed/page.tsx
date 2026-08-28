import type { Metadata } from "next";
import { pageTitle } from "../../lib/brand";
import { AccessRemovedScreen } from "./access-removed-screen";

export const metadata: Metadata = { title: pageTitle("Access removed") };

export default function Page() {
  return <AccessRemovedScreen />;
}
