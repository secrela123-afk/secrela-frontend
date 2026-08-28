import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppAuthGate } from "../../components/app/AppAuthGate";
import { pageTitle } from "../../lib/brand";

export const metadata: Metadata = {
  title: pageTitle("Workspace"),
  description: "SecureVault application workspace.",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppAuthGate>{children}</AppAuthGate>;
}
