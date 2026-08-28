"use client";

import { useCallback, useMemo, useState } from "react";
import { APP_NAME } from "../../lib/brand";
import { SecureVaultLogo } from "../../components/brand/SecureVaultLogo";
import {
  AUTH_HEADER_LOGO_STATE,
  AuthLogoContext,
} from "../../components/auth/auth-logo-context";
import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";
import Link from "next/link";
import { AuthFormEnter } from "../../components/auth/AuthFormEnter";
import { authFormCard } from "../../components/auth/auth-classes";
import {
  BoltIcon,
  MailIcon,
  ShieldOutlineIcon,
} from "../../components/auth/icons";
import type { SecureVaultLogoState } from "../../components/brand/SecureVaultLogo";

const BENEFITS = [
  {
    title: "Your data is safe",
    description: "Bank-level encryption keeps your information protected.",
    icon: ShieldOutlineIcon,
  },
  {
    title: "Quick & easy process",
    description: "Reset your password in just a few simple steps.",
    icon: BoltIcon,
  },
  {
    title: "Secure email delivery",
    description: "We'll send a secure link to your registered email.",
    icon: MailIcon,
  },
] as const;

/**
 * Secrela forgot-password screen — same layout system as login/register.
 */
export function ForgotPasswordScreen() {
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
            <div className="flex items-center gap-2.5" aria-label={APP_NAME}>
              <SecureVaultLogo
                state={AUTH_HEADER_LOGO_STATE}
                size={32}
                decorative
              />
              <span className="text-[1.0625rem] font-semibold tracking-tight text-text-primary">
                {APP_NAME}
              </span>
            </div>

            <div className="mt-8 max-w-md xl:mt-10">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-primary/50 px-3 py-1 text-[11px] font-medium text-brand-primary">
                <ShieldOutlineIcon className="h-3 w-3" />
                Secure password recovery
              </span>

              <h1 className="mt-4 text-[2.5rem] font-bold leading-[1.08] tracking-tight text-text-primary xl:text-[3rem]">
                Reset your{" "}
                <span className="text-brand-primary">password</span>
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                No worries — it happens to the best of us. We&apos;ll help you
                get back into your account securely.
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
                Your security is our priority. We never share your data with
                anyone.
              </p>
            </div>
          </section>

          <section className="relative flex h-full w-full flex-1 flex-col items-center justify-center py-4 lg:w-[55%] lg:pl-6 xl:pl-10">
            <div
              className="mb-3 flex w-full max-w-[520px] items-center gap-2.5 lg:hidden"
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
            </div>

            <AuthFormEnter className="max-w-[520px]">
              <div className={authFormCard}>
                <ForgotPasswordForm />
              </div>
            </AuthFormEnter>
          </section>
        </div>
      </main>
    </AuthLogoContext.Provider>
  );
}
