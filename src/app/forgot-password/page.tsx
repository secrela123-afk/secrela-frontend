import type { Metadata } from "next";
import { ForgotPasswordScreen } from "./forgot-password-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Forgot password"),
  description: "Request a secure link to reset your Secrela password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
