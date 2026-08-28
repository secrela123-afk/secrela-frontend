"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiError, resetPasswordRequest } from "../../lib/api";
import { APP_NAME } from "../../lib/brand";
import {
  authEnter,
  authFieldIcon,
  authForm,
  authInputPassword,
  authPrimaryBtn,
} from "./auth-classes";
import { AuthFlowSteps, FORGOT_FLOW_STEPS } from "./AuthFlowSteps";
import { AuthPrimaryButton } from "./AuthPrimaryButton";
import {
  ArrowRightIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
} from "./icons";

const RULES = [
  { id: "length", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "upper", label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", label: "One number", test: (v: string) => /\d/.test(v) },
  {
    id: "special",
    label: "One special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is invalid. Request a new one.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    if (!RULES.every((rule) => rule.test(password))) {
      setError("Password does not meet the requirements");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to reset your password right now",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={`${authEnter} mx-auto flex w-full max-w-[420px] flex-col`}>
        <h1 className="text-[32px] leading-[1.15] font-bold tracking-tight text-text-primary">
          Invalid <span className="text-brand-primary">link</span>
        </h1>
        <p className="mt-2 text-body text-text-secondary">
          This password reset link is missing or malformed.
        </p>
        <Link href="/forgot-password" className={`${authPrimaryBtn} mt-6 inline-flex`}>
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={`${authEnter} mx-auto flex w-full max-w-[420px] flex-col`}>
        <AuthFlowSteps steps={FORGOT_FLOW_STEPS} current={3} />
        <h1 className="mt-5 text-[32px] leading-[1.15] font-bold tracking-tight text-text-primary">
          Password <span className="text-brand-primary">updated</span>
        </h1>
        <p className="mt-2 text-body text-text-secondary">
          Your password has been changed. All other sessions were signed out for
          security. Sign in with your new password.
        </p>
        <button
          type="button"
          className={`${authPrimaryBtn} mt-6`}
          onClick={() => router.push("/login")}
        >
          <span>Sign in</span>
          <span className="absolute right-[1.15rem]">
            <ArrowRightIcon className="h-5 w-5" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={authForm}>
      <div>
        <AuthFlowSteps steps={FORGOT_FLOW_STEPS} current={2} />
        <h1 className="mt-5 text-[32px] leading-[1.15] font-bold tracking-tight text-text-primary xl:text-[36px]">
          Set a new <span className="text-brand-primary">password</span>
        </h1>
        <p className="mt-2 text-body text-text-secondary">
          Choose a strong password for your {APP_NAME} account.
        </p>

        <Field label="New password">
          <LockIcon className={authFieldIcon} />
          <input
            className={authInputPassword}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
          />
          <EyeToggle
            shown={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          />
        </Field>

        <Field label="Confirm password">
          <LockIcon className={authFieldIcon} />
          <input
            className={authInputPassword}
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••••••"
          />
          <EyeToggle
            shown={showConfirm}
            onClick={() => setShowConfirm((v) => !v)}
          />
        </Field>

        <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-2 text-[12px] ${
                  ok ? "text-brand-primary" : "text-text-muted"
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5 shrink-0" />
                {rule.label}
              </li>
            );
          })}
        </ul>

        {error ? (
          <p className="mt-3 text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <AuthPrimaryButton loading={loading} className="mt-4">
          Update password
        </AuthPrimaryButton>
      </div>
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
    <label className="mt-3 block text-[13px] font-medium text-text-primary">
      {label}
      <span className="relative mt-1.5 block">{children}</span>
    </label>
  );
}

function EyeToggle({
  shown,
  onClick,
}: {
  shown: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-text-muted hover:text-text-primary"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? (
        <EyeOffIcon className="h-[18px] w-[18px]" />
      ) : (
        <EyeIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
