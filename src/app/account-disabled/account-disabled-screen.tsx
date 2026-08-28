"use client";

import Link from "next/link";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import { authPrimaryBtn } from "../../components/auth/auth-classes";
import { ArrowRightIcon, ShieldOutlineIcon } from "../../components/auth/icons";
import { BoltIcon, MailIcon } from "../../components/auth/icons";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Membership paused",
    description: "An admin disabled your access to this workspace temporarily.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Contact your admin",
    description: "They can re-enable your account from the Members page.",
    icon: MailIcon,
  },
  {
    title: "Sessions stay secure",
    description: "Sign out if you no longer need access on this device.",
    icon: BoltIcon,
  },
];

export function AccountDisabledScreen() {
  const { logout } = useWorkspaceActions();

  return (
    <AuthSplitLayout
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-warning/50 px-3 py-1 text-[11px] font-medium text-warning">
          Access blocked
        </span>
      }
      title={
        <>
          Account <span className="text-warning">disabled</span>
        </>
      }
      description="An Owner or Admin disabled your membership. You cannot open this workspace until they enable your account again."
      benefits={BENEFITS}
      footerNote="If you think this is a mistake, contact your organization admin."
    >
      <div className="flex w-full flex-col">
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Your credentials are still valid, but this workspace is blocked for
          your user until an administrator restores access.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className={`${authPrimaryBtn} mt-8`}
        >
          <span>Sign out</span>
          <span className="absolute right-[1.15rem]">
            <ArrowRightIcon className="h-5 w-5" />
          </span>
        </button>
        <Link
          href="/login"
          className="mt-4 text-center text-[13px] font-medium text-text-secondary hover:text-brand-primary"
        >
          Back to login
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
