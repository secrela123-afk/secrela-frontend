import type { Metadata } from "next";
import { Suspense } from "react";
import { pageTitle } from "../../../lib/brand";
import { AcceptInviteScreen } from "./accept-invite-screen";

export const metadata: Metadata = {
  title: pageTitle("Accept invitation"),
  description: "Accept your organization invitation to join the workspace.",
};

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteScreen />
    </Suspense>
  );
}
