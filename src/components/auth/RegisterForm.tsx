"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError, registerRequest } from "../../lib/api";
import {
  authPathWithNext,
  sanitizeNextPath,
  verifyEmailPendingPath,
} from "../../lib/routes";
import { FREE_TRIAL_DAYS } from "../../lib/subscription";
import { rememberAuthNext } from "../../lib/auth-next";
import { APP_NAME } from "../../lib/brand";
import {
  triggerAuthFormLogoError,
  useAuthLogo,
} from "./auth-logo-context";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";
import {
  ArrowRightIcon,
  BuildingIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  SpinnerIcon,
  UserIcon,
} from "./icons";

const RULES = [
  { id: "length", label: "8+ characters", test: (v: string) => v.length >= 8 },
  { id: "upper", label: "Uppercase", test: (v: string) => /[A-Z]/.test(v) },
  { id: "number", label: "Number", test: (v: string) => /\d/.test(v) },
  {
    id: "special",
    label: "Special character",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;

const inputClass =
  "block h-10 w-full rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/80 pl-10 pr-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow] duration-fast placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus";

const ssoBtnClass =
  "flex h-9 items-center justify-center gap-1.5 rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/50 text-[12px] font-medium text-text-primary transition-[border-color,background-color] duration-fast hover:border-brand-primary/35 hover:bg-surface-elevated focus-visible:outline-none focus-visible:shadow-focus";

function passwordStrength(password: string): number {
  return RULES.reduce((n, rule) => n + (rule.test(password) ? 1 : 0), 0);
}

/**
 * Secrela registration card — wired to existing /api/v1/auth/register.
 */
export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(searchParams.get("next"));
  const joiningViaInvite = Boolean(nextPath?.startsWith("/invite/"));
  const logo = useAuthLogo();
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    companyName?: string;
    phone?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  useEffect(() => {
    const fromQuery = searchParams.get("email")?.trim();
    if (fromQuery) setEmail(fromQuery);
  }, [searchParams]);

  const strength = passwordStrength(password);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const nextErrors: typeof fieldErrors = {};

    if (!companyName.trim()) {
      nextErrors.companyName = joiningViaInvite
        ? "Name is required"
        : "Company name is required";
    }
    if (!joiningViaInvite) {
      const phoneValue = phone.trim();
      if (!phoneValue) {
        nextErrors.phone = "Phone number is required";
      } else if (phoneValue.length < 7) {
        nextErrors.phone = "Phone number is too short";
      } else if (!/^[+0-9()\-\s]+$/.test(phoneValue)) {
        nextErrors.phone = "Enter a valid phone number";
      }
    }
    if (!email.trim()) nextErrors.email = "Work email is required";
    if (!RULES.every((rule) => rule.test(password))) {
      nextErrors.password = "Password does not meet the requirements";
    }
    if (password !== confirm) {
      nextErrors.confirm = "Passwords do not match";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      triggerAuthFormLogoError(logo);
      return;
    }

    setLoading(true);
    logo?.setState("loading");
    try {
      if (nextPath) rememberAuthNext(nextPath);
      await registerRequest({
        companyName: companyName.trim(),
        email: email.trim(),
        password,
        ...(joiningViaInvite
          ? { createOrganization: false }
          : {
              plan: "free",
              createOrganization: true,
              phone: phone.trim(),
            }),
      });
      logo?.setState("success");
      router.push(verifyEmailPendingPath(email.trim(), nextPath));
      router.refresh();
    } catch (err) {
      triggerAuthFormLogoError(logo);
      setError(
        err instanceof ApiError ? err.message : "Unable to create the account",
      );
    } finally {
      setLoading(false);
    }
  }

  const planHint = `Start your ${FREE_TRIAL_DAYS}-day free trial — verify your email to open your dashboard.`;

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
        <p className="mt-2 text-[12px] font-medium text-text-secondary">
          {joiningViaInvite ? "Join your team" : "New company workspace"}
        </p>
        <h2 className="mt-1 text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-[1.5rem]">
          Create your account
        </h2>
        <p className="mt-1 max-w-md text-[13px] leading-snug text-text-secondary">
          {joiningViaInvite
            ? "Use your work email. Your company workspace is already set up."
            : planHint}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <Field
          label={joiningViaInvite ? "Your name" : "Company name"}
          error={fieldErrors.companyName}
        >
          {joiningViaInvite ? (
            <UserIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          ) : (
            <BuildingIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          )}
          <input
            className={inputClass}
            name="companyName"
            autoComplete="organization"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={joiningViaInvite ? "John Doe" : "Acme Security Ltd"}
          />
        </Field>

        {!joiningViaInvite ? (
          <Field label="Phone number" error={fieldErrors.phone}>
            <PhoneIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              className={inputClass}
              type="tel"
              name="phone"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 100 000 0000"
            />
          </Field>
        ) : null}

        <Field label="Work email" error={fieldErrors.email}>
          <MailIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            className={inputClass}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          <LockIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            className={`${inputClass} pr-10`}
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••••"
          />
          <EyeToggle
            shown={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          />
        </Field>

        {password.length > 0 ? (
          <div
            className="flex gap-1"
            role="meter"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={strength}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-pill ${
                  i < strength ? "bg-brand-primary" : "bg-border-subtle"
                }`}
              />
            ))}
          </div>
        ) : null}

        <Field label="Confirm password" error={fieldErrors.confirm}>
          <LockIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            className={`${inputClass} pr-10`}
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••••••••"
          />
          <EyeToggle
            shown={showConfirm}
            onClick={() => setShowConfirm((v) => !v)}
          />
        </Field>
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
        {RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li
              key={rule.id}
              className={`flex items-center gap-1 text-[11px] ${
                ok ? "text-brand-primary" : "text-text-muted"
              }`}
            >
              <CheckIcon className="h-2.5 w-2.5 shrink-0" />
              {rule.label}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p className="mt-2 text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="relative mt-4 flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-[14px] font-bold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow,transform] duration-fast hover:bg-brand-primary-hover hover:shadow-glow-green-strong hover:-translate-y-px focus-visible:outline-none focus-visible:shadow-focus active:translate-y-0 disabled:cursor-wait motion-reduce:hover:translate-y-0"
      >
        <span>Create account</span>
        <span className="absolute right-3.5">
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightIcon className="h-4 w-4" />
          )}
        </span>
      </button>

      <div className="mt-4 flex items-center gap-3">
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

      <p className="mt-4 text-center text-[13px] text-text-secondary">
        Have an account?{" "}
        <Link
          href={authPathWithNext("/login", {
            email: email.trim() || undefined,
            next: nextPath,
          })}
          className="font-semibold text-brand-primary hover:text-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <label className="block text-[12px] font-medium text-text-primary">
      {label}
      <span className="relative mt-1 block">{children}</span>
      {error ? (
        <span className="mt-1 block text-[11px] font-normal text-danger">
          {error}
        </span>
      ) : null}
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
      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
      onClick={onClick}
      aria-label={shown ? "Hide password" : "Show password"}
    >
      {shown ? (
        <EyeOffIcon className="h-4 w-4" />
      ) : (
        <EyeIcon className="h-4 w-4" />
      )}
    </button>
  );
}
