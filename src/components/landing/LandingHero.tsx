"use client";

import Link from "next/link";
import { useLandingSessionQuery } from "../../hooks/queries/useLandingSessionQuery";
import { APP_HOME, LANDING_PRICING, registerPath } from "../../lib/routes";
import { APP_NAME } from "../../lib/brand";
import { HeroVaultScene } from "./HeroVaultScene";
import { HeroProtectionMesh } from "./HeroProtectionMesh";

const btnBase =
  "inline-flex h-12 items-center justify-center gap-2 rounded-sm px-[1.35rem] text-[15px] font-semibold no-underline transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-sv focus-visible:outline-none focus-visible:shadow-focus motion-reduce:transition-none";

const btnPrimary = `${btnBase} btn-shine group bg-brand-primary text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover hover:shadow-glow-green-strong active:translate-y-px motion-reduce:active:translate-y-0`;

const btnSecondary = `${btnBase} border border-border-default bg-transparent text-text-primary hover:border-brand-primary hover:text-brand-primary`;

/**
 * Trust strip — only capabilities that actually exist in the product.
 * No compliance/SLA claims we can't back yet.
 */
const TRUST = [
  {
    title: "AES-256-GCM",
    body: "Secrets encrypted at rest",
    Icon: IconLock,
  },
  {
    title: "MFA & step-up auth",
    body: "Extra checks for reveals",
    Icon: IconShield,
  },
  {
    title: "Role-based access",
    body: "Granular permissions",
    Icon: IconBadge,
  },
  {
    title: "Full audit trail",
    body: "Every access logged",
    Icon: IconPulse,
  },
] as const;

/** Staggered one-time rise (subtle, disabled by prefers-reduced-motion) */
function rise(delayMs: number) {
  return { style: { animationDelay: `${delayMs}ms` } };
}

export function LandingHero() {
  const session = useLandingSessionQuery();

  const primary =
    session.status === "authed"
      ? session.hasOrganization
        ? { href: APP_HOME, label: "Open dashboard" }
        : { href: LANDING_PRICING, label: "Choose your plan" }
      : { href: registerPath("free"), label: "Start securing your secrets" };

  return (
    <section
      className="relative isolate overflow-hidden pb-8 pt-4 lg:min-h-[calc(100vh-72px)] lg:pb-10 lg:pt-6"
      aria-labelledby="landing-hero-title"
    >
      {/* Soft mesh only — no large green rings */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <HeroProtectionMesh />
      </div>

      <div className="relative z-[1] grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)] lg:gap-8 xl:gap-12">
        <div className="flex max-w-xl flex-col justify-center">
          <p
            {...rise(0)}
            className="m-0 inline-flex w-fit items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/5 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-brand-primary uppercase animate-sv-rise"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_8px_rgb(25_224_111_/_0.9)]"
              aria-hidden="true"
            />
            Secrets &amp; access management
          </p>

          <h1
            id="landing-hero-title"
            {...rise(90)}
            className="mt-5 text-[clamp(2.2rem,4.5vw,3.45rem)] font-bold leading-[1.08] tracking-[-0.035em] text-text-primary animate-sv-rise"
          >
            Save your company secrets{" "}
            <span className="text-brand-primary">securely.</span>
          </h1>

          <p
            {...rise(180)}
            className="mt-[1.15rem] max-w-lg text-[1.0625rem] leading-[1.55] text-text-secondary animate-sv-rise"
          >
            {APP_NAME} is your secure command center for passwords, API keys,
            credentials, and sensitive company data — with controlled access,
            temporary permissions, and a complete audit trail.
          </p>

          <div
            {...rise(270)}
            className="mt-7 flex flex-wrap items-center gap-3 animate-sv-rise"
          >
            <Link href={primary.href} className={btnPrimary}>
              {primary.label}
              <ArrowRightIcon />
            </Link>
            <a href="#how-it-works" className={btnSecondary}>
              <PlayIcon />
              See how it works
            </a>
          </div>

          <p
            {...rise(360)}
            className="mt-4 text-[12.5px] text-text-muted animate-sv-rise"
          >
            Free 14-day trial · No credit card required
          </p>
        </div>

        <div className="relative min-w-0">
          <HeroVaultScene />
        </div>
      </div>

      <ul
        {...rise(420)}
        className="relative z-[1] mt-12 grid list-none grid-cols-1 gap-3 p-0 animate-sv-rise sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
      >
        {TRUST.map(({ title, body, Icon }) => (
          <li
            key={title}
            className="flex items-center gap-3 rounded-md border border-border-subtle bg-surface-card/70 px-4 py-3.5 backdrop-blur-[2px] transition-colors duration-fast ease-sv hover:border-brand-primary/30"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-brand-primary/25 bg-brand-primary/10 text-brand-primary">
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold tracking-tight text-text-primary">
                {title}
              </div>
              <p className="m-0 mt-0.5 text-[12px] text-text-muted">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4 transition-transform duration-fast ease-sv group-hover:translate-x-0.5 motion-reduce:transition-none"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 5.8v4.4L10.6 8 7 5.8Z" fill="currentColor" />
    </svg>
  );
}

function IconLock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 11V8.5a4 4 0 0 1 8 0V11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="6"
        y="11"
        width="12"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5 19 6.5v5.2c0 4.2-2.9 7.7-7 9.3-4.1-1.6-7-5.1-7-9.3V6.5L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBadge({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.2 14.2 8l5.3.5-4 3.6 1.2 5.2L12 14.8 7.3 17.3l1.2-5.2-4-3.6L9.8 8 12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPulse({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12h4l2-5 3 10 2-5h7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
