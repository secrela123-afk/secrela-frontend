"use client";

import { useId } from "react";
import { APP_NAME } from "../../lib/brand";
import "./securevault-logo.css";

export type SecureVaultLogoState =
  | "idle"
  | "enter"
  | "shine"
  | "loading"
  | "success"
  | "error";

type SecureVaultLogoProps = {
  state?: SecureVaultLogoState;
  size?: number;
  className?: string;
  /** Hide from AT when a nearby wordmark already names the product. */
  decorative?: boolean;
};

/**
 * Secrela lettermark — geometric “S” inside a hexagon (real SVG logo, not text).
 * Export name kept for compatibility across auth / app / landing.
 */
export function SecureVaultLogo({
  state = "idle",
  size = 40,
  className,
  decorative = false,
}: SecureVaultLogoProps) {
  const rawId = useId().replace(/:/g, "");
  const gradId = `secrela-s-grad-${rawId}`;
  const glowId = `secrela-s-glow-${rawId}`;

  return (
    <span
      className={`sv-logo${className ? ` ${className}` : ""}`}
      data-state={state}
      style={{ ["--sv-logo-size" as string]: `${size}px` }}
      aria-hidden={decorative ? true : undefined}
    >
      <span className="sv-logo-mark">
        <svg
          className="sv-logo-svg"
          viewBox="0 0 48 48"
          fill="none"
          role={decorative ? "presentation" : "img"}
          aria-label={decorative ? undefined : APP_NAME}
        >
          <defs>
            <linearGradient
              id={gradId}
              x1="8"
              y1="6"
              x2="40"
              y2="42"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#2AEB7C" />
              <stop offset="0.55" stopColor="#19E06F" />
              <stop offset="1" stopColor="#0FAA52" />
            </linearGradient>
            <filter
              id={glowId}
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation="1.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Hex frame — spins alone while loading */}
          <g className="sv-logo-hex-frame">
            <path
              className="sv-logo-hex-fill"
              d="M24 3.5 41.5 13.5v21L24 44.5 6.5 34.5v-21L24 3.5Z"
              fill={`url(#${gradId})`}
              fillOpacity="0.08"
            />
            <path
              className="sv-logo-hex"
              d="M24 3.5 41.5 13.5v21L24 44.5 6.5 34.5v-21L24 3.5Z"
              stroke={`url(#${gradId})`}
              strokeWidth="1.75"
              strokeLinejoin="round"
            />
          </g>

          {/* Geometric S — stays still while hex spins */}
          <g transform="translate(48 0) scale(-1 1)">
            <path
              className="sv-logo-s"
              filter={`url(#${glowId})`}
              d="M31.8 16.2c-.7-2.4-2.6-4.1-5.6-4.8-3.6-.8-7.1.4-8.7 3.1-.4.7-.2 1.5.5 1.9l1.7 1c.7.4 1.5.2 1.9-.5.7-1.1 2.3-1.7 4.1-1.3 1.6.4 2.4 1.3 2.6 2.2.3 1.3-.4 2.2-2.8 3.1l-4.2 1.5c-3.6 1.3-5.7 3.5-5.2 6.9.5 3.5 3.3 5.6 7.4 6.1 4.1.5 7.8-1.1 9.3-4.3.4-.8.1-1.7-.7-2.1l-1.7-1c-.8-.4-1.7-.2-2.1.6-.7 1.4-2.7 2.3-5 2-.2 0-.4 0-.5 0-1.8-.2-2.8-1.1-3-2.2-.2-1.2.5-2.1 2.9-3l4.3-1.5c4.1-1.5 6.1-4 5.5-7.8Z"
              fill={`url(#${gradId})`}
            />
          </g>

          {/* Loading ring (CSS-driven) */}
          <circle
            className="sv-logo-energy-ring"
            cx="24"
            cy="24"
            r="21.5"
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="28 110"
            fill="none"
          />
        </svg>
      </span>
    </span>
  );
}
