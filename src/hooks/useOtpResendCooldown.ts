"use client";

import { useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { OTP_RESEND_COOLDOWN_MS, formatOtpDuration } from "../lib/otp-form";

type UseOtpResendCooldownOptions = {
  cooldownMs?: number;
};

/**
 * Tracks when the user may request another OTP send.
 * Syncs from API success (`markSent`) and OTP_RESEND_COOLDOWN errors.
 */
export function useOtpResendCooldown(
  options: UseOtpResendCooldownOptions = {},
) {
  const cooldownMs = options.cooldownMs ?? OTP_RESEND_COOLDOWN_MS;
  const [availableAt, setAvailableAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!availableAt || availableAt <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [availableAt]);

  const remainingMs =
    availableAt === null ? 0 : Math.max(0, availableAt - now);
  const canResend = remainingMs === 0;

  function markSent(seconds?: number) {
    const waitMs = seconds ? seconds * 1000 : cooldownMs;
    setAvailableAt(Date.now() + waitMs);
  }

  function applyApiError(err: unknown) {
    if (!(err instanceof ApiError) || err.code !== "OTP_RESEND_COOLDOWN") {
      return false;
    }
    const seconds = err.details?.retryAfterSeconds;
    if (seconds) {
      setAvailableAt(Date.now() + seconds * 1000);
    } else {
      setAvailableAt(Date.now() + cooldownMs);
    }
    return true;
  }

  function reset() {
    setAvailableAt(null);
    setNow(Date.now());
  }

  return {
    canResend,
    remainingMs,
    remainingLabel: formatOtpDuration(remainingMs),
    markSent,
    applyApiError,
    reset,
  };
}
