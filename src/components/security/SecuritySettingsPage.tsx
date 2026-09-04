"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ApiError,
  disableMfaRequest,
  forgotPasswordRequest,
  logoutAllSessionsRequest,
  regenerateRecoveryCodesRequest,
} from "../../lib/api";
import { apiErrorMessage, validateSixDigitOtp } from "../../lib/otp-form";
import { queryKeys } from "../../lib/query-keys";
import { toast } from "../../stores/toast-store";
import { useMfaStatusQuery } from "../../hooks/queries/useMfaStatusQuery";
import { useAppUser } from "../../hooks/workspace/useWorkspace";
import {
  SettingsCard,
  SettingsPage,
  settingsPrimaryBtn,
  settingsSecondaryBtn,
} from "../app/ui";
import { ConfirmDialog } from "../app/RowActionsMenu";
import { IconCopy, IconWarning } from "../app/icons";
import { CredentialConfirmModal } from "./CredentialConfirmModal";
import { EnableMfaWizard } from "./EnableMfaWizard";
import { useStepUpGate } from "./ReauthModal";

type Phase = "idle" | "recovery" | "regenerate";

const LOW_RECOVERY_CODES = 2;

const inputClass =
  "mt-1.5 h-11 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-sm text-text-primary outline-none focus:border-brand-primary focus:shadow-focus";

/**
 * Account security — same card layout as the approved settings look:
 * page title, then stacked cards with copy on the left and the action on the right.
 */
export function SecuritySettingsPage() {
  const { user } = useAppUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    data: mfaStatus,
    isPending: loading,
    error: mfaError,
    refetch,
  } = useMfaStatusQuery();
  const { runWithStepUp, modal: stepUpModal } = useStepUpGate(user.email);

  const enabled = mfaStatus?.enabled ?? false;
  const recoveryRemaining = mfaStatus?.recoveryCodesRemaining ?? 0;

  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [enableOpen, setEnableOpen] = useState(false);
  const [disableGateOpen, setDisableGateOpen] = useState(false);
  const [confirmSignOutAll, setConfirmSignOutAll] = useState(false);
  const [confirmResetPassword, setConfirmResetPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const mfaLoadError =
    mfaError instanceof ApiError
      ? mfaError.message
      : mfaError
        ? "Unable to load MFA status"
        : null;

  async function refreshSecurity() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.mfaStatus }),
      queryClient.invalidateQueries({ queryKey: queryKeys.workspace }),
    ]);
  }

  async function afterDisableConfirmed(totpCode: string) {
    setDisableGateOpen(false);
    try {
      await disableMfaRequest(totpCode);
      setPhase("idle");
      setCode("");
      toast.success("Two-factor authentication disabled");
      await refreshSecurity();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Unable to disable MFA"));
    }
  }

  async function confirmRegenerate(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    const validationError = validateSixDigitOtp(code);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    try {
      const result = await runWithStepUp(() =>
        regenerateRecoveryCodesRequest(code.trim()),
      );
      setRecoveryCodes(result.recoveryCodes);
      setPhase("recovery");
      setCode("");
      toast.success("New recovery codes generated", "Save them now — they are shown once.");
      await refreshSecurity();
    } catch (err) {
      setFormError(apiErrorMessage(err, "Unable to regenerate recovery codes"));
    }
  }

  async function copyRecoveryCodes() {
    if (!recoveryCodes?.length) return;
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success("Recovery codes copied");
    } catch {
      toast.error("Could not copy. Select the codes and copy them manually.");
    }
  }

  function downloadRecoveryCodes() {
    if (!recoveryCodes?.length) return;
    const blob = new Blob(
      [
        `Secrela recovery codes for ${user.email}\n`,
        "Store these offline. Each code works once.\n\n",
        recoveryCodes.join("\n"),
        "\n",
      ],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secrela-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function signOutAllSessions() {
    setConfirmSignOutAll(false);
    try {
      await runWithStepUp(() => logoutAllSessionsRequest());
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not sign out other sessions"));
    }
  }

  async function sendPasswordReset() {
    setBusy(true);
    try {
      await forgotPasswordRequest(user.email);
      toast.success(
        "Reset link sent",
        `Check ${user.email}. Other sessions end after you set a new password.`,
      );
      setConfirmResetPassword(false);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not send a reset link"));
    } finally {
      setBusy(false);
    }
  }

  const showingCodes = phase === "recovery" && Boolean(recoveryCodes?.length);
  const lowRecovery = enabled && recoveryRemaining <= LOW_RECOVERY_CODES;

  return (
    <>
      {stepUpModal}
      <EnableMfaWizard
        open={enableOpen}
        accountEmail={user.email}
        onClose={() => setEnableOpen(false)}
        onEnabled={(codes) => {
          setEnableOpen(false);
          setRecoveryCodes(codes);
          setPhase("recovery");
          void refreshSecurity();
        }}
      />
      <CredentialConfirmModal
        open={disableGateOpen}
        mode="disable-2fa"
        accountEmail={user.email}
        requireTotp
        onClose={() => setDisableGateOpen(false)}
        onConfirmed={async ({ totpCode }) => {
          if (totpCode) await afterDisableConfirmed(totpCode);
        }}
      />

      <SettingsPage
        title="Security"
        description="Protect your account with two-factor authentication and recovery codes."
      >
        {loading ? (
          <div
            className="h-40 animate-pulse rounded-lg border border-border-subtle bg-surface-card"
            aria-busy="true"
            aria-label="Loading security settings"
          />
        ) : mfaLoadError ? (
          <SettingsCard title="Two-factor authentication">
            <p className="mt-4 text-small text-danger" role="alert">
              {mfaLoadError}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className={`${settingsPrimaryBtn} mt-4`}
            >
              Try again
            </button>
          </SettingsCard>
        ) : (
          <>
            <SettingsCard
              title="Two-factor authentication"
              description="Use an authenticator app to generate codes at sign-in and for high-risk actions."
              status={
                <p>
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
                      · {recoveryRemaining} recovery code
                      {recoveryRemaining === 1 ? "" : "s"} remaining
                      {lowRecovery ? " — generate a new set soon" : ""}
                    </span>
                  ) : null}
                </p>
              }
              action={
                !enabled && phase === "idle" ? (
                  <button
                    type="button"
                    onClick={() => setEnableOpen(true)}
                    className={settingsPrimaryBtn}
                  >
                    Enable 2FA
                  </button>
                ) : null
              }
            >
              {showingCodes && recoveryCodes ? (
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryCodes(null);
                        setPhase("idle");
                      }}
                      className={settingsPrimaryBtn}
                    >
                      I have saved these codes
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyRecoveryCodes()}
                      className={settingsSecondaryBtn}
                    >
                      <IconCopy className="mr-1.5 h-3.5 w-3.5" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={downloadRecoveryCodes}
                      className={settingsSecondaryBtn}
                    >
                      Download .txt
                    </button>
                  </div>
                </div>
              ) : null}

              {enabled && phase === "idle" && !showingCodes ? (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-border-subtle pt-5">
                  <button
                    type="button"
                    onClick={() => {
                      setPhase("regenerate");
                      setCode("");
                      setFormError(null);
                    }}
                    className={
                      lowRecovery ? settingsPrimaryBtn : settingsSecondaryBtn
                    }
                  >
                    Regenerate recovery codes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDisableGateOpen(true)
                    }
                    className="inline-flex h-10 shrink-0 items-center rounded-sm border border-danger/40 px-4 text-sm font-semibold text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : null}

              {phase === "regenerate" ? (
                <form
                  onSubmit={confirmRegenerate}
                  noValidate
                  className="mt-6 border-t border-border-subtle pt-5"
                >
                  <p className="flex items-start gap-2 text-small text-text-secondary">
                    <IconWarning className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    Enter a live authenticator code. Old recovery codes stop
                    working immediately.
                  </p>
                  <label className="mt-4 block text-[13px] font-medium text-text-primary">
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
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button type="submit" className={settingsPrimaryBtn}>
                      Generate new codes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhase("idle");
                        setCode("");
                        setFormError(null);
                      }}
                      className={settingsSecondaryBtn}
                    >
                      Cancel
                    </button>
                  </div>
                  {formError ? (
                    <p className="mt-3 text-small text-danger" role="alert">
                      {formError}
                    </p>
                  ) : null}
                </form>
              ) : null}
            </SettingsCard>

            <SettingsCard
              title="Password"
              description="We never show your password. A reset link to your email is how you change it while signed in."
              action={
                <button
                  type="button"
                  onClick={() => setConfirmResetPassword(true)}
                  className={settingsSecondaryBtn}
                >
                  Email a reset link
                </button>
              }
            />

            <SettingsCard
              title="Sessions"
              description="Sign out every device, including this browser. Use this if a laptop is lost or a session looks unfamiliar."
              action={
                <button
                  type="button"
                  onClick={() => setConfirmSignOutAll(true)}
                  className="inline-flex h-10 shrink-0 items-center rounded-sm border border-danger/40 px-4 text-sm font-semibold text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:shadow-focus"
                >
                  Sign out all sessions
                </button>
              }
            />
          </>
        )}
      </SettingsPage>

      <ConfirmDialog
        open={confirmSignOutAll}
        title="Sign out every device?"
        description="This ends every active session, including this browser. You will need to sign in again."
        confirmLabel="Sign out all sessions"
        danger
        onConfirm={() => void signOutAllSessions()}
        onClose={() => setConfirmSignOutAll(false)}
      />

      <ConfirmDialog
        open={confirmResetPassword}
        title="Send a password reset link?"
        description={`We will email ${user.email}. After you set a new password, other sessions are signed out.`}
        confirmLabel="Send reset link"
        loading={busy}
        onConfirm={() => void sendPasswordReset()}
        onClose={() => {
          if (!busy) setConfirmResetPassword(false);
        }}
      />
    </>
  );
}
