import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutScreen } from "./checkout-screen";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Checkout"),
  description: "Subscribe to SecureVault.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutScreen />
    </Suspense>
  );
}
