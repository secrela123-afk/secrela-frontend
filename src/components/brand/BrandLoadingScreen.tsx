"use client";

import { SecureVaultLogo } from "./SecureVaultLogo";
import "./securevault-logo.css";

type BrandLoadingScreenProps = {
  label?: string;
  size?: number;
  fullScreen?: boolean;
  className?: string;
};

function stripTrailingDots(text: string): string {
  return text.replace(/[.…]+$/u, "").trimEnd();
}

/**
 * Minimal loader — spinning hex + static S, label with three dots below.
 */
export function BrandLoadingScreen({
  label = "Loading workspace",
  size = 72,
  fullScreen = false,
  className = "",
}: BrandLoadingScreenProps) {
  const words = stripTrailingDots(label);

  return (
    <div
      className={[
        "flex flex-col items-center justify-center gap-4 px-6 text-center",
        fullScreen ? "min-h-screen bg-background-primary" : "min-h-[280px] w-full py-12",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${words}…`}
    >
      <SecureVaultLogo state="loading" size={size} decorative />

      <p className="text-[13px] font-medium text-text-secondary">
        {words}
        <span className="sv-loading-dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </p>
    </div>
  );
}
