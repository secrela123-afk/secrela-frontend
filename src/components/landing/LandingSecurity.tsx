"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Cloud,
  FileText,
  Fingerprint,
  Lock,
  Shield,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { landingSection } from "./landing-classes";
import { APP_NAME } from "../../lib/brand";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";

type Feature = {
  title: string;
  body: string;
  Icon: LucideIcon;
  iconClass: string;
  chipClass: string;
  side: "left" | "right";
};

const FEATURES: Feature[] = [
  {
    title: "End-to-end encryption",
    body: "Your data is encrypted in transit and at rest.",
    Icon: Lock,
    iconClass: "text-brand-primary",
    chipClass: "border-brand-primary/30 bg-brand-primary/10",
    side: "left",
  },
  {
    title: "Granular permissions",
    body: "Advanced access controls down to the secret level.",
    Icon: Users,
    iconClass: "text-purple",
    chipClass: "border-purple/30 bg-purple/10",
    side: "left",
  },
  {
    title: "Audit logs",
    body: "Full visibility into who accessed what, when.",
    Icon: FileText,
    iconClass: "text-info",
    chipClass: "border-info/30 bg-info/10",
    side: "left",
  },
  {
    title: "Zero-trust architecture",
    body: "Every access is verified — never trust by default.",
    Icon: ShieldCheck,
    iconClass: "text-info",
    chipClass: "border-info/30 bg-info/10",
    side: "right",
  },
  {
    title: "MFA everywhere",
    body: "Multi-factor authentication for all accounts.",
    Icon: Fingerprint,
    iconClass: "text-brand-primary",
    chipClass: "border-brand-primary/30 bg-brand-primary/10",
    side: "right",
  },
  {
    title: "Secure backups",
    body: "Encrypted backups with point-in-time recovery.",
    Icon: Cloud,
    iconClass: "text-brand-primary",
    chipClass: "border-brand-primary/30 bg-brand-primary/10",
    side: "right",
  },
];

const TRUST_CHIPS = ["AES-256-GCM", "RBAC", "Full audit trail"] as const;

/** Ring node angles (deg from +x, screen Y-down) — left top/mid/bot, right top/mid/bot */
const RING_ANGLES_DEG = [-147, 180, 147, -33, 0, 33] as const;

type Pt = { x: number; y: number };

type DrawnConnector = {
  ring: Pt;
  card: Pt;
  /** Cubic Bezier controls — mid lines omit (straight) */
  c1?: Pt;
  c2?: Pt;
};

const RING_R = 78;

function ringPoint(cx: number, cy: number, angleDeg: number): Pt {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * RING_R,
    y: cy + Math.sin(rad) * RING_R,
  };
}

/**
 * Build path geometry: mid = straight; top/bottom = cubic that leaves
 * the ring more horizontally then arcs into the card port.
 */
function buildConnector(
  ring: Pt,
  card: Pt,
  side: "left" | "right",
  row: "top" | "mid" | "bot",
): DrawnConnector {
  if (row === "mid") {
    return { ring, card };
  }

  const outward = side === "left" ? -1 : 1;
  const c1: Pt = {
    x: ring.x + outward * 42,
    y: ring.y + (row === "top" ? -4 : 4),
  };
  const c2: Pt = {
    x: card.x - outward * 2,
    y: card.y + (row === "top" ? 52 : -52),
  };

  return { ring, card, c1, c2 };
}

/**
 * Section 6 — Security: left intro + right hub diagram.
 * Scroll-activated: lines draw in, cards stagger up, pulses travel hub → cards.
 */
export function LandingSecurity() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setActive(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="security"
      data-active={active ? "true" : "false"}
      className={`sec-section ${landingSection}`}
      aria-labelledby="landing-security-title"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)] lg:gap-10 xl:gap-14">
        <header className="max-w-md">
          <p className="m-0 inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/5 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
            <Shield className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            Built for real-world security
          </p>

          <h2
            id="landing-security-title"
            className="mt-5 text-[clamp(1.85rem,3.4vw,2.55rem)] font-bold leading-[1.12] tracking-tight text-text-primary"
          >
            Security built for{" "}
            <span className="text-brand-primary">the real world</span>
          </h2>

          <p className="mt-4 text-[0.9375rem] leading-relaxed text-text-secondary">
            {APP_NAME} is designed with security at its core — so you can focus
            on building, not worrying.
          </p>

          <ul className="mt-5 m-0 flex list-none flex-wrap gap-2 p-0">
            {TRUST_CHIPS.map((chip) => (
              <li
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-card/70 px-3 py-1 text-[11px] font-medium text-text-secondary"
              >
                <span
                  className="h-1 w-1 rounded-full bg-brand-primary"
                  aria-hidden="true"
                />
                {chip}
              </li>
            ))}
          </ul>

          <Link
            href="#how-it-works"
            className="btn-shine mt-7 inline-flex h-11 items-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-semibold text-brand-on-primary shadow-[0_0_28px_rgb(25_224_111_/_0.35)] transition-all duration-fast ease-sv hover:bg-brand-primary-hover hover:shadow-[0_0_36px_rgb(25_224_111_/_0.5)] focus-visible:outline-none focus-visible:shadow-focus"
          >
            Learn more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <SecurityHubDiagram active={active} />
      </div>
    </section>
  );
}

function SecurityHubDiagram({ active }: { active: boolean }) {
  const left = FEATURES.filter((f) => f.side === "left");
  const right = FEATURES.filter((f) => f.side === "right");

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const leftCardRefs = useRef<(HTMLElement | null)[]>([]);
  const rightCardRefs = useRef<(HTMLElement | null)[]>([]);
  const [connectors, setConnectors] = useState<DrawnConnector[]>([]);
  const [hub, setHub] = useState({ cx: 0, cy: 0, w: 720, h: 480 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;

    const rootBox = root.getBoundingClientRect();
    const w = rootBox.width;
    const h = rootBox.height;
    if (w < 8 || h < 8) return;

    const cx = w / 2;
    const cy = h / 2;

    const next: DrawnConnector[] = [];

    const groups = [
      {
        side: "left" as const,
        els: leftCardRefs.current,
        rows: ["top", "mid", "bot"] as const,
        angles: [RING_ANGLES_DEG[0], RING_ANGLES_DEG[1], RING_ANGLES_DEG[2]],
      },
      {
        side: "right" as const,
        els: rightCardRefs.current,
        rows: ["top", "mid", "bot"] as const,
        angles: [RING_ANGLES_DEG[3], RING_ANGLES_DEG[4], RING_ANGLES_DEG[5]],
      },
    ];

    for (const group of groups) {
      group.rows.forEach((row, i) => {
        const el = group.els[i];
        if (!el) return;

        const box = el.getBoundingClientRect();
        const card: Pt = {
          x:
            group.side === "left"
              ? box.right - rootBox.left
              : box.left - rootBox.left,
          y: box.top - rootBox.top + box.height / 2,
        };

        const ring = ringPoint(cx, cy, group.angles[i]);
        next.push(buildConnector(ring, card, group.side, row));
      });
    }

    if (next.length === 6) {
      setHub({ cx, cy, w, h });
      setConnectors(next);
    }
  }, []);

  useLayoutEffect(() => {
    measure();
    const id = requestAnimationFrame(() => measure());
    return () => cancelAnimationFrame(id);
  }, [measure]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const showPulses = active && !reducedMotion && connectors.length === 6;
  const orbitOrigin = { transformOrigin: `${hub.cx}px ${hub.cy}px` };

  return (
    <div className="sec-hub relative mx-auto w-full max-w-[720px]">
      {/* Ambient glow behind the whole diagram */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[75%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(25_224_111_/_0.07),transparent_65%)]"
        aria-hidden="true"
      />

      {/* Desktop / tablet diagram */}
      <div
        ref={rootRef}
        className="relative hidden min-h-[440px] sm:block md:min-h-[480px]"
      >
        <div className="grid h-full min-h-[440px] grid-cols-[minmax(0,1fr)_minmax(200px,240px)_minmax(0,1fr)] items-stretch gap-0 md:min-h-[480px]">
          <div className="relative z-[3] flex flex-col justify-between py-2 pr-1">
            {left.map((f, i) => (
              <FeatureCard
                key={f.title}
                feature={f}
                delayMs={i * 110}
                cardRef={(el) => {
                  leftCardRefs.current[i] = el;
                }}
              />
            ))}
          </div>

          <div className="relative z-[2] flex items-center justify-center">
            <SecurityHexCore />
          </div>

          <div className="relative z-[3] flex flex-col justify-between py-2 pl-1">
            {right.map((f, i) => (
              <FeatureCard
                key={f.title}
                feature={f}
                delayMs={i * 110 + 55}
                cardRef={(el) => {
                  rightCardRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>

        <svg
          className="pointer-events-none absolute inset-0 z-[4] h-full w-full overflow-visible"
          viewBox={`0 0 ${hub.w || 720} ${hub.h || 480}`}
          fill="none"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          {/* Orbits — slow counter-rotation */}
          <g className="sec-hub-orbit sec-hub-orbit--slow" style={orbitOrigin}>
            <circle
              cx={hub.cx}
              cy={hub.cy}
              r={RING_R + 50}
              className="sec-hub-ring-faint"
              strokeDasharray="2 9"
            />
          </g>
          <g
            className="sec-hub-orbit sec-hub-orbit--reverse"
            style={orbitOrigin}
          >
            <circle
              cx={hub.cx}
              cy={hub.cy}
              r={RING_R + 30}
              className="sec-hub-ring-dotted"
              strokeDasharray="1.6 6.5"
            />
          </g>
          <circle
            cx={hub.cx}
            cy={hub.cy}
            r={RING_R}
            className="sec-hub-ring-solid"
          />

          {connectors.length === 6 && (
            <>
              <path
                d={`M ${connectors[0].ring.x} ${connectors[0].ring.y} A ${RING_R} ${RING_R} 0 0 1 ${connectors[1].ring.x} ${connectors[1].ring.y}`}
                className="sec-hub-arc"
              />
              <path
                d={`M ${connectors[1].ring.x} ${connectors[1].ring.y} A ${RING_R} ${RING_R} 0 0 1 ${connectors[2].ring.x} ${connectors[2].ring.y}`}
                className="sec-hub-arc"
              />
              <path
                d={`M ${connectors[3].ring.x} ${connectors[3].ring.y} A ${RING_R} ${RING_R} 0 0 0 ${connectors[4].ring.x} ${connectors[4].ring.y}`}
                className="sec-hub-arc"
              />
              <path
                d={`M ${connectors[4].ring.x} ${connectors[4].ring.y} A ${RING_R} ${RING_R} 0 0 0 ${connectors[5].ring.x} ${connectors[5].ring.y}`}
                className="sec-hub-arc"
              />
            </>
          )}

          {connectors.map((c, i) => {
            const d =
              c.c1 && c.c2
                ? `M ${c.ring.x} ${c.ring.y} C ${c.c1.x} ${c.c1.y} ${c.c2.x} ${c.c2.y} ${c.card.x} ${c.card.y}`
                : `M ${c.ring.x} ${c.ring.y} L ${c.card.x} ${c.card.y}`;
            const pathId = `sec-conn-${uid}-${i}`;

            return (
              <g key={i}>
                <path
                  id={pathId}
                  d={d}
                  className="sec-hub-line"
                  pathLength={1}
                  style={{ transitionDelay: `${0.25 + i * 0.1}s` }}
                />

                {/* Data pulse traveling hub → card */}
                {showPulses ? (
                  <circle r="2.1" className="sec-hub-pulse">
                    <animateMotion
                      dur="3.2s"
                      begin={`${i * 0.5}s`}
                      repeatCount="indefinite"
                      keyPoints="0;1"
                      keyTimes="0;1"
                      calcMode="spline"
                      keySplines="0.4 0 0.6 1"
                    >
                      <mpath href={`#${pathId}`} />
                    </animateMotion>
                  </circle>
                ) : null}

                <circle
                  cx={c.ring.x}
                  cy={c.ring.y}
                  r="8"
                  className="sec-hub-node-halo"
                />
                <circle
                  cx={c.ring.x}
                  cy={c.ring.y}
                  r="3.5"
                  className="sec-hub-node-solid"
                />
                <circle
                  cx={c.card.x}
                  cy={c.card.y}
                  r="7.5"
                  className="sec-hub-node-halo"
                />
                <circle
                  cx={c.card.x}
                  cy={c.card.y}
                  r="4.4"
                  className="sec-hub-node-hollow"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Mobile: hub + stacked cards */}
      <div className="flex flex-col items-center gap-8 sm:hidden">
        <SecurityHexCore />
        <ul className="m-0 grid w-full list-none gap-3 p-0">
          {FEATURES.map((f, i) => (
            <li key={f.title}>
              <FeatureCard feature={f} delayMs={i * 90} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  delayMs = 0,
  cardRef,
}: {
  feature: Feature;
  delayMs?: number;
  cardRef?: (el: HTMLElement | null) => void;
}) {
  const { title, body, Icon, iconClass, chipClass } = feature;

  return (
    <article
      ref={cardRef}
      className="sec-card group relative flex items-start gap-3 rounded-lg border border-border-subtle/80 bg-surface-card/90 px-3.5 py-3 shadow-card backdrop-blur-[2px] transition-colors duration-fast ease-sv hover:border-brand-primary/35 hover:bg-surface-card"
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      <span
        className={[
          "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-transform duration-fast ease-sv group-hover:scale-105",
          chipClass,
          iconClass,
        ].join(" ")}
      >
        <Icon
          className="h-[15px] w-[15px]"
          strokeWidth={1.85}
          aria-hidden="true"
        />
      </span>
      <div className="min-w-0">
        <h3 className="m-0 text-[13px] font-semibold tracking-tight text-text-primary">
          {title}
        </h3>
        <p className="mt-1 m-0 text-[12px] leading-relaxed text-text-secondary">
          {body}
        </p>
      </div>
    </article>
  );
}

/** Layered hex prism + Secrela S mark in the center. */
function SecurityHexCore() {
  return (
    <div className="sec-hex relative grid h-[132px] w-[132px] place-items-center md:h-[148px] md:w-[148px]">
      <span
        className="sec-hex-glow pointer-events-none absolute inset-[-18%] rounded-full"
        aria-hidden="true"
      />

      <div className="sec-hex-float relative z-[1] h-full w-full">
        <svg
          className="h-full w-full drop-shadow-[0_0_22px_rgb(25_224_111_/_0.35)]"
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden="true"
        >
          {/* Base platform layers */}
          <path
            d="M60 98 L28 82 V68 L60 84 L92 68 V82 L60 98Z"
            fill="#071018"
            stroke="#19E06F"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <path
            d="M60 90 L34 76 V66 L60 80 L86 66 V76 L60 90Z"
            fill="#0A1620"
            stroke="#19E06F"
            strokeOpacity="0.45"
            strokeWidth="1"
          />

          {/* Glass hex body */}
          <path
            d="M60 18 L92 36 V68 L60 86 L28 68 V36 L60 18Z"
            fill="url(#secHexFill)"
            stroke="#19E06F"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M60 18 L92 36 V42 L60 24 L28 42 V36 L60 18Z"
            fill="rgb(25 224 111 / 0.18)"
          />
          <path
            d="M60 24 L88 40 V64 L60 80 L32 64 V40 L60 24Z"
            stroke="#19E06F"
            strokeOpacity="0.35"
            strokeWidth="1"
            strokeLinejoin="round"
          />

          <defs>
            <linearGradient
              id="secHexFill"
              x1="60"
              y1="18"
              x2="60"
              y2="86"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#123524" stopOpacity="0.85" />
              <stop offset="0.55" stopColor="#0A1A14" stopOpacity="0.92" />
              <stop offset="1" stopColor="#071018" stopOpacity="0.98" />
            </linearGradient>
          </defs>
        </svg>

        {/* Brand S mark (logo) centered in the hex */}
        <div className="pointer-events-none absolute inset-0 z-[2] grid place-items-center pb-2">
          <SecureVaultLogo size={58} decorative state="idle" />
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
