"use client";

import { Suspense } from "react";
import { AcceptInviteClient } from "../../../components/auth/AcceptInviteClient";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../../components/auth/AuthSplitLayout";
import {
  ShieldOutlineIcon,
  UsersIcon,
  BoltIcon,
} from "../../../components/auth/icons";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Join your team securely",
    description: "Accept the invite to access your organization's vaults.",
    icon: UsersIcon,
  },
  {
    title: "Role-based access",
    description: "Your admin assigned permissions before you join.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Ready in seconds",
    description: "Sign in and land in the workspace right after accepting.",
    icon: BoltIcon,
  },
];

export function AcceptInviteScreen() {
  return (
    <AuthSplitLayout
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-primary/50 px-3 py-1 text-[11px] font-medium text-brand-primary">
          <ShieldOutlineIcon className="h-3 w-3" />
          Team invitation
        </span>
      }
      title={
        <>
          Join your team on{" "}
          <span className="text-brand-primary">Secrela</span>
        </>
      }
      description="You've been invited to a secure workspace. Review the details and accept to get started."
      benefits={BENEFITS}
      footerNote="Invitations expire for security. Only open links from people you trust."
    >
      <Suspense fallback={null}>
        <AcceptInviteClient />
      </Suspense>
    </AuthSplitLayout>
  );
}
