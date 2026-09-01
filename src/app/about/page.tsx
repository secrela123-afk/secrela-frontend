import type { Metadata } from "next";
import { AboutPage } from "../../components/legal/AboutPage";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("About"),
  description:
    "Secrela is a company secrets and access-control platform. Assume breach. Minimize exposure. Control every access.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
