import { ApiError } from "./api";

/** 30 minutes — must match backend OTP_RESEND_COOLDOWN_MS */
export const OTP_RESEND_COOLDOWN_MS = 30 * 60 * 1000;

export function normalizeOtpDigits(code: string): string {
  return code.replace(/\s/g, "");
}

export function validateSixDigitOtp(code: string): string | null {
  const normalized = normalizeOtpDigits(code);
  if (!normalized) return "Enter the 6-digit code";
  if (!/^\d{6}$/.test(normalized)) return "Enter a valid 6-digit code";
  return null;
}

export function validateAuthenticatorOrRecoveryCode(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) return "Enter your authentication code";
  if (/^\d{6}$/.test(normalizeOtpDigits(trimmed))) return null;
  if (/^[a-z0-9]{4}-[a-z0-9]{4}$/i.test(trimmed)) return null;
  return "Enter a 6-digit authenticator code or recovery code (xxxx-xxxx)";
}

export function formatOtpDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return remMinutes > 0 ? `${hours}h ${remMinutes}m` : `${hours}h`;
  }
  if (minutes > 0 && seconds > 0) return `${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes} min`;
  return `${seconds}s`;
}

export function otpRetryMessage(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds) {
    return "Too many incorrect codes. Try again later.";
  }
  return `Too many incorrect codes. Try again in ${formatOtpDuration(retryAfterSeconds * 1000)}.`;
}

export function otpResendMessage(retryAfterSeconds?: number): string {
  if (!retryAfterSeconds) {
    return "You can resend a code later.";
  }
  return `You can resend a code in ${formatOtpDuration(retryAfterSeconds * 1000)}.`;
}

/** Map OTP-related API errors to user-facing copy. */
export function messageFromOtpApiError(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  if (err.code === "OTP_LOCKED") {
    return otpRetryMessage(err.details?.retryAfterSeconds);
  }
  if (err.code === "OTP_RESEND_COOLDOWN") {
    return otpResendMessage(err.details?.retryAfterSeconds);
  }
  return null;
}

export function apiErrorMessage(
  err: unknown,
  fallback: string,
): string {
  return messageFromOtpApiError(err) ?? (err instanceof ApiError ? err.message : fallback);
}
