"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError, loginRequest, verifyMfaRequest } from "../../lib/api";
import {
  apiErrorMessage,
  validateAuthenticatorOrRecoveryCode,
} from "../../lib/otp-form";
import { syncFreeTrialUsedFromUser } from "../../lib/free-trial";
import { tryJoinFromInviteFlow } from "../../lib/join-invite";
import { rememberAuthNext } from "../../lib/auth-next";
import { APP_NAME } from "../../lib/brand";
import {
  APP_HOME,
  authPathWithNext,
  postAuthPath,
  sanitizeNextPath,
  verifyEmailPendingPath,
} from "../../lib/routes";
import { toast } from "../../stores/toast-store";
import {
  triggerAuthFormLogoError,
  useAuthLogo,
} from "./auth-logo-context";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";
import {
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  SpinnerIcon,
} from "./icons";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const EMAIL_KEY = "sv_remember_email";

type Step = "credentials" | "mfa";

function inviteTokenFromNext(next: string | null): string | undefined {
  if (!next) return undefined;
  try {
    const url = new URL(next, "http://local.invalid");
    if (!url.pathname.includes("/invite/accept")) return undefined;
    return url.searchParams.get("token")?.trim() || undefined;
  } catch {
    return undefined;
  }
}

const inputClass =
  "block h-10 w-full rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/80 pl-10 pr-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow] duration-fast placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus";

const ssoBtnClass =
  "flex h-9 items-center justify-center gap-1.5 rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/50 text-[12px] font-medium text-text-primary transition-[border-color,background-color] duration-fast hover:border-brand-primary/35 hover:bg-surface-elevated focus-visible:outline-none focus-visible:shadow-focus";

/**
 * Secrela login card — same visual language as RegisterForm; keeps MFA + remember + invite flows.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const logo = useAuthLogo();
  const justVerified = searchParams.get("verified") === "1";
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const inviteToken = inviteTokenFromNext(nextPath);
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(EMAIL_KEY);
    const fromQuery = searchParams.get("email")?.trim();
    if (fromQuery) {
      setEmail(fromQuery);
    } else if (saved) {
      setEmail(saved);
      setRemember(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (nextPath) rememberAuthNext(nextPath);
  }, [nextPath]);

  async function goAfterAuth(user: {
    email?: string;
    emailVerified?: boolean;
    freeTrialUsed?: boolean;
  }) {
    const join = await tryJoinFromInviteFlow(nextPath);
    if (join === "joined") {
      toast.success("Joined workspace", "Your invitation was accepted.");
      router.replace(APP_HOME);
      router.refresh();
      return;
    }
    router.replace(postAuthPath(user, nextPath));
    router.refresh();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (step === "credentials") {
      if (!email.trim()) {
        triggerAuthFormLogoError(logo);
        setError("Work email is required");
        return;
      }
      if (!password) {
        triggerAuthFormLogoError(logo);
        setError("Password is required");
        return;
      }
    } else {
      const validationError = validateAuthenticatorOrRecoveryCode(code);
      if (validationError) {
        triggerAuthFormLogoError(logo);
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    logo?.setState("loading");

    try {
      if (step === "credentials") {
        const result = await loginRequest(
          email.trim(),
          password,
          inviteToken,
        );
        if (remember) window.localStorage.setItem(EMAIL_KEY, email.trim());
        else window.localStorage.removeItem(EMAIL_KEY);

        if (result.mfaRequired) {
          logo?.setState("idle");
          setStep("mfa");
          setCode("");
          return;
        }

        syncFreeTrialUsedFromUser(
          "freeTrialUsed" in result.user ? result.user.freeTrialUsed : undefined,
        );

        await playSuccessThen(() => {
          void goAfterAuth(result.user);
        });
        return;
      }

      const mfaResult = await verifyMfaRequest(code.trim());
      syncFreeTrialUsedFromUser(
        "freeTrialUsed" in mfaResult.user
          ? mfaResult.user.freeTrialUsed
          : undefined,
      );
      await playSuccessThen(() => {
        void goAfterAuth(mfaResult.user);
      });
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_NOT_VERIFIED") {
        logo?.setState("idle");
        router.replace(verifyEmailPendingPath(email.trim(), nextPath));
        return;
      }
      if (err instanceof ApiError && err.code === "REINVITE_REQUIRED") {
        logo?.setState("idle");
        setError(
          "Your access was removed. Open a new invitation email to sign in and join again.",
        );
        return;
      }
      if (err instanceof ApiError && err.code === "MEMBER_DISABLED") {
        logo?.setState("idle");
        setError(
          "Your account is disabled. Contact an Owner or Admin to enable access again.",
        );
        return;
      }
      triggerAuthFormLogoError(logo);
      setError(
        apiErrorMessage(err, "Unable to sign in right now"),
      );
    } finally {
      setLoading(false);
    }
  }

  async function playSuccessThen(navigate: () => void) {
    if (prefersReducedMotion()) {
      logo?.setState("idle");
      navigate();
      return;
    }
    logo?.setState("success");
    await wait(600);
    navigate();
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col" noValidate>
      <div className="flex flex-col items-center text-center">
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

        {step === "credentials" ? (
          <>
            <h2 className="mt-3 text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.625rem]">
              Welcome <span className="text-brand-primary">back</span>
            </h2>
            <p className="mt-1.5 max-w-sm text-[13px] leading-snug text-text-secondary">
              Sign in to access your secure vault and manage your secrets.
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.625rem]">
              Confirm <span className="text-brand-primary">it&apos;s you</span>
            </h2>
            <p className="mt-1.5 max-w-sm text-[13px] leading-snug text-text-secondary">
              Enter the 6-digit code from your authenticator app, or a one-time
              recovery code.
            </p>
          </>
        )}
      </div>

      {justVerified && step === "credentials" ? (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-brand-primary/30 bg-brand-primary/10 px-3 py-2.5 text-left text-[12px] text-text-secondary">
          <MailIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
          <p>Email verified. Sign in to continue.</p>
        </div>
      ) : null}

      {step === "credentials" ? (
        <div className="mt-5 flex flex-col gap-3">
          <Field label="Work email">
            <MailIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              name="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={inputClass}
            />
          </Field>

          <Field label="Password">
            <LockIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••••"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </button>
          </Field>

          <div className="flex items-center justify-between gap-3 pt-0.5">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-text-secondary">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-3.5 w-3.5 rounded-xs border-border-default accent-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-[12px] font-semibold text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          <Field label="Authenticator or recovery code">
            <input
              type="text"
              name="code"
              inputMode="text"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456 or xxxx-xxxx"
              className={`${inputClass} pl-3`}
            />
          </Field>
          <button
            type="button"
            className="self-start text-[12px] text-text-muted hover:text-text-secondary focus-visible:outline-none focus-visible:shadow-focus"
            onClick={() => {
              setStep("credentials");
              setError(null);
            }}
          >
            Use a different account
          </button>
        </div>
      )}

      {error && step === "credentials" ? (
        <p className="mt-3 text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="relative mt-5 flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-[14px] font-bold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow,transform] duration-fast hover:bg-brand-primary-hover hover:shadow-glow-green-strong hover:-translate-y-px focus-visible:outline-none focus-visible:shadow-focus active:translate-y-0 disabled:cursor-wait motion-reduce:hover:translate-y-0"
      >
        <span>
          {step === "mfa" ? "Verify and continue" : "Sign in to your account"}
        </span>
        <span className="absolute right-3.5">
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightIcon className="h-4 w-4" />
          )}
        </span>
      </button>

      {error && step === "mfa" ? (
        <p className="mt-3 text-center text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {step === "credentials" ? (
        <>
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border-subtle" />
            <span className="shrink-0 text-[11px] text-text-muted">
              or continue with
            </span>
            <span className="h-px flex-1 bg-border-subtle" />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/v1/auth/oauth/google?next=/app`}
              className={ssoBtnClass}
            >
              <GoogleIcon className="h-3.5 w-3.5" />
              Continue with Google
            </a>
          </div>

          <p className="mt-5 text-center text-[13px] text-text-secondary">
            Don&apos;t have an account?{" "}
            <Link
              href={authPathWithNext("/register", {
                email: email.trim() || undefined,
                next: nextPath,
              })}
              className="font-semibold text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
            >
              Sign up
            </Link>
          </p>
        </>
      ) : null}
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-left text-[12px] font-medium text-text-primary">
      {label}
      <span className="relative mt-1 block">{children}</span>
    </label>
  );
}
