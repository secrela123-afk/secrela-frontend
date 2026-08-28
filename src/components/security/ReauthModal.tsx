"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  ApiError,
  reauthenticateRequest,
  type ReauthLevel,
} from "../../lib/api";
import {
  apiErrorMessage,
  validateAuthenticatorOrRecoveryCode,
} from "../../lib/otp-form";

type ReauthModalProps = {
  open: boolean;
  level: ReauthLevel;
  mfaRequired: boolean;
  accountEmail?: string;
  onClose: () => void;
  onSuccess: () => void;
};

/**
 * Generic step-up UI when an API returns REAUTH_REQUIRED.
 * MFA enable/disable use CredentialConfirmModal instead (always shown).
 */
export function ReauthModal({
  open,
  level,
  mfaRequired,
  accountEmail,
  onClose,
  onSuccess,
}: ReauthModalProps) {
  const titleId = useId();
  const [email, setEmail] = useState(accountEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setCode("");
      setError(null);
      setLoading(false);
      return;
    }
    if (accountEmail) setEmail(accountEmail);
  }, [open, accountEmail]);

  if (!open) return null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (
      accountEmail &&
      email.trim().toLowerCase() !== accountEmail.trim().toLowerCase()
    ) {
      setError("Email does not match the signed-in account.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (mfaRequired) {
      const validationError = validateAuthenticatorOrRecoveryCode(code);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      await reauthenticateRequest({
        password,
        code: mfaRequired ? code.trim() : undefined,
        level,
      });
      onSuccess();
    } catch (err) {
      setError(apiErrorMessage(err, "Re-authentication failed"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 h-11 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:shadow-focus";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card"
      >
        <h2
          id={titleId}
          className="text-[20px] font-semibold tracking-tight text-text-primary"
        >
          {level === "high"
            ? "Additional verification required"
            : "Confirm your password"}
        </h2>
        <p className="mt-2 text-body text-text-secondary">
          {level === "high"
            ? mfaRequired
              ? "This action requires your password and authenticator (or recovery) code."
              : "This high-risk action requires your password. Enabling 2FA is strongly recommended."
            : "For your security, confirm your password to continue."}
        </p>

        {accountEmail ? (
          <label className="mt-5 block text-[13px] font-medium text-text-primary">
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>
        ) : null}

        <label
          className={`${accountEmail ? "mt-3" : "mt-5"} block text-[13px] font-medium text-text-primary`}
        >
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>

        <p className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-small font-medium text-brand-primary hover:text-brand-primary-hover"
          >
            Forgot password?
          </Link>
        </p>

        {mfaRequired ? (
          <label className="mt-3 block text-[13px] font-medium text-text-primary">
            Authenticator or recovery code
            <input
              type="text"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456 or xxxx-xxxx"
              className={inputClass}
            />
          </label>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover disabled:cursor-wait"
          >
            {loading ? "Verifying…" : "Confirm"}
          </button>
        </div>

        {error ? (
          <p className="mt-3 text-right text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

type Pending<T> = {
  action: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

/**
 * Run an API action; if backend returns REAUTH_REQUIRED, open the modal and retry once.
 */
export function useStepUpGate(accountEmail?: string) {
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<ReauthLevel>("medium");
  const [mfaRequired, setMfaRequired] = useState(false);
  const pendingRef = useRef<Pending<unknown> | null>(null);

  async function runWithStepUp<T>(action: () => Promise<T>): Promise<T> {
    try {
      return await action();
    } catch (err) {
      if (!(err instanceof ApiError) || err.code !== "REAUTH_REQUIRED") {
        throw err;
      }

      const nextLevel = err.details?.level ?? "medium";
      const nextMfa = Boolean(err.details?.mfaRequired);

      return await new Promise<T>((resolve, reject) => {
        pendingRef.current = {
          action: action as () => Promise<unknown>,
          resolve: resolve as (value: unknown) => void,
          reject,
        };
        setLevel(nextLevel);
        setMfaRequired(nextMfa);
        setOpen(true);
      });
    }
  }

  function close() {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    pending?.reject(
      new ApiError(403, "REAUTH_REQUIRED", "Re-authentication cancelled"),
    );
  }

  async function onSuccess() {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    if (!pending) return;
    try {
      pending.resolve(await pending.action());
    } catch (err) {
      pending.reject(err);
    }
  }

  const modal = (
    <ReauthModal
      open={open}
      level={level}
      mfaRequired={mfaRequired}
      accountEmail={accountEmail}
      onClose={close}
      onSuccess={() => {
        void onSuccess();
      }}
    />
  );

  return { runWithStepUp, modal };
}
