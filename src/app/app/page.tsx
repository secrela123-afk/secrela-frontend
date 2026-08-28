import type { Metadata } from "next";
import { OverviewDashboard } from "../../components/app/overview/OverviewDashboard";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Overview"),
  description: "Organization overview and security command center.",
};

export default function AppOverviewPage() {
  return <OverviewDashboard />;
}
