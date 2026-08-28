"use client";

import { useId } from "react";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";

type ProblemsHubBridgeProps = {
  active?: boolean;
};

/**
 * Tight 3-in / 3-out bridge — lines run edge-to-hub with almost no dead gap.
 * Column is narrow; paths start at x=0 / end at x=200 (card edges).
 */
export function ProblemsHubBridge({ active = true }: ProblemsHubBridgeProps) {
  const rawId = useId().replace(/:/g, "");
  const gid = `gw-${rawId}`;

  // Hub plate ~ occupies center; docks sit just outside it
  const left = [
    { d: "M0 16 C42 16, 62 44, 78 47", delay: 0 },
    { d: "M0 50 L78 50", delay: 0.18 },
    { d: "M0 84 C42 84, 62 56, 78 53", delay: 0.36 },
  ] as const;

  const right = [
    { d: "M122 47 C138 44, 158 16, 200 16", delay: 0.12 },
    { d: "M122 50 L200 50", delay: 0.3 },
    { d: "M122 53 C138 56, 158 84, 200 84", delay: 0.48 },
  ] as const;

  return (
    <div
      className="problems-hub-bridge relative flex h-full min-h-[7.25rem] w-full items-center justify-center"
      data-active={active ? "true" : "false"}
      aria-hidden="true"
    >
      <div className="pointer-events-none absolute inset-[20%_22%] rounded-full bg-brand-primary/16 blur-2xl" />

      <svg
        className="problems-hub-svg absolute inset-0 z-[1] h-full w-full"
        viewBox="0 0 200 100"
        preserveAspectRatio="none"
        fill="none"
        role="presentation"
      >
        <defs>
          <linearGradient
            id={`${gid}-in`}
            x1="0"
            y1="50"
            x2="78"
            y2="50"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FF4D4D" stopOpacity="0.95" />
            <stop offset="1" stopColor="#19E06F" stopOpacity="0.95" />
          </linearGradient>
          <filter
            id={`${gid}-glow`}
            x="-15%"
            y="-25%"
            width="130%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="0.8" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${gid}-glow)`}>
          {left.map((t, i) => (
            <path
              key={`l-${i}`}
              d={t.d}
              className="problems-gw-line problems-gw-line--in"
              stroke={`url(#${gid}-in)`}
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        {left.map((t, i) => (
          <path
            key={`lw-${i}`}
            className="problems-hub-wave problems-hub-wave--in"
            d={t.d}
            stroke="#FF8A8A"
            strokeWidth="1.7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ animationDelay: `${t.delay}s` }}
          />
        ))}

        <g filter={`url(#${gid}-glow)`}>
          {right.map((t, i) => (
            <path
              key={`r-${i}`}
              d={t.d}
              className="problems-gw-line problems-gw-line--out"
              stroke="#19E06F"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
              opacity={0.95}
            />
          ))}
        </g>

        {right.map((t, i) => (
          <path
            key={`rw-${i}`}
            className="problems-hub-wave problems-hub-wave--out"
            d={t.d}
            stroke="#8CFFB8"
            strokeWidth="1.7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ animationDelay: `${0.22 + t.delay}s` }}
          />
        ))}
      </svg>

      <div className="pointer-events-none relative z-[2] grid place-items-center rounded-md border border-brand-primary/50 bg-surface-card/80 px-2 py-2 shadow-[0_0_22px_rgb(25_224_111_/_0.22)] backdrop-blur-[4px]">
        <div className="problems-hub-ring absolute inset-[-6%] rounded-md border border-brand-primary/25" />
        <SecureVaultLogo state={active ? "success" : "idle"} size={44} decorative />
      </div>
    </div>
  );
}
