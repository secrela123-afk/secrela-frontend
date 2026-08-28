"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ApiError,
  meRequest,
  verifyEmailRequest,
} from "../../lib/api";
import {
  APP_HOME,
  authPathWithNext,
  sanitizeNextPath,
} from "../../lib/routes";
import { peekAuthNext, rememberAuthNext, takeAuthNext } from "../../lib/auth-next";
import { tryJoinFromInviteFlow } from "../../lib/join-invite";
import { syncFreeTrialUsedFromUser } from "../../lib/free-trial";
import { toast } from "../../stores/toast-store";
import { APP_NAME } from "../../lib/brand";
import { AuthFlowSteps, VERIFY_FLOW_STEPS } from "./AuthFlowSteps";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";
import { useAuthLogo } from "./auth-logo-context";
import {
  ArrowRightIcon,
  MailIcon,
  SpinnerIcon,
} from "./icons";

type Status = "pending" | "loading" | "success" | "error";

async function destinationAfterVerify(next: string | null): Promise<string> {
  const fromQuery = sanitizeNextPath(next);
  const fromStorage = sanitizeNextPath(peekAuthNext());
  const safeNext = fromQuery ?? fromStorage;

  try {
    const me = await meRequest();
    syncFreeTrialUsedFromUser(me.user.freeTrialUsed);
    if (!me.user.emailVerified) {
      if (safeNext) return authPathWithNext("/login", { next: safeNext });
      return "/login?verified=1";
    }

    takeAuthNext();
    const join = await tryJoinFromInviteFlow(safeNext);
    if (join === "joined") {
      toast.success("Joined workspace", "Your invitation was accepted.");
      return APP_HOME;
    }
    if (join === "continue" && safeNext) return safeNext;
    return APP_HOME;
  } catch {
    if (safeNext) return authPathWithNext("/login", { next: safeNext });
    return "/login?verified=1";
  }
}

function continueLabel(href: string): string {
  if (href.startsWith("/login")) return "Continue to sign in";
  if (href.startsWith("/invite/")) return "Continue to invitation";
  if (href.startsWith("/app")) return "Open dashboard";
  return "Continue";
}

function successMessage(href: string): string {
  if (href.startsWith("/login")) {
    return "Your email has been verified. Sign in to continue.";
  }
  if (href.startsWith("/invite/")) {
    return "Your email has been verified. Continue to accept your invitation…";
  }
  return "Your email has been verified. Opening your workspace…";
}

/**
 * Secrela verify-email card — pending / loading / success / error states.
 */
export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logo = useAuthLogo();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const [status, setStatus] = useState<Status>(token ? "loading" : "pending");
  const [message, setMessage] = useState("");
  const [continueHref, setContinueHref] = useState(APP_HOME);

  useEffect(() => {
    if (nextPath) rememberAuthNext(nextPath);
  }, [nextPath]);

  useEffect(() => {
    if (!token) {
      setStatus("pending");
      return;
    }

    let cancelled = false;
    setStatus("loading");
    logo?.setState("loading");

    verifyEmailRequest(token)
      .then(async () => {
        const href = await destinationAfterVerify(nextPath);
        if (cancelled) return;
        setContinueHref(href);
        setStatus("success");
        setMessage(successMessage(href));
        logo?.setState("success");
        window.setTimeout(() => {
          router.replace(href);
          router.refresh();
        }, 900);
      })
      .catch(async (err) => {
        try {
          const me = await meRequest();
          syncFreeTrialUsedFromUser(me.user.freeTrialUsed);
          if (me.user.emailVerified) {
            const href = await destinationAfterVerify(nextPath);
            if (cancelled) return;
            setContinueHref(href);
            setStatus("success");
            setMessage(successMessage(href));
            logo?.setState("success");
            window.setTimeout(() => {
              router.replace(href);
              router.refresh();
            }, 900);
            return;
          }
        } catch {
          /* ignore */
        }

        if (cancelled) return;
        setStatus("error");
        logo?.setState("error");
        window.setTimeout(() => logo?.setState("idle"), 700);
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Unable to verify your email right now.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [token, router, nextPath, logo]);

  const stepIndex = status === "success" ? 2 : 1;

  const registerHref = authPathWithNext("/register", {
    email: email.trim() || undefined,
    next: nextPath,
  });

  return (
    <div className="flex w-full flex-col">
      <div className="mb-5 flex flex-col items-center text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-inherit no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-focus"
          aria-label={APP_NAME}
        >
          <SecureVaultLogo
            state={logo?.state ?? "enter"}
            size={28}
            decorative
          />
          <span className="text-[14px] font-semibold tracking-tight text-text-primary">
            {APP_NAME}
          </span>
        </Link>
      </div>

      <AuthFlowSteps steps={VERIFY_FLOW_STEPS} current={stepIndex} />

      {status === "pending" ? (
        <div className="mt-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.625rem]">
              Check your <span className="text-brand-primary">email</span>
            </h2>
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-primary/40 text-brand-primary"
              aria-hidden="true"
            >
              <MailIcon className="h-4 w-4" />
            </span>
          </div>

          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
            We sent a verification link
            {email ? (
              <>
                {" "}
                to{" "}
                <span className="font-semibold text-text-primary">{email}</span>
              </>
            ) : null}
            . Open the link to activate your account and open the dashboard.
          </p>

          <div className="mt-4 flex items-start gap-2.5 rounded-md border border-border-subtle bg-background-secondary/60 px-3 py-2.5 text-[12px] leading-snug text-text-secondary">
            <MailIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
            <p>
              Don&apos;t see it? Check spam. After verification you go straight
              to your workspace — no extra setup step.
            </p>
          </div>

          <div className="mt-6 space-y-3 border-t border-border-subtle pt-5 text-[13px] text-text-secondary">
            <p>
              Wrong email?{" "}
              <Link
                href={registerHref}
                className="font-semibold text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
              >
                Change email
              </Link>
            </p>
            <p>
              Still having trouble?{" "}
              <button
                type="button"
                className="font-semibold text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
                onClick={() =>
                  toast.info(
                    "Resend coming soon",
                    "Use the original email or register again if the link expired.",
                  )
                }
              >
                Resend verification link
              </button>
            </p>
          </div>
        </div>
      ) : null}

      {status === "loading" ? (
        <div className="mt-8 text-center">
          <SpinnerIcon className="mx-auto h-8 w-8 animate-spin text-brand-primary" />
          <p className="mt-4 text-[14px] text-text-secondary">
            Verifying your email…
          </p>
        </div>
      ) : null}

      {status === "success" || status === "error" ? (
        <div className="mt-5">
          <h2 className="text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.625rem]">
            {status === "success" ? (
              <>
                Email <span className="text-brand-primary">verified</span>
              </>
            ) : (
              <>
                Verification <span className="text-brand-primary">failed</span>
              </>
            )}
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
            {message}
          </p>
          {status === "success" ? (
            <Link
              href={continueHref}
              className="relative mt-5 flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-[14px] font-bold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow] duration-fast hover:bg-brand-primary-hover hover:shadow-glow-green-strong focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span>{continueLabel(continueHref)}</span>
              <span className="absolute right-3.5">
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="relative mt-5 flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-[14px] font-bold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow] duration-fast hover:bg-brand-primary-hover hover:shadow-glow-green-strong focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span>Back to sign in</span>
              <span className="absolute right-3.5">
                <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
      ) : null}
    </div>
  );
}
