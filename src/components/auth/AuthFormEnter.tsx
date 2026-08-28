"use client";

import type { ReactNode } from "react";

type AuthFormEnterProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Form-only enter motion for auth screens.
 * Background + left marketing stay put; the form rises from below on mount/navigation.
 */
export function AuthFormEnter({ children, className }: AuthFormEnterProps) {
  return (
    <div className={["auth-form-enter", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
