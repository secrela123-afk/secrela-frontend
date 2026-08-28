"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ApiError, forgotPasswordRequest } from "../../lib/api";
import { AuthFlowSteps, FORGOT_FLOW_STEPS } from "./AuthFlowSteps";
import {
  ArrowRightIcon,
  LockIcon,
  LockQuestionIcon,
  MailIcon,
  ShieldCheckIcon,
  SpinnerIcon,
} from "./icons";

const inputClass =
  "block h-10 w-full rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/80 pl-10 pr-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow] duration-fast placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus";

const outlineBtnClass =
  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/40 text-[13px] font-semibold text-text-primary transition-[border-color,background-color] duration-fast hover:border-brand-primary/35 hover:bg-surface-elevated focus-visible:outline-none focus-visible:shadow-focus";

/**
 * Secrela forgot-password card — email link flow (same API as before).
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPasswordRequest(email.trim());
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to send the reset link right now",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col" noValidate>
      <AuthFlowSteps steps={FORGOT_FLOW_STEPS} current={sent ? 1 : 0} />

      <div className="mt-5 flex items-start justify-between gap-3">
        <h2 className="text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.625rem]">
          {sent ? (
            <>
              Check your <span className="text-brand-primary">inbox</span>
            </>
          ) : (
            <>
              Forgot your <span className="text-brand-primary">password?</span>
            </>
          )}
        </h2>
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-primary/40 text-brand-primary"
          aria-hidden="true"
        >
          {sent ? (
            <MailIcon className="h-4 w-4" />
          ) : (
            <LockQuestionIcon className="h-4 w-4" />
          )}
        </span>
      </div>

      {sent ? (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
            If an account exists for{" "}
            <span className="font-medium text-text-primary">{email.trim()}</span>
            , we sent a secure reset link. Open it to continue to the new
            password form.
          </p>
          <div className="mt-4 flex items-start gap-2.5 rounded-md border border-border-subtle bg-background-secondary/60 px-3 py-2.5 text-[12px] leading-snug text-text-secondary">
            <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
            <p>
              The link expires in 15 minutes. After you set a new password,
              you&apos;ll return to sign in.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
            Enter your work email and we&apos;ll send a secure link to reset
            your password.
          </p>

          <div className="mt-5">
            <Field label="Work email">
              <MailIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-md border border-border-subtle bg-background-secondary/60 px-3 py-2.5 text-[12px] leading-snug text-text-secondary">
            <ShieldCheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-primary" />
            <p>
              We use an email link (not a code). The next step is checking your
              inbox.
            </p>
          </div>

          {error ? (
            <p className="mt-3 text-[12px] text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="relative mt-5 flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-[14px] font-bold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow,transform] duration-fast hover:bg-brand-primary-hover hover:shadow-glow-green-strong hover:-translate-y-px focus-visible:outline-none focus-visible:shadow-focus active:translate-y-0 disabled:cursor-wait motion-reduce:hover:translate-y-0"
          >
            <span>Send reset link</span>
            <span className="absolute right-3.5">
              {loading ? (
                <SpinnerIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightIcon className="h-4 w-4" />
              )}
            </span>
          </button>
        </>
      )}

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="shrink-0 text-[11px] text-text-muted">OR</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>

      <Link href="/login" className={`${outlineBtnClass} mt-3`}>
        <LockIcon className="h-3.5 w-3.5" />
        Back to sign in
      </Link>

      <p className="mt-5 flex items-start justify-center gap-2 text-center text-[11px] leading-snug text-text-muted">
        <ShieldCheckIcon className="mt-0.5 h-3 w-3 shrink-0 text-brand-primary" />
        <span>
          Security first: Our reset links expire after 15 minutes and can only
          be used once.
        </span>
      </p>
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
