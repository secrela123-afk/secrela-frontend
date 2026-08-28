import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterScreen } from "./register-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Create account"),
  description:
    "Start your Secrela free trial. Enterprise-grade security for company secrets — no credit card required.",
};

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterScreen />
    </Suspense>
  );
}
