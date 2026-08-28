"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import {
  BoltIcon,
  LockIcon,
  ShieldOutlineIcon,
} from "../../components/auth/icons";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Strong password rules",
    description: "We enforce length, complexity, and confirmation before saving.",
    icon: LockIcon,
  },
  {
    title: "Secure by design",
    description: "Your new password is hashed with industry-standard algorithms.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Back in quickly",
    description: "Once reset, sign in and return to your workspace immediately.",
    icon: BoltIcon,
  },
];

export function ResetPasswordScreen() {
  return (
    <AuthSplitLayout
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-primary/50 px-3 py-1 text-[11px] font-medium text-brand-primary">
          <ShieldOutlineIcon className="h-3 w-3" />
          Secure password reset
        </span>
      }
      title={
        <>
          Choose a new{" "}
          <span className="text-brand-primary">password</span>
        </>
      }
      description="Pick a strong password for your Secrela account. You'll use it the next time you sign in."
      benefits={BENEFITS}
      footerNote="Links expire for your safety. We never store plaintext passwords."
    >
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
