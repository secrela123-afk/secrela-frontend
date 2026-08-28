import type { Metadata } from "next";
import { AuditLogsPage } from "../../../components/app/pages/AuditLogsPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Audit Logs") };

export default function Page() {
  return <AuditLogsPage />;
}
