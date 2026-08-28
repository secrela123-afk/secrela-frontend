import type { Metadata } from "next";
import { pageTitle } from "../../lib/brand";
import { AccountDisabledScreen } from "./account-disabled-screen";

export const metadata: Metadata = { title: pageTitle("Account disabled") };

export default function Page() {
  return <AccountDisabledScreen />;
}
