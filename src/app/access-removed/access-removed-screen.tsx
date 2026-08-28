"use client";

import Link from "next/link";
import {
  AuthSplitLayout,
  type AuthSplitBenefit,
} from "../../components/auth/AuthSplitLayout";
import { authPrimaryBtn } from "../../components/auth/auth-classes";
import { ArrowRightIcon, ShieldOutlineIcon } from "../../components/auth/icons";
import { MailIcon, UsersIcon } from "../../components/auth/icons";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";

const BENEFITS: AuthSplitBenefit[] = [
  {
    title: "Removed from workspace",
    description: "An admin removed your membership from this organization.",
    icon: UsersIcon,
  },
  {
    title: "Need a new invite",
    description: "Old invitation links no longer work after removal.",
    icon: MailIcon,
  },
  {
    title: "Stay protected",
    description: "Sign out on shared devices after access changes.",
    icon: ShieldOutlineIcon,
  },
];

export function AccessRemovedScreen() {
  const { logout } = useWorkspaceActions();

  return (
    <AuthSplitLayout
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-danger/45 px-3 py-1 text-[11px] font-medium text-danger">
          Access removed
        </span>
      }
      title={
        <>
          You were <span className="text-danger">removed</span>
        </>
      }
      description="An Owner or Admin removed you from the workspace. Your sessions were ended and old invitation links no longer work."
      benefits={BENEFITS}
      footerNote="To return, ask an admin to send a new invitation email."
    >
      <div className="flex w-full flex-col">
        <p className="text-[13px] leading-relaxed text-text-secondary">
          Open the <strong className="text-text-primary">new</strong> invite
          link from your admin, then sign in again to rejoin the team.
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
