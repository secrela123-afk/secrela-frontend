"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const STEPS = [
  {
    num: "01",
    title: "Request access",
    description: "User requests access to a secret.",
    Icon: IconRequest,
  },
  {
    num: "02",
    title: "Policy check",
    description: "We verify policy, role, and context.",
    Icon: IconPolicy,
  },
  {
    num: "03",
    title: "Approval",
    description: "Owner or admin approves the request.",
    Icon: IconApproval,
  },
  {
    num: "04",
    title: "Temporary access",
    description: "Access is granted for a limited time.",
    Icon: IconTemporary,
  },
  {
    num: "05",
    title: "Reveal secret",
    description: "Secret is revealed securely.",
    Icon: IconReveal,
  },
  {
    num: "06",
    title: "Automatic expiry",
    description: "Access expires automatically.",
    Icon: IconExpiry,
  },
  {
    num: "07",
    title: "Audit event",
    description: "Everything is logged. Nothing is missed.",
    Icon: IconAudit,
  },
] as const;

/**
 * Section 4 — controlled access flow (7 steps + live access record).
 * Layout and copy from design reference; animated connector line.
 */
export function LandingAccessControl() {
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
      { threshold: 0.22 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={rootRef}
      id="access-control"
      data-active={active ? "true" : "false"}
      className="access-flow scroll-mt-24 border-t border-border-subtle/80 py-14 sm:py-16"
      aria-labelledby="landing-access-title"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start lg:gap-8 xl:gap-12">
        {/* Header */}
        <div className="max-w-sm">
          <h2
            id="landing-access-title"
            className="text-[clamp(1.55rem,3vw,2.25rem)] font-semibold leading-[1.12] tracking-tight text-text-primary"
          >
            Access isn&apos;t granted.
            <br />
            <span className="text-brand-primary">It&apos;s controlled.</span>
          </h2>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-text-secondary">
            Every access follows your policies, requires approval, is
            time-bound, and logged.
          </p>
        </div>

        {/* 7-step flow */}
        <div className="relative min-w-0">
          {/* Single rail behind icons — masked by solid step discs */}
          <div
            className="access-flow-rail pointer-events-none absolute top-[27px] right-[calc(100%/14)] left-[calc(100%/14)] z-0 hidden h-[2px] lg:block"
            aria-hidden="true"
          >
            <span className="access-flow-rail-line block h-full w-full" />
            <span className="access-flow-rail-bead" />
          </div>

          <ol className="access-flow-steps relative z-[1] m-0 flex list-none flex-col gap-8 p-0 lg:flex-row lg:items-start lg:justify-between lg:gap-0">
            {STEPS.map(({ num, title, description, Icon }, index) => (
              <li
                key={num}
                className="access-flow-step flex min-w-0 flex-col items-center lg:flex-1 lg:px-0.5 xl:px-1"
                style={{ "--access-step-i": index } as CSSProperties}
              >
                <div className="flex min-h-[54px] w-full items-center justify-center">
                  <span className="access-flow-step-ring grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border border-brand-primary/45 bg-background-primary text-brand-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <span className="access-flow-step-num mt-3 text-center text-[10px] font-semibold tracking-[0.14em] text-brand-primary">
                  {num}
                </span>
                <span className="mt-1 text-center text-[11px] font-semibold leading-snug text-brand-primary sm:text-xs">
                  {title}
                </span>
                <p className="access-flow-step-desc m-0 mt-1 max-w-[9.5rem] text-center text-[10px] leading-snug text-text-muted sm:text-[11px]">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Access record card */}
      <article
        id="access-record"
        className="access-flow-record mt-10 rounded-lg border border-border-subtle bg-surface-card/75 px-4 py-4 backdrop-blur-[2px] sm:px-5 sm:py-5"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(0,1fr))_auto] lg:items-center lg:gap-5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary">
              Production DB Password
            </div>
            <div className="mt-0.5 text-[11px] text-text-muted">Secret</div>
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Requested by
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Ahmed Samy</span>
              , Developer
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Duration
            </div>
            <div className="mt-1 text-sm font-medium text-text-primary">
              1 hour
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Approved by
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              <span className="font-semibold text-text-primary">Admin</span>, May
              12, 10:30 AM
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-text-muted">
              Expires
            </div>
            <div className="mt-1 text-sm font-medium text-text-primary">
              11:30 AM{" "}
              <span className="font-normal text-text-muted">(Auto)</span>
            </div>
          </div>

          <div className="flex sm:col-span-2 sm:justify-start lg:col-span-1 lg:justify-end">
            <span className="access-flow-granted inline-flex items-center rounded-sm border border-brand-primary/45 bg-brand-primary/10 px-3 py-1.5 text-xs font-semibold text-brand-primary">
              Access granted
            </span>
          </div>
        </div>
      </article>
    </section>
  );
}

function IconRequest({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Paper plane / send message */}
      <path
        d="M4.5 11.5 19.5 5 12.5 19 10.5 13.5 4.5 11.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 13.5 19.5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPolicy({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 18.5 6.5v5.6c0 4.4-2.9 8.1-6.5 9.9-3.6-1.8-6.5-5.5-6.5-9.9V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12.2 11.1 14.1 15 10.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconApproval({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M8.5 12.2 10.9 14.6 15.8 9.7"
        stroke="currentColor"
        strokeWidth="1.85"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconTemporary({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 8.2v4.2l2.8 1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 5.8h5.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconReveal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.2 12.4c2.1-3.6 4.9-5.4 8.8-5.4s6.7 1.8 8.8 5.4c-2.1 3.6-4.9 5.4-8.8 5.4s-6.7-1.8-8.8-5.4Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12.4" r="2.35" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function IconExpiry({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8.2 6.2V5a3.8 3.8 0 1 1 7.6 0v1.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect
        x="6.5"
        y="6.2"
        width="11"
        height="12.5"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M12 10v3.6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M15.2 17.8 17.5 20"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconAudit({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.5h5.8L17 7.2V19.5H8V4.5Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 4.5V7.2H17"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 11.5h5M10.5 14.5h5M10.5 17.5h3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
