"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ApiError,
  disableMfaRequest,
  regenerateRecoveryCodesRequest,
} from "../../lib/api";
import { apiErrorMessage, validateSixDigitOtp } from "../../lib/otp-form";
import { queryKeys } from "../../lib/query-keys";
import { useMfaStatusQuery } from "../../hooks/queries/useMfaStatusQuery";
import { useAppUser } from "../../hooks/workspace/useWorkspace";
import { PageHeader } from "../app/ui";
import {
  CredentialConfirmModal,
  type CredentialModalMode,
} from "./CredentialConfirmModal";
import { EnableMfaWizard } from "./EnableMfaWizard";
import { useStepUpGate } from "./ReauthModal";

type Phase = "idle" | "recovery" | "regenerate";

/**
 * Account security — MFA status via TanStack Query.
 */
export function SecuritySettingsPage() {
  const { user } = useAppUser();
  const queryClient = useQueryClient();
  const {
    data: mfaStatus,
    isPending: loading,
    error: mfaError,
  } = useMfaStatusQuery();
  const { runWithStepUp, modal: stepUpModal } = useStepUpGate(user.email);

  const enabled = mfaStatus?.enabled ?? false;
  const recoveryRemaining = mfaStatus?.recoveryCodesRemaining ?? 0;

  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableGate, setDisableGate] = useState<{
    open: boolean;
    mode: CredentialModalMode;
  }>({ open: false, mode: "disable-2fa" });

  const mfaLoadError =
    mfaError instanceof ApiError
      ? mfaError.message
      : mfaError
        ? "Unable to load MFA status"
        : null;

  async function refreshMfaStatus() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.mfaStatus });
  }

  async function afterDisableConfirmed(totpCode: string) {
    setDisableGate((g) => ({ ...g, open: false }));
    try {
      await disableMfaRequest(totpCode);
      setPhase("idle");
      setCode("");
      setMessage("Two-factor authentication has been disabled.");
      await refreshMfaStatus();
    } catch (err) {
      setError(apiErrorMessage(err, "Unable to disable MFA"));
    }
  }

  async function confirmRegenerate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const validationError = validateSixDigitOtp(code);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const result = await runWithStepUp(() =>
        regenerateRecoveryCodesRequest(code.trim()),
      );
      setRecoveryCodes(result.recoveryCodes);
      setPhase("recovery");
      setCode("");
      await refreshMfaStatus();
    } catch (err) {
      setError(
        apiErrorMessage(err, "Unable to regenerate recovery codes"),
      );
    }
  }

  const inputClass =
    "mt-1.5 h-11 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:shadow-focus";

  return (
    <div className="p-4 lg:p-6">
      {stepUpModal}
      <EnableMfaWizard
        open={enableOpen}
        accountEmail={user.email}
        onClose={() => setEnableOpen(false)}
        onEnabled={(codes) => {
          setEnableOpen(false);
          setRecoveryCodes(codes);
          setPhase("recovery");
          setMessage(null);
          void refreshMfaStatus();
        }}
      />
      <CredentialConfirmModal
        open={disableGate.open}
        mode="disable-2fa"
        accountEmail={user.email}
        requireTotp
        onClose={() => setDisableGate((g) => ({ ...g, open: false }))}
        onConfirmed={async ({ totpCode }) => {
          if (totpCode) await afterDisableConfirmed(totpCode);
        }}
      />

      <PageHeader
        title="Security"
        description="Protect your account with two-factor authentication and recovery codes."
      />

      {loading ? (
        <p className="text-body text-text-secondary">Loading security settings…</p>
      ) : mfaLoadError ? (
        <p className="text-body text-danger" role="alert">
          {mfaLoadError}
        </p>
      ) : (
        <div className="grid max-w-2xl gap-4">
          <section className="rounded-lg border border-border-subtle bg-surface-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[16px] font-semibold text-text-primary">
                  Two-factor authentication
                </h2>
                <p className="mt-1 text-small text-text-secondary">
                  Use an authenticator app to generate codes at sign-in and for
                  high-risk actions.
                </p>
                <p className="mt-3 text-small text-text-primary">
                  Status:{" "}
                  <span
                    className={
                      enabled
                        ? "font-semibold text-brand-primary"
                        : "font-semibold text-warning"
                    }
                  >
                    {enabled ? "Enabled" : "Disabled"}
                  </span>
                  {enabled ? (
                    <span className="text-text-muted">
                      {" "}
                      · {recoveryRemaining} recovery codes remaining
                    </span>
                  ) : null}
                </p>
              </div>

              {!enabled && phase === "idle" ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    setEnableOpen(true);
                  }}
                  className="h-10 shrink-0 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover"
                >
                  Enable 2FA
                </button>
              ) : null}
            </div>

            {error ? (
              <p className="mt-4 text-small text-danger" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="mt-4 text-small text-brand-primary">{message}</p>
            ) : null}

            {phase === "recovery" && recoveryCodes ? (
              <div className="mt-6 border-t border-border-subtle pt-5">
                <h3 className="text-[14px] font-semibold text-text-primary">
                  Save your recovery codes
                </h3>
                <p className="mt-1 text-small text-warning">
                  These codes are shown only once. Store them securely.
                </p>
                <ul className="mt-4 grid gap-2 rounded-md border border-border-subtle bg-background-secondary p-4 font-mono text-sm text-text-primary sm:grid-cols-2">
                  {recoveryCodes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryCodes(null);
                    setPhase("idle");
                  }}
                  className="mt-4 h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary hover:bg-brand-primary-hover"
                >
                  I have saved these codes
                </button>
              </div>
            ) : null}

            {enabled && phase === "idle" ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-border-subtle pt-5">
                <button
                  type="button"
                  onClick={() => {
                    setPhase("regenerate");
                    setCode("");
                    setError(null);
                  }}
                  className="h-10 rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary"
                >
                  Regenerate recovery codes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    setDisableGate({ open: true, mode: "disable-2fa" });
                  }}
                  className="h-10 rounded-sm border border-danger/40 px-4 text-sm font-semibold text-danger hover:bg-danger/10"
                >
                  Disable 2FA
                </button>
              </div>
            ) : null}

            {phase === "regenerate" ? (
              <form
                onSubmit={confirmRegenerate}
                noValidate
                className="mt-5 border-t border-border-subtle pt-5"
              >
                <p className="text-small text-text-secondary">
                  Enter a live authenticator code. Old recovery codes will stop
                  working immediately.
                </p>
                <label className="mt-3 block text-[13px] font-medium text-text-primary">
                  Authenticator code
                  <input
                    className={inputClass}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                  />
                </label>
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="h-10 rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary"
                  >
                    Generate new codes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("idle")}
                    className="h-10 rounded-sm border border-border-default px-4 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
                {error ? (
                  <p className="mt-3 text-small text-danger" role="alert">
                    {error}
                  </p>
                ) : null}
              </form>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
