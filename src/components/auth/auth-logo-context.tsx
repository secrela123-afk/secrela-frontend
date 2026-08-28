"use client";

import { createContext, useContext } from "react";
import type { SecureVaultLogoState } from "../brand/SecureVaultLogo";

export type AuthLogoContextValue = {
  state: SecureVaultLogoState;
  setState: (state: SecureVaultLogoState) => void;
};

export const AuthLogoContext = createContext<AuthLogoContextValue | null>(null);

/** Static state for page header wordmarks — never tied to form submit feedback. */
export const AUTH_HEADER_LOGO_STATE: SecureVaultLogoState = "enter";

/** Shake + reset the logo at the top of an auth form card. */
export function triggerAuthFormLogoError(logo: AuthLogoContextValue | null) {
  logo?.setState("error");
  window.setTimeout(() => logo?.setState("idle"), 700);
}

/** Drive the form-card logo only: loading / success / error / shine. */
export function useAuthLogo() {
  return useContext(AuthLogoContext);
}
