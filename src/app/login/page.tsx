import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginScreen } from "./login-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Sign in"),
  description:
    "Sign in to Secrela — access your secure vault and manage company secrets.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginScreen />
    </Suspense>
  );
}
