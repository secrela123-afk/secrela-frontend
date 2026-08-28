"use client";

import { useId } from "react";
import "./hero-vault-scene.css";

/**
 * Secrela hero vault — bank-safe SVG loop (9s).
 * Icons fly in → door seals → wheel/dial lock.
 * No page background, scanline, or pulse ring.
 */
export function HeroVaultScene() {
  const uid = useId().replace(/:/g, "");
  const cabinetGrad = `vh-cab-${uid}`;
  const doorGrad = `vh-door-${uid}`;
  const chamberGrad = `vh-ch-${uid}`;
  const greenGlow = `vh-glow-${uid}`;

  return (
    <figure className="hero-vault m-0 w-full" aria-hidden="true">
      <div className="hero-vault-stage">
        <svg
          className="hero-vault-svg"
          viewBox="0 0 960 540"
          xmlns="http://www.w3.org/2000/svg"
          role="presentation"
        >
          <defs>
            <linearGradient id={cabinetGrad} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1d3040" />
              <stop offset="45%" stopColor="#121e2a" />
              <stop offset="100%" stopColor="#0a141d" />
            </linearGradient>

            <linearGradient id={doorGrad} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#243848" />
              <stop offset="50%" stopColor="#152230" />
              <stop offset="100%" stopColor="#0e1822" />
            </linearGradient>

            <radialGradient id={chamberGrad} cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#0c141c" />
              <stop offset="100%" stopColor="#030a11" />
            </radialGradient>

            <radialGradient id={greenGlow} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#19E06F" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#0FAA52" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0FAA52" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Soft secured aura only — no pulse ring / scanline / page bg */}
          <g className="hero-vault-breathe">
            <circle
              className="hero-vault-glow-ring"
              cx="480"
              cy="270"
              r="175"
              fill={`url(#${greenGlow})`}
            />
          </g>

          {/* Safe cabinet */}
          <rect
            x="300"
            y="80"
            width="360"
            height="380"
            rx="28"
            fill={`url(#${cabinetGrad})`}
            stroke="#030a11"
            strokeWidth="3"
          />
          <line
            x1="318"
            y1="100"
            x2="318"
            y2="440"
            stroke="#000"
            strokeOpacity="0.35"
            strokeWidth="1.5"
          />
          <line
            x1="642"
            y1="100"
            x2="642"
            y2="440"
            stroke="#fff"
            strokeOpacity="0.03"
            strokeWidth="1.5"
          />
          <rect x="325" y="452" width="26" height="14" rx="4" fill="#0a141d" />
          <rect x="609" y="452" width="26" height="14" rx="4" fill="#0a141d" />

          {/* Chamber (visible when door open) */}
          <circle cx="480" cy="270" r="120" fill={`url(#${chamberGrad})`} />
          <ellipse
            cx="480"
            cy="330"
            rx="86"
            ry="10"
            fill="#000"
            opacity="0.35"
          />

          {/* Icons fly in while door is open, settle in chamber */}
          <IconChip className="hero-vault-chip hero-vault-chip-1" kind="key" />
          <IconChip className="hero-vault-chip hero-vault-chip-2" kind="env" />
          <IconChip
            className="hero-vault-chip hero-vault-chip-3"
            kind="token"
          />
          <IconChip
            className="hero-vault-chip hero-vault-chip-4"
            kind="password"
          />
          <IconChip
            className="hero-vault-chip hero-vault-chip-5"
            kind="secret"
          />
          <IconChip className="hero-vault-chip hero-vault-chip-6" kind="cred" />
          <IconChip
            className="hero-vault-chip hero-vault-chip-7"
            kind="oauth"
          />

          {/* Bezel frame */}
          <circle
            cx="480"
            cy="270"
            r="132"
            fill="none"
            stroke="#030a11"
            strokeWidth="14"
          />
          <circle
            className="hero-vault-bezel-stroke"
            cx="480"
            cy="270"
            r="132"
            fill="none"
            strokeWidth="2"
          />

          {/* Outer locking gear (bolts) — spins + extends after door seals */}
          <g className="hero-vault-bolt-ring">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <g key={deg} transform={`rotate(${deg} 480 270)`}>
                <rect
                  className="hero-vault-bolt-arm"
                  x="477"
                  y="128"
                  width="6"
                  height="16"
                  rx="2"
                  fill="#3a4f63"
                />
              </g>
            ))}
          </g>

          {/* Door — swings shut from left hinge */}
          <g className="hero-vault-door">
            <circle
              cx="480"
              cy="270"
              r="120"
              fill={`url(#${doorGrad})`}
              stroke="#3a4f63"
              strokeWidth="2"
            />

            <rect
              x="356"
              y="205"
              width="14"
              height="26"
              rx="5"
              fill="#0a141d"
              stroke="#3a4f63"
            />
            <rect
              x="356"
              y="309"
              width="14"
              height="26"
              rx="5"
              fill="#0a141d"
              stroke="#3a4f63"
            />

            <g fill="#3a4f63" opacity="0.85">
              <circle cx="480" cy="168" r="3" />
              <circle cx="546" cy="192" r="3" />
              <circle cx="546" cy="348" r="3" />
              <circle cx="480" cy="372" r="3" />
              <circle cx="414" cy="348" r="3" />
              <circle cx="414" cy="192" r="3" />
            </g>

            {/* Combination dial */}
            <g className="hero-vault-dial">
              <circle
                cx="480"
                cy="222"
                r="20"
                fill="#0a141d"
                stroke="#3a4f63"
                strokeWidth="2"
              />
              <g stroke="#3a4f63" strokeWidth="1.5">
                <line x1="480" y1="204" x2="480" y2="209" />
                <line x1="498" y1="222" x2="493" y2="222" />
                <line x1="480" y1="240" x2="480" y2="235" />
                <line x1="462" y1="222" x2="467" y2="222" />
              </g>
              <line
                x1="480"
                y1="222"
                x2="480"
                y2="209"
                stroke="#9aa7b5"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="480" cy="222" r="2.5" fill="#9aa7b5" />
            </g>

            {/* Spoke wheel */}
            <g className="hero-vault-wheel">
              <circle
                cx="480"
                cy="278"
                r="42"
                fill="none"
                stroke="#3a4f63"
                strokeWidth="6"
              />
              <circle
                cx="480"
                cy="278"
                r="9"
                fill="#152230"
                stroke="#3a4f63"
                strokeWidth="2"
              />
              <g stroke="#3a4f63" strokeWidth="6" strokeLinecap="round">
                <line x1="480" y1="240" x2="480" y2="252" />
                <line x1="480" y1="304" x2="480" y2="316" />
                <line x1="442" y1="278" x2="454" y2="278" />
                <line x1="506" y1="278" x2="518" y2="278" />
                <line x1="453" y1="251" x2="461" y2="259" />
                <line x1="499" y1="297" x2="507" y2="305" />
                <line x1="507" y1="251" x2="499" y2="259" />
                <line x1="461" y1="297" x2="453" y2="305" />
              </g>
            </g>
          </g>
        </svg>

        <p className="hero-vault-caption">
          Secrets enter · Vault seals · Access locked
        </p>
      </div>
    </figure>
  );
}

type IconKind =
  | "key"
  | "env"
  | "token"
  | "password"
  | "secret"
  | "cred"
  | "oauth";

const ICON_BG: Record<IconKind, string> = {
  key: "#F5B82E",
  env: "#3B9CFF",
  token: "#8B6CFF",
  password: "#FF6B6B",
  secret: "#19E06F",
  cred: "#3B9CFF",
  oauth: "#FF8A3D",
};

function IconChip({ className, kind }: { className: string; kind: IconKind }) {
  const bg = ICON_BG[kind];
  return (
    <g className={className}>
      <rect x="-20" y="-20" width="40" height="40" rx="10" fill={bg} />
      <g
        transform="translate(-10,-10)"
        fill="none"
        stroke="#030A11"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {kind === "key" && (
          <>
            <circle cx="7" cy="10" r="3.2" />
            <path d="M10 10h8M14.5 8v4" />
          </>
        )}
        {kind === "env" && (
          <>
            <path d="M5 3.5h6.5L15 7v9.5H5V3.5Z" />
            <path d="M11.5 3.5V7H15" />
            <path d="M7.5 10.5h5M7.5 13h3.5" />
          </>
        )}
        {kind === "token" && (
          <>
            <rect x="4" y="5" width="12" height="10" rx="2" />
            <path d="M7 10h6" />
            <circle cx="8" cy="10" r="1" fill="#030A11" stroke="none" />
          </>
        )}
        {kind === "password" && (
          <>
            <rect x="5" y="9" width="10" height="7" rx="1.5" />
            <path d="M7.2 9V7.2a2.8 2.8 0 0 1 5.6 0V9" />
          </>
        )}
        {kind === "secret" && (
          <>
            <path d="M10 3.2 15.5 5.5v4.2c0 3.4-2.3 6.2-5.5 7.4-3.2-1.2-5.5-4-5.5-7.4V5.5L10 3.2Z" />
            <path d="M10 8v3.2" />
            <circle cx="10" cy="7.2" r="0.9" fill="#030A11" stroke="none" />
          </>
        )}
        {kind === "cred" && (
          <>
            <circle cx="8" cy="7.5" r="2.4" />
            <circle cx="13.2" cy="8.2" r="1.8" />
            <path d="M4.2 15c.6-2 2.2-3 3.8-3s3.2 1 3.8 3" />
            <path d="M12 12.2c1.2 0 2.4.6 3 2" />
          </>
        )}
        {kind === "oauth" && (
          <>
            <circle cx="7.5" cy="7.5" r="2.8" />
            <circle cx="12.5" cy="12.5" r="2.8" />
            <path d="M9.4 9.4 10.6 10.6" />
          </>
        )}
      </g>
    </g>
  );
}
