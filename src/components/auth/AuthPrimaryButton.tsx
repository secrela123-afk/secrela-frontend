"use client";

import type { ReactNode } from "react";
import { authPrimaryBtn } from "./auth-classes";
import { ArrowRightIcon, SpinnerIcon } from "./icons";

type AuthPrimaryButtonProps = {
  children: ReactNode;
  loading?: boolean;
  type?: "submit" | "button";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  showArrow?: boolean;
};

export function AuthPrimaryButton({
  children,
  loading = false,
  type = "submit",
  className,
  onClick,
  disabled,
  showArrow = true,
}: AuthPrimaryButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${authPrimaryBtn}${className ? ` ${className}` : ""}`}
    >
      <span>{children}</span>
      {showArrow ? (
        <span className="absolute right-[1.15rem]">
          {loading ? (
            <SpinnerIcon className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowRightIcon className="h-5 w-5" />
          )}
        </span>
      ) : null}
    </button>
  );
}
