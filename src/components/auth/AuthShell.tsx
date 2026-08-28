"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { type SecureVaultLogoState } from "../brand/SecureVaultLogo";
import { authCard } from "./auth-classes";
import { AuthFormEnter } from "./AuthFormEnter";
import { AuthLogoContext } from "./auth-logo-context";
import { SecureVaultMark } from "./SecureVaultMark";

export { useAuthLogo } from "./auth-logo-context";

type AuthShellProps = {
  children: ReactNode;
  /** Optional footer under the form (e.g. security note) */
  footer?: ReactNode;
  className?: string;
  logoState?: SecureVaultLogoState;
  /** Hide the top mark when the form renders its own compact brand row. */
  hideMark?: boolean;
  /**
   * Card shape:
   * - default: login / short forms (~440px)
   * - register: taller portrait card, leans toward square (~460px) — not the old wide flat card
   */
  variant?: "default" | "register";
};

/**
 * Centered auth chrome. Layout is Tailwind; `auth-page` class only for html:has scroll-lock.
 */
export function AuthShell({
  children,
  footer,
  className,
  logoState,
  hideMark = false,
  variant = "default",
}: AuthShellProps) {
  const [internalState, setInternalState] = useState<SecureVaultLogoState>(
    logoState ?? "enter",
  );
  const state = logoState ?? internalState;
  const setState = useCallback((next: SecureVaultLogoState) => {
    setInternalState(next);
  }, []);
  const logo = useMemo(() => ({ state, setState }), [state, setState]);

  const isRegister = variant === "register";

  return (
    <AuthLogoContext.Provider value={logo}>
      <main
        className={[
          "auth-page relative flex h-dvh max-h-dvh items-center justify-center overflow-hidden overscroll-none bg-background-primary",
          isRegister ? "px-4 py-5" : "px-4 py-6",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_480px_at_50%_-10%,rgb(34_211_90_/_0.07),transparent_60%),radial-gradient(700px_420px_at_80%_110%,rgb(34_211_90_/_0.03),transparent_55%)]"
          aria-hidden="true"
        />
        <AuthFormEnter
          className={isRegister ? "max-w-[420px]" : "max-w-[440px]"}
        >
          <section
            className={[
              authCard,
              isRegister
                ? "max-h-full min-h-0 w-full gap-0 overflow-auto px-5 py-6 sm:px-6 sm:py-6"
                : "max-h-full min-h-0 w-full gap-4 overflow-auto px-6 py-7 sm:px-8 sm:pt-8 sm:pb-6",
            ].join(" ")}
          >
            {hideMark ? null : (
              <SecureVaultMark className="shrink-0 justify-center" state={state} />
            )}
            <div className="flex min-h-0 flex-1 items-stretch">{children}</div>
            {footer ? (
              <div className="flex justify-center">{footer}</div>
            ) : null}
          </section>
        </AuthFormEnter>
      </main>
    </AuthLogoContext.Provider>
  );
}
