"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ApiError } from "../../lib/api";
import { markFreeTrialUsedLocally } from "../../lib/free-trial";
import { APP_NAME } from "../../lib/brand";
import {
  APP_HOME,
  ACCOUNT_DISABLED_PATH,
  ACCESS_REMOVED_PATH,
  ORG_ONBOARDING_PATH,
  TRIAL_ENDED_PATH,
  verifyEmailPendingPath,
} from "../../lib/routes";
import { useWorkspaceQuery } from "../../hooks/queries/useWorkspaceQuery";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";
import { BrandLoadingScreen } from "../brand/BrandLoadingScreen";
import { AppShell } from "./AppShell";
import { NoOrganizationGate } from "./NoOrganizationGate";

/**
 * Guards /app/* — session + verified email + organization membership.
 */
export function AppAuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { invalidateWorkspace, logout } = useWorkspaceActions();
  const { data, error, isPending } = useWorkspaceQuery();

  const isOnboarding = pathname.startsWith("/app/onboarding");

  useEffect(() => {
    if (!data) return;

    if (!data.user.emailVerified) {
      router.replace(verifyEmailPendingPath(data.user.email));
      return;
    }

    if (!data.organization && data.user.reinviteRequired) {
      router.replace(ACCESS_REMOVED_PATH);
      return;
    }

    if (!data.organization && !isOnboarding) {
      router.replace(ORG_ONBOARDING_PATH);
      return;
    }
    if (data.organization && isOnboarding) {
      router.replace(APP_HOME);
    }
  }, [data, isOnboarding, router]);

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      router.replace("/login");
    }
  }, [error, router]);

  useEffect(() => {
    if (error instanceof ApiError && error.code === "MEMBER_DISABLED") {
      router.replace(ACCOUNT_DISABLED_PATH);
    }
  }, [error, router]);

  useEffect(() => {
    if (!(error instanceof ApiError)) return;

    if (error.code === "SUBSCRIPTION_EXPIRED") {
      markFreeTrialUsedLocally();
      router.replace(TRIAL_ENDED_PATH);
      return;
    }

    // Same gate as expiry — stay signed in, choose a paid plan.
    if (error.code === "SUBSCRIPTION_PAYMENT_REQUIRED") {
      router.replace(TRIAL_ENDED_PATH);
    }
  }, [error, router]);

  if (isPending && !data) {
    return <BrandLoadingScreen fullScreen label="Loading workspace" size={72} />;
  }

  if (error instanceof ApiError && error.code === "MEMBER_DISABLED") {
    return (
      <BrandLoadingScreen fullScreen label="Redirecting" size={56} />
    );
  }

  if (
    error &&
    !(
      error instanceof ApiError &&
      (error.status === 401 ||
        error.code === "SUBSCRIPTION_EXPIRED" ||
        error.code === "SUBSCRIPTION_PAYMENT_REQUIRED" ||
        error.code === "MEMBER_DISABLED")
    )
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background-primary px-6 text-center">
        <p className="text-label uppercase tracking-[0.2em] text-brand-primary">
          {APP_NAME}
        </p>
        <h1 className="text-page font-semibold text-text-primary">
          Workspace error
        </h1>
        <p className="max-w-md text-body text-danger">
          {error instanceof ApiError
            ? error.status >= 500 || error.status === 0
              ? "The API or database is unavailable. Check that the backend is running and MongoDB is connected."
              : error.message
            : "Unable to load your workspace"}
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded-sm bg-brand-primary px-5 py-3 text-small font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
        >
          Sign in again
        </button>
        <Link
          href="/login"
          className="text-small text-text-secondary hover:text-brand-primary"
        >
          Go to login
        </Link>
      </div>
    );
  }

  if (
    error instanceof ApiError &&
    (error.code === "SUBSCRIPTION_EXPIRED" ||
      error.code === "SUBSCRIPTION_PAYMENT_REQUIRED")
  ) {
    return (
      <BrandLoadingScreen fullScreen label="Redirecting" size={56} />
    );
  }

  if (!data?.user) return null;

  if (!data.user.emailVerified) return null;

  if (!data.organization || !data.role) {
    if (data.user.reinviteRequired) {
      return (
        <BrandLoadingScreen fullScreen label="Redirecting" size={56} />
      );
    }
    return (
      <NoOrganizationGate
        user={data.user}
        onJoinedOrCreated={() => {
          void invalidateWorkspace();
        }}
      />
    );
  }

  return (
    <AppShell>
      {children}
    </AppShell>
  );
}
