"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useId, useState } from "react";
import { useOtpResendCooldown } from "../../hooks/useOtpResendCooldown";
import {
  enableMfaRequest,
  startMfaEnableRequest,
  startMfaSetupRequest,
  verifyMfaEnableEmailRequest,
} from "../../lib/api";
import {
  apiErrorMessage,
  validateAuthenticatorOrRecoveryCode,
  validateSixDigitOtp,
} from "../../lib/otp-form";
import { AuthFlowSteps } from "../auth/AuthFlowSteps";

const ENABLE_STEPS = ["Account", "Email code", "Authenticator"] as const;

type EnableMfaWizardProps = {
  open: boolean;
  accountEmail: string;
  onClose: () => void;
  onEnabled: (recoveryCodes: string[]) => void;
};

/**
 * Enable 2FA wizard with progress:
 * 1) email + password → send email OTP
 * 2) enter email code
 * 3) scan QR + enter authenticator TOTP → enabled
 */
export function EnableMfaWizard({
  open,
  accountEmail,
  onClose,
  onEnabled,
}: EnableMfaWizardProps) {
  const titleId = useId();
  const resendCooldown = useOtpResendCooldown();
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState(accountEmail);
  const [password, setPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [otpauthUri, setOtpauthUri] = useState<string | null>(null);
  const [manualSecret, setManualSecret] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setEmail(accountEmail);
      setPassword("");
      setEmailCode("");
      setTotpCode("");
      setOtpauthUri(null);
      setManualSecret(null);
      setSentTo(null);
      setError(null);
      setLoading(false);
      resendCooldown.reset();
      return;
    }
    setEmail(accountEmail);
  }, [open, accountEmail]);

  if (!open) return null;

  const inputClass =
    "mt-1.5 h-11 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:shadow-focus";

  async function submitAccount(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setLoading(true);
    try {
      const result = await startMfaEnableRequest({
        email: email.trim(),
        password,
      });
      setSentTo(result.sentTo);
      resendCooldown.markSent(result.resendAvailableInSeconds);
      setEmailCode("");
      setStep(1);
    } catch (err) {
      resendCooldown.applyApiError(err);
      setError(apiErrorMessage(err, "Unable to send email code"));
    } finally {
      setLoading(false);
    }
  }

  async function submitEmailCode(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validateSixDigitOtp(emailCode);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await verifyMfaEnableEmailRequest(emailCode.trim());
      const setup = await startMfaSetupRequest();
      setOtpauthUri(setup.otpauthUri);
      setManualSecret(setup.secret);
      setTotpCode("");
      setStep(2);
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to verify email code"));
    } finally {
      setLoading(false);
    }
  }

  async function submitAuthenticator(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validateSixDigitOtp(totpCode);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await enableMfaRequest(totpCode.trim());
      onEnabled(result.recoveryCodes);
    } catch (err) {
      setError(apiErrorMessage(err, "Invalid authenticator code"));
    } finally {
      setLoading(false);
    }
  }

  async function resendEmailCode() {
    if (!resendCooldown.canResend) return;

    setError(null);
    setLoading(true);
    try {
      const result = await startMfaEnableRequest({
        email: email.trim(),
        password,
      });
      setSentTo(result.sentTo);
      resendCooldown.markSent(result.resendAvailableInSeconds);
      setEmailCode("");
    } catch (err) {
      resendCooldown.applyApiError(err);
      setError(apiErrorMessage(err, "Unable to resend email code"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="w-full max-w-md rounded-lg border border-border-subtle bg-surface-card p-6 shadow-card">
        <h2
          id={titleId}
          className="text-[20px] font-semibold tracking-tight text-text-primary"
        >
          Enable two-factor authentication
        </h2>
        <div className="mt-4">
          <AuthFlowSteps steps={ENABLE_STEPS} current={step} />
        </div>

        {step === 0 ? (
          <form onSubmit={submitAccount} noValidate className="mt-5">
            <label className="block text-[13px] font-medium text-text-primary">
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
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary disabled:cursor-wait"
              >
                {loading ? "Sending…" : "Continue"}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-right text-small text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}

        {step === 1 ? (
          <form onSubmit={submitEmailCode} noValidate className="mt-5">
            <p className="text-small text-text-secondary">
              We sent a 6-digit code
              {sentTo ? (
                <>
                  {" "}
                  to <span className="text-text-primary">{sentTo}</span>
                </>
              ) : null}
              .
            </p>
            <label className="mt-4 block text-[13px] font-medium text-text-primary">
              Email code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="123456"
                className={inputClass}
              />
            </label>
            <button
              type="button"
              onClick={() => void resendEmailCode()}
              disabled={loading || !resendCooldown.canResend}
              className="mt-2 text-small font-medium text-brand-primary hover:text-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resendCooldown.canResend
                ? "Resend code"
                : `Resend in ${resendCooldown.remainingLabel}`}
            </button>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setError(null);
                }}
                className="h-10 rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary disabled:cursor-wait"
              >
                {loading ? "Verifying…" : "Continue"}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-right text-small text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}

        {step === 2 && otpauthUri ? (
          <form onSubmit={submitAuthenticator} noValidate className="mt-5">
            <p className="text-small text-text-secondary">
              Scan the QR with your authenticator app, then enter the 6-digit
              code.
            </p>
            <div className="mt-4 inline-flex rounded-md border border-border-subtle bg-white p-3">
              <QRCodeSVG value={otpauthUri} size={160} level="M" />
            </div>
            {manualSecret ? (
              <p className="mt-3 break-all text-small text-text-muted">
                Manual key:{" "}
                <span className="font-mono text-text-primary">
                  {manualSecret}
                </span>
              </p>
            ) : null}
            <label className="mt-4 block text-[13px] font-medium text-text-primary">
              Authenticator code
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="123456"
                className={inputClass}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary disabled:cursor-wait"
              >
                {loading ? "Enabling…" : "Enable 2FA"}
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-right text-small text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        ) : null}
      </div>
    </div>
  );
}
