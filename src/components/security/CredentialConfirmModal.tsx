"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import {
  ApiError,
  reauthenticateRequest,
  type ReauthLevel,
} from "../../lib/api";
import {
  apiErrorMessage,
  validateAuthenticatorOrRecoveryCode,
} from "../../lib/otp-form";

export type CredentialModalMode = "enable-2fa" | "disable-2fa" | "step-up";

type CredentialConfirmModalProps = {
  open: boolean;
  mode: CredentialModalMode;
  /** Logged-in account email — must be confirmed in the form */
  accountEmail: string;
  /** When true, also collect TOTP/recovery (HIGH / disable) */
  requireTotp: boolean;
  onClose: () => void;
  /**
   * Called after successful reauthenticate.
   * For disable, `totpCode` is the code the user entered (reuse for disable API).
   */
  onConfirmed: (payload: { password: string; totpCode?: string }) => void | Promise<void>;
};

/**
 * Always-visible credential gate for MFA enable/disable and generic step-up.
 * Shows account email + password (+ TOTP when required) and a forgot-password link.
 */
export function CredentialConfirmModal({
  open,
  mode,
  accountEmail,
  requireTotp,
  onClose,
  onConfirmed,
}: CredentialConfirmModalProps) {
  const titleId = useId();
  const [email, setEmail] = useState(accountEmail);
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
    setEmail(accountEmail);
  }, [open, accountEmail]);

  if (!open) return null;

  const title =
    mode === "enable-2fa"
      ? "Confirm your account to enable 2FA"
      : mode === "disable-2fa"
        ? "Confirm your account to disable 2FA"
        : requireTotp
          ? "Additional verification required"
          : "Confirm your password";

  const subtitle =
    mode === "enable-2fa"
      ? "For your security, enter your SecureVault email and password before setting up an authenticator."
      : mode === "disable-2fa"
        ? "Disabling 2FA is a high-risk action. Enter your email, password, and a current authenticator code."
        : requireTotp
          ? "This action requires your password and authenticator (or recovery) code."
          : "For your security, confirm your password to continue.";

  const level: ReauthLevel = requireTotp ? "high" : "medium";

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (email.trim().toLowerCase() !== accountEmail.trim().toLowerCase()) {
      setError("Email does not match the signed-in account.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (requireTotp) {
      const validationError = validateAuthenticatorOrRecoveryCode(code);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setLoading(true);
    try {
      const totpCode = requireTotp ? code.trim() : undefined;
      await reauthenticateRequest({
        password,
        code: totpCode,
        level,
      });
      await onConfirmed({ password, totpCode });
    } catch (err) {
      setError(
        apiErrorMessage(err, "Verification failed. Check your credentials."),
      );
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
          {title}
        </h2>
        <p className="mt-2 text-body text-text-secondary">{subtitle}</p>

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

        <label className="mt-3 block text-[13px] font-medium text-text-primary">
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

        {requireTotp ? (
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
            className={
              mode === "disable-2fa"
                ? "h-10 rounded-sm bg-danger px-4 text-sm font-semibold text-white disabled:cursor-wait"
                : "h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover disabled:cursor-wait"
            }
          >
            {loading
              ? "Verifying…"
              : mode === "disable-2fa"
                ? "Disable 2FA"
                : mode === "enable-2fa"
                  ? "Continue to setup"
                  : "Confirm"}
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
