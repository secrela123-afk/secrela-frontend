import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailScreen } from "./verify-email-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Verify email"),
  description: "Confirm your Secrela account email address.",
};

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailScreen />
    </Suspense>
  );
}
