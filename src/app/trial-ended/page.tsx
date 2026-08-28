import type { Metadata } from "next";
import { TrialEndedScreen } from "./trial-ended-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Free trial ended"),
  description: "Subscribe to continue using SecureVault.",
};

export default function TrialEndedPage() {
  return <TrialEndedScreen />;
}
