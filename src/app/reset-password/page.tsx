import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordScreen } from "./reset-password-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Reset password"),
  description: "Set a new password for your Secrela account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
