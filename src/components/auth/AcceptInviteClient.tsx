"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../lib/api";
import {
  authPathWithNext,
  inviteAcceptPath,
  sanitizeNextPath,
} from "../../lib/routes";
import { useAcceptInviteMutation } from "../../hooks/queries/useAcceptInviteMutation";
import { useInvitePreviewQuery } from "../../hooks/queries/useInvitePreviewQuery";
import { useSessionQuery } from "../../hooks/queries/useSessionQuery";
import { useWorkspaceActions } from "../../hooks/workspace/useWorkspaceActions";
import { toast } from "../../stores/toast-store";
import {
  authCallout,
  authEnter,
  authOutlineBtn,
  authPrimaryBtn,
} from "./auth-classes";
import { AuthPrimaryButton } from "./AuthPrimaryButton";
import { SpinnerIcon } from "./icons";

function roleLabel(roleName: string) {
  return roleName;
}

function reasonMessage(reason: string) {
  if (reason === "expired") return "This invitation has expired.";
  if (reason === "revoked") return "This invitation was revoked.";
  if (reason === "accepted") return "This invitation was already accepted.";
  return "This invitation link is invalid.";
}

/**
 * Public accept page — preview + session via Query; accept via mutation.
 */
export function AcceptInviteClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const returnPath = inviteAcceptPath(token);
  const { logout } = useWorkspaceActions();

  const previewQuery = useInvitePreviewQuery(token || null);
  const acceptInvite = useAcceptInviteMutation();
  const {
    data: sessionUser,
    isPending: sessionPending,
  } = useSessionQuery(Boolean(token));

  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const autoAcceptStarted = useRef(false);

  const preview = previewQuery.data;
  const invite = preview?.invitation;
  const usable = preview?.usable === true && invite != null;

  const emailMatches =
    sessionUser &&
    invite &&
    sessionUser.email.toLowerCase() === invite.email.toLowerCase();

  async function onAccept() {
    if (!token) return;
    setAcceptError(null);
    try {
      await acceptInvite.mutateAsync(token);
      toast.success(
        "Joined workspace",
        invite ? `Welcome to ${invite.organization.name}.` : undefined,
      );
      router.replace("/app");
      router.refresh();
    } catch (err) {
      setAcceptError(
        err instanceof ApiError
          ? err.message
          : "Unable to accept this invitation",
      );
    }
  }

  useEffect(() => {
    if (
      !usable ||
      !token ||
      !sessionUser?.emailVerified ||
      !emailMatches ||
      autoAcceptStarted.current ||
      acceptInvite.isPending
    ) {
      return;
    }
    autoAcceptStarted.current = true;
    void onAccept();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-join once when ready
  }, [usable, token, sessionUser?.emailVerified, emailMatches]);

  async function onLogout() {
    setLoggingOut(true);
    setAcceptError(null);
    await logout();
    setLoggingOut(false);
  }

  if (!token) {
    return (
      <div className={`${authEnter} mx-auto w-full max-w-[420px] text-center`}>
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">
          Invalid invitation link
        </h1>
        <p className="mt-3 text-body text-text-secondary">
          Open the link from your invitation email, or ask your admin to send a
          new invite.
        </p>
        <Link href="/login" className={`${authPrimaryBtn} mt-6 inline-flex`}>
          Sign in
        </Link>
      </div>
    );
  }

  if (previewQuery.isPending || sessionPending) {
    return (
      <div className="mt-8 text-center">
        <SpinnerIcon className="mx-auto h-8 w-8 animate-spin text-brand-primary" />
        <p className="mt-4 text-body text-text-secondary">
          Loading invitation…
        </p>
      </div>
    );
  }

  if (previewQuery.isError || !preview || preview.reason === "invalid") {
    return (
      <div className={`${authEnter} mx-auto w-full max-w-[420px] text-center`}>
        <h1 className="text-[28px] font-bold tracking-tight text-text-primary">
          Invitation not found
        </h1>
        <p className="mt-3 text-body text-text-secondary">
          This link may be broken or already used. Ask your admin for a new
          invite.
        </p>
        <Link href="/login" className={`${authPrimaryBtn} mt-6 inline-flex`}>
          Sign in
        </Link>
      </div>
    );
  }

  if (!usable && invite) {
    return (
      <div className={`${authEnter} mx-auto w-full max-w-[420px]`}>
        <h1 className="text-center text-[28px] font-bold tracking-tight text-text-primary">
          Invitation unavailable
        </h1>
        <p className="mt-3 text-center text-body text-text-secondary">
          {reasonMessage(preview.reason)}
        </p>
        <div className={`${authCallout} mt-5`}>
          <p>
            <span className="font-semibold text-text-primary">
              {invite.organization.name}
            </span>
            {" · "}
            {invite.email} · {roleLabel(invite.roleName)}
          </p>
        </div>
        <Link href="/login" className={`${authPrimaryBtn} mt-6 inline-flex`}>
          Sign in
        </Link>
      </div>
    );
  }

  if (!invite) return null;

  const loginHref = authPathWithNext("/login", {
    email: invite.email,
    next: returnPath,
  });
  const registerHref = authPathWithNext("/register", {
    email: invite.email,
    next: returnPath,
  });

  return (
    <div className={`${authEnter} mx-auto flex w-full max-w-[420px] flex-col`}>
      <h1 className="text-center text-[28px] font-bold tracking-tight text-text-primary sm:text-left">
        Join{" "}
        <span className="text-brand-primary">{invite.organization.name}</span>
      </h1>
      <p className="mt-2 text-center text-body text-text-secondary sm:text-left">
        You were invited as{" "}
        <span className="font-semibold text-text-primary">
          {roleLabel(invite.roleName)}
        </span>
        . Accept to access the company workspace.
      </p>

      <div className={`${authCallout} mt-5`}>
        <p>
          Invited email:{" "}
          <span className="font-semibold text-text-primary">{invite.email}</span>
        </p>
        <p className="mt-1 text-text-muted">
          Expires {new Date(invite.expiresAt).toLocaleDateString()}
        </p>
      </div>

      {!sessionUser ? (
        <div className="mt-6 space-y-3">
          <p className="text-small text-text-secondary">
            Sign in or create an account with the invited email to continue.
          </p>
          <Link href={loginHref} className={`${authPrimaryBtn} inline-flex`}>
            Sign in to accept
          </Link>
          <Link href={registerHref} className={`${authOutlineBtn} inline-flex`}>
            Create account
          </Link>
        </div>
      ) : !sessionUser.emailVerified ? (
        <div className="mt-6 space-y-3">
          <p className="text-small text-warning">
            Verify your email before accepting this invitation.
          </p>
          <Link
            href={authPathWithNext("/verify-email", {
              email: sessionUser.email,
              next: sanitizeNextPath(returnPath),
            })}
            className={`${authPrimaryBtn} inline-flex`}
          >
            Verify email
          </Link>
        </div>
      ) : !emailMatches ? (
        <div className="mt-6 space-y-3">
          <p className="text-small text-danger" role="alert">
            You are signed in as{" "}
            <span className="font-semibold">{sessionUser.email}</span>, but this
            invite was sent to{" "}
            <span className="font-semibold">{invite.email}</span>.
          </p>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void onLogout()}
            className={`${authOutlineBtn} disabled:opacity-50`}
          >
            {loggingOut ? "Signing out…" : "Sign out and use invited email"}
          </button>
          <Link href={loginHref} className={`${authPrimaryBtn} inline-flex`}>
            Sign in as {invite.email}
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <p className="text-small text-text-secondary">
            Joining{" "}
            <span className="font-semibold text-text-primary">
              {invite.organization.name}
            </span>
            …
          </p>
          {acceptError ? (
            <p className="text-small text-danger" role="alert">
              {acceptError}
            </p>
          ) : null}
          {acceptError ? (
            <AuthPrimaryButton
              loading={acceptInvite.isPending}
              onClick={() => void onAccept()}
            >
              Try again
            </AuthPrimaryButton>
          ) : (
            <SpinnerIcon className="mx-auto h-6 w-6 animate-spin text-brand-primary sm:mx-0" />
          )}
        </div>
      )}
    </div>
  );
}
