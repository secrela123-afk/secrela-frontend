"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  ApiError,
  createOrganizationRequest,
  type AuthUser,
} from "../../lib/api";
import { APP_HOME } from "../../lib/routes";
import { FREE_TRIAL_DAYS } from "../../lib/subscription";
import { APP_NAME } from "../../lib/brand";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";
import type { SecureVaultLogoState } from "../brand/SecureVaultLogo";
import {
  AUTH_HEADER_LOGO_STATE,
  AuthLogoContext,
  triggerAuthFormLogoError,
  useAuthLogo,
} from "../auth/auth-logo-context";
import { AuthFormEnter } from "../auth/AuthFormEnter";
import {
  ArrowRightIcon,
  BoltIcon,
  BuildingIcon,
  GoogleIcon,
  PhoneIcon,
  ShieldOutlineIcon,
  SpinnerIcon,
  UsersIcon,
} from "../auth/icons";
import { toast } from "../../stores/toast-store";

const inputClass =
  "block h-10 w-full rounded-md border border-[rgba(100,130,150,0.18)] bg-background-secondary/80 pl-10 pr-3 text-[14px] text-text-primary outline-none transition-[border-color,box-shadow] duration-fast placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus";

const BENEFITS = [
  {
    title: "Enterprise security",
    description: "Bank-level encryption to keep your secrets safe",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Fast & reliable",
    description: "Built for performance and high availability",
    icon: BoltIcon,
  },
  {
    title: "Team collaboration",
    description: "Manage access and collaborate securely with your team",
    icon: UsersIcon,
  },
] as const;

/**
 * Google / no-org path — same two-column auth layout as /login.
 */
export function CreateOrganizationForm({
  user,
  onCreated,
}: {
  user: AuthUser;
  onCreated: () => void;
}) {
  const [formLogoState, setFormLogoState] =
    useState<SecureVaultLogoState>("enter");
  const setState = useCallback((next: SecureVaultLogoState) => {
    setFormLogoState(next);
  }, []);
  const formLogo = useMemo(
    () => ({ state: formLogoState, setState }),
    [formLogoState, setState],
  );

  return (
    <AuthLogoContext.Provider value={formLogo}>
      <main className="auth-page relative h-dvh max-h-dvh overflow-hidden bg-background-primary text-text-primary">
        <div
          className="pointer-events-none absolute -top-48 -left-48 h-[560px] w-[560px] rounded-full bg-brand-primary/18 blur-[140px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-44 -bottom-52 h-[520px] w-[520px] rounded-full bg-brand-primary/14 blur-[150px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_48%_36%_at_0%_-5%,rgb(25_224_111_/_0.12),transparent_58%),radial-gradient(ellipse_42%_34%_at_105%_105%,rgb(25_224_111_/_0.1),transparent_58%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[1320px] flex-col px-6 sm:px-8 lg:flex-row lg:px-12 xl:px-16">
          <section className="relative hidden h-full w-[45%] flex-col py-8 pr-6 lg:flex xl:py-10 xl:pr-10">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-inherit no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-focus"
              aria-label={APP_NAME}
            >
              <SecureVaultLogo
                state={AUTH_HEADER_LOGO_STATE}
                size={32}
                decorative
              />
              <span className="text-[1.0625rem] font-semibold tracking-tight text-text-primary">
                {APP_NAME}
              </span>
            </Link>

            <div className="mt-8 max-w-md xl:mt-10">
              <h1 className="text-[2.75rem] font-bold leading-[1.08] tracking-tight text-text-primary xl:text-[3.1rem]">
                Set up your{" "}
                <span className="text-brand-primary">company</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                You signed in with Google. Add your company details to start a{" "}
                {FREE_TRIAL_DAYS}-day free trial workspace.
              </p>

              <ul className="mt-8 list-none space-y-4 p-0">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-subtle bg-surface-card/80 text-brand-primary">
                      <b.icon className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-text-primary">
                        {b.title}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-text-secondary">
                        {b.description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative z-10 mt-auto pt-10">
              <p className="text-[11px] text-text-muted">
                Secure signup &nbsp;•&nbsp; No spam, ever. &nbsp;•&nbsp; Cancel
                anytime.
              </p>
            </div>
          </section>

          <section className="relative flex h-full w-full flex-1 flex-col items-center justify-center py-4 lg:w-[55%] lg:pl-6 xl:pl-10">
            <Link
              href="/"
              className="mb-3 inline-flex w-full max-w-[520px] items-center gap-1.5 text-inherit no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-focus lg:hidden"
              aria-label={APP_NAME}
            >
              <SecureVaultLogo
                state={AUTH_HEADER_LOGO_STATE}
                size={28}
                decorative
              />
              <span className="text-[15px] font-semibold tracking-tight text-text-primary">
                {APP_NAME}
              </span>
            </Link>

            <AuthFormEnter className="max-w-[520px]">
              <div className="w-full rounded-xl border border-[rgba(100,130,150,0.18)] bg-surface-card/90 px-5 py-5 shadow-elevated backdrop-blur-md sm:px-8 sm:py-7">
                <CreateOrganizationFormInner
                  user={user}
                  onCreated={onCreated}
                />
              </div>
            </AuthFormEnter>
          </section>
        </div>
      </main>
    </AuthLogoContext.Provider>
  );
}

function CreateOrganizationFormInner({
  user,
  onCreated,
}: {
  user: AuthUser;
  onCreated: () => void;
}) {
  const router = useRouter();
  const logo = useAuthLogo();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    phone?: string;
  }>({});

  const firstName = user.name.split(" ")[0] || user.name;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const nextErrors: typeof fieldErrors = {};
    if (name.trim().length < 2) {
      nextErrors.name = "Company name is required";
    }
    const phoneValue = phone.trim();
    if (!phoneValue) {
      nextErrors.phone = "Phone number is required";
    } else if (phoneValue.length < 7) {
      nextErrors.phone = "Phone number is too short";
    } else if (!/^[+0-9()\-\s]+$/.test(phoneValue)) {
      nextErrors.phone = "Enter a valid phone number";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      triggerAuthFormLogoError(logo);
      return;
    }

    setLoading(true);
    logo?.setState("loading");
    try {
      await createOrganizationRequest({
        name: name.trim(),
        phone: phoneValue,
      });
      toast.success(
        "Workspace ready",
        `${FREE_TRIAL_DAYS}-day free trial started.`,
      );
      logo?.setState("success");
      onCreated();
      router.replace(APP_HOME);
      router.refresh();
    } catch (err) {
      triggerAuthFormLogoError(logo);
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to create the organization",
      );
    } finally {
      setLoading(false);
    }
  }

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

        <h2 className="mt-3 text-[1.5rem] font-semibold tracking-tight text-text-primary sm:text-[1.625rem]">
          Add your <span className="text-brand-primary">company</span>
        </h2>
        <p className="mt-1.5 max-w-sm text-[13px] leading-snug text-text-secondary">
          Hi {firstName}. Complete these details to open your{" "}
          {FREE_TRIAL_DAYS}-day free trial.
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-[rgba(100,130,150,0.14)] bg-background-secondary/50 px-3 py-2.5 text-[12px] text-text-secondary">
        <GoogleIcon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{user.email}</span>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <Field label="Company name" error={fieldErrors.name}>
          <BuildingIcon className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <input
            className={inputClass}
            name="companyName"
            autoComplete="organization"
            required
            minLength={2}
            maxLength={120}
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Security Ltd"
            disabled={loading}
          />
        </Field>

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
            disabled={loading}
          />
        </Field>
      </div>

      {error ? (
        <p className="mt-2 text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="relative mt-5 flex h-11 w-full items-center justify-center rounded-md bg-brand-primary text-[14px] font-bold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow,transform] duration-fast hover:bg-brand-primary-hover hover:shadow-glow-green-strong hover:-translate-y-px focus-visible:outline-none focus-visible:shadow-focus active:translate-y-0 disabled:cursor-wait motion-reduce:hover:translate-y-0"
      >
        <span>
          {loading ? "Creating workspace…" : "Start free trial"}
        </span>
        <span className="absolute right-3.5">
          {loading ? (
            <SpinnerIcon className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightIcon className="h-4 w-4" />
          )}
        </span>
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
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
