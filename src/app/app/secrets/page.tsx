import type { Metadata } from "next";
import { Suspense } from "react";
import { SecretsPage } from "../../../components/app/pages/SecretsPage";
import { pageTitle } from "../../../lib/brand";

export const metadata: Metadata = { title: pageTitle("Secrets") };

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[13px] text-text-muted lg:p-6">Loading secrets…</div>
      }
    >
      <SecretsPage />
    </Suspense>
  );
}
