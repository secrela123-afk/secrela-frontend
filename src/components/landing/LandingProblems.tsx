"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { landingSection } from "./landing-classes";
import { ProblemsHubBridge } from "./ProblemsHubBridge";

const LEFT = [
  { label: ".env files", Icon: IconEnv },
  { label: "Slack", Icon: IconSlack },
  { label: "Spreadsheets", Icon: IconSheet },
  { label: "Shared creds", Icon: IconPeople },
] as const;

const RIGHT = [
  { label: "Centralized vaults", Icon: IconVault },
  { label: "Controlled access", Icon: IconAccess },
  { label: "Full visibility", Icon: IconEye },
  { label: "Audit everything", Icon: IconAudit },
] as const;

const cardBase =
  "problems-card flex h-full w-full flex-col items-center justify-center gap-3 rounded-md border px-2 py-4 backdrop-blur-[6px] lg:px-3 lg:py-5";

const cardDanger = `${cardBase} problems-card--danger border-border-subtle/60 bg-surface-card/30`;

const cardSafe = `${cardBase} problems-card--safe border-border-subtle/60 bg-surface-card/30`;

const iconRingBase =
  "grid h-11 w-11 place-items-center rounded-full border backdrop-blur-[2px] lg:h-12 lg:w-12";

const iconRingDanger = `${iconRingBase} border-danger/30 bg-danger/10 text-text-secondary shadow-[0_0_16px_rgb(255_77_77_/_0.14)]`;

const iconRingSafe = `${iconRingBase} border-brand-primary/35 bg-brand-primary/12 text-brand-primary shadow-[0_0_16px_rgb(25_224_111_/_0.22)]`;

function FeatureCard({
  label,
  Icon,
  tone,
  delayMs = 0,
}: {
  label: string;
  Icon: (props: { className?: string }) => ReactNode;
  tone: "danger" | "safe";
  delayMs?: number;
}) {
  return (
    <div
      className={tone === "danger" ? cardDanger : cardSafe}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className={tone === "danger" ? iconRingDanger : iconRingSafe}
        aria-hidden="true"
      >
        <Icon className="h-[22px] w-[22px]" />
      </span>
      <span className="text-center text-[11px] font-medium leading-snug text-text-secondary lg:text-xs">
        {label}
      </span>
    </div>
  );
}

/**
 * Scattered chaos → live spider hub → controlled state.
 */
export function LandingProblems() {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
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
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      id="problems"
      data-active={active ? "true" : "false"}
      className={`problems-flow ${landingSection}`}
      aria-labelledby="landing-problems-title"
    >
      <h2
        id="landing-problems-title"
        className="text-[clamp(1.45rem,3vw,2.15rem)] font-semibold leading-tight tracking-tight text-text-primary"
      >
        Your secrets are everywhere.{" "}
        <span className="text-brand-primary">Your control isn&apos;t.</span>
      </h2>

      <div className="relative mt-12 hidden md:block">
        {/* Row 1: cards + hub only (same height) so lines sit beside cards */}
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(168px,200px)_minmax(0,1fr)] items-stretch gap-0">
          <ul className="relative z-[3] m-0 grid list-none grid-cols-4 gap-2.5 p-0 lg:gap-3.5">
            {LEFT.map(({ label, Icon }, i) => (
              <li key={label} className="flex min-h-0 flex-col">
                <FeatureCard
                  label={label}
                  Icon={Icon}
                  tone="danger"
                  delayMs={i * 90}
                />
              </li>
            ))}
          </ul>

          <div className="relative z-[2] min-h-0 self-stretch">
            <ProblemsHubBridge active={active} />
          </div>

          <ul className="relative z-[3] m-0 grid list-none grid-cols-4 gap-2.5 p-0 lg:gap-3.5">
            {RIGHT.map(({ label, Icon }, i) => (
              <li key={label} className="flex min-h-0 flex-col">
                <FeatureCard
                  label={label}
                  Icon={Icon}
                  tone="safe"
                  delayMs={180 + i * 90}
                />
              </li>
            ))}
          </ul>
        </div>

        {/* Row 2: rails + captions under each card group only */}
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_minmax(168px,200px)_minmax(0,1fr)] gap-0 lg:mt-6">
          <div>
            <div className="relative px-3 lg:px-5" aria-hidden="true">
              <div className="problems-rail problems-rail--danger absolute inset-x-3 top-1/2 h-px -translate-y-1/2 lg:inset-x-5" />
              <div className="relative flex justify-between">
                {LEFT.map(({ label }) => (
                  <span
                    key={`dn-${label}`}
                    className="problems-node problems-node--danger relative z-[1] block h-2.5 w-2.5 rounded-full"
                  />
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] font-semibold tracking-[0.06em] text-danger lg:text-xs">
              Scattered&nbsp;&nbsp;•&nbsp;&nbsp;Exposed&nbsp;&nbsp;•&nbsp;&nbsp;Uncontrolled
            </p>
          </div>

          <div aria-hidden="true" />

          <div>
            <div className="relative px-3 lg:px-5" aria-hidden="true">
              <div className="problems-rail problems-rail--safe absolute inset-x-3 top-1/2 h-px -translate-y-1/2 lg:inset-x-5" />
              <div className="relative flex justify-between">
                {RIGHT.map(({ label }) => (
                  <span
                    key={`sn-${label}`}
                    className="problems-node problems-node--safe relative z-[1] block h-2.5 w-2.5 rounded-full"
                  />
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-[11px] font-semibold tracking-[0.06em] text-brand-primary lg:text-xs">
              Centralized&nbsp;&nbsp;•&nbsp;&nbsp;Controlled&nbsp;&nbsp;•&nbsp;&nbsp;Auditable
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-8 md:hidden">
        <div>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
            {LEFT.map(({ label, Icon }) => (
              <li key={label}>
                <FeatureCard label={label} Icon={Icon} tone="danger" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] font-semibold text-danger">
            Scattered • Exposed • Uncontrolled
          </p>
        </div>

        <div className="px-2">
          <ProblemsHubBridge active={active} />
        </div>

        <div>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
            {RIGHT.map(({ label, Icon }) => (
              <li key={label}>
                <FeatureCard label={label} Icon={Icon} tone="safe" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-[11px] font-semibold text-brand-primary">
            Centralized • Controlled • Auditable
          </p>
        </div>
      </div>
    </section>
  );
}

function IconEnv({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSlack({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#E01E5A"
        d="M8.2 14.5a1.7 1.7 0 1 1-1.7-1.7h1.7v1.7Zm.9 0a1.7 1.7 0 1 1 3.4 0v4.2a1.7 1.7 0 1 1-3.4 0v-4.2Z"
      />
      <path
        fill="#36C5F0"
        d="M9.5 8.2a1.7 1.7 0 1 1 1.7-1.7v1.7H9.5Zm0 .9a1.7 1.7 0 1 1 0 3.4H5.3a1.7 1.7 0 1 1 0-3.4h4.2Z"
      />
      <path
        fill="#2EB67D"
        d="M15.8 9.5a1.7 1.7 0 1 1 1.7 1.7h-1.7V9.5Zm-.9 0a1.7 1.7 0 1 1-3.4 0V5.3a1.7 1.7 0 1 1 3.4 0v4.2Z"
      />
      <path
        fill="#ECB22E"
        d="M14.5 15.8a1.7 1.7 0 1 1-1.7 1.7v-1.7h1.7Zm0-.9a1.7 1.7 0 1 1 0-3.4h4.2a1.7 1.7 0 1 1 0 3.4h-4.2Z"
      />
    </svg>
  );
}

function IconSheet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 10h16M4 15h16M10 4v16M15 4v16" stroke="currentColor" strokeWidth="1.2" opacity="0.85" />
    </svg>
  );
}

function IconPeople({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4.8 17.5c.7-2.2 2.4-3.3 4.2-3.3s3.5 1.1 4.2 3.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 14.8c1.4 0 2.8.7 3.5 2.3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconVault({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 19 6.5v5.2c0 4.2-2.9 7.7-7 9.3-4.1-1.6-7-5.1-7-9.3V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <rect x="9" y="10" width="6" height="5" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10V8.8a1.5 1.5 0 0 1 3 0V10" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconAccess({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6.5 18.5c1-2.6 3-4 5.5-4s4.5 1.4 5.5 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="15.2" y="14.2" width="4.2" height="3.4" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M16.2 14.2v-.8a1.1 1.1 0 0 1 2.2 0v.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 12s3.2-5.8 8.5-5.8S20.5 12 20.5 12s-3.2 5.8-8.5 5.8S3.5 12 3.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconAudit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 4.5h8.5L19 8v11.5A1.5 1.5 0 0 1 17.5 21h-10A1.5 1.5 0 0 1 6 19.5v-13A1.5 1.5 0 0 1 7 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M15 4.8V8h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="14.5" cy="14.5" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16.8 16.8 19 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
