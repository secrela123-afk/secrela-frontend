"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Code2,
  Lock,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { LandingFooter } from "../landing/LandingFooter";
import { LandingHeader } from "../landing/LandingHeader";
import { APP_NAME } from "../../lib/brand";
import { LANDING_PRICING, registerPath } from "../../lib/routes";
import {
  PRIVACY_PATH,
  REFUND_PATH,
  TERMS_PATH,
} from "../../lib/legal-paths";

const PRINCIPLES = [
  {
    id: "breach",
    title: "Assume breach",
    short: "One failed layer must not expose everything.",
    body: "No hosted system can honestly claim it is impossible to compromise. We design so that a single failure does not automatically unlock every secret in the workspace.",
    icon: Shield,
  },
  {
    id: "minimize",
    title: "Minimize exposure",
    short: "Reveal only when authorized — then stop.",
    body: "Reveal, copy, and decrypt only when authorized, and only for as long as needed. Access should expire. Secrets stay out of logs, URLs, and analytics.",
    icon: Lock,
  },
  {
    id: "control",
    title: "Control every access",
    short: "Always answer who, what, and when.",
    body: "Who can see a vault, who can reveal a secret, who approved the request, and when it happened should always be answerable — in roles, requests, and audit history.",
    icon: Sparkles,
  },
] as const;

const AUDIENCES = [
  {
    id: "founders",
    title: "Founders & small teams",
    icon: Building2,
    points: [
      "One workspace instead of chat dumps and personal managers",
      "Invite teammates without sharing Owner credentials",
      "Trial first, then Starter when you need paid controls",
    ],
  },
  {
    id: "engineering",
    title: "Engineering & DevOps",
    icon: Code2,
    points: [
      "Environment secrets with clear ownership",
      "Reveal and copy paths that leave a trail",
      "Roles that match how your team actually ships",
    ],
  },
  {
    id: "security",
    title: "Security & leadership",
    icon: Users,
    points: [
      "Access requests and approvals, not tribal knowledge",
      "Audit history you can defend in a review",
      "Security Center tied to real controls — not a vanity score",
    ],
  },
] as const;

/**
 * About — interactive product story, not a brochure essay.
 */
export function AboutPage() {
  const [principleId, setPrincipleId] = useState<
    (typeof PRINCIPLES)[number]["id"]
  >("breach");
  const [audienceId, setAudienceId] = useState<(typeof AUDIENCES)[number]["id"]>(
    "founders",
  );

  const principle =
    PRINCIPLES.find((p) => p.id === principleId) ?? PRINCIPLES[0];
  const audience = AUDIENCES.find((a) => a.id === audienceId) ?? AUDIENCES[0];
  const PrincipleIcon = principle.icon;
  const AudienceIcon = audience.icon;

  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 65% 45% at 15% 8%, rgb(34 211 90 / 0.1), transparent 55%), radial-gradient(ellipse 45% 35% at 88% 20%, rgb(34 211 90 / 0.05), transparent 50%), linear-gradient(180deg, var(--color-background-primary), var(--color-background-secondary))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[70vh] opacity-[0.35] hero-protection-rings"
        aria-hidden
      />
      <LandingHeader />

      <div className="relative z-[1]">
        <section className="mx-auto w-full max-w-[1120px] px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20">
          <p className="animate-sv-rise inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgb(34_211_90_/_0.9)]" />
            About {APP_NAME}
          </p>
          <h1 className="animate-sv-rise mt-4 max-w-[14ch] text-[clamp(2.35rem,6vw,3.6rem)] font-bold leading-[1.05] tracking-[-0.04em] text-text-primary">
            {APP_NAME}
          </h1>
          <p className="animate-sv-rise mt-2 text-[clamp(1.15rem,2.4vw,1.55rem)] font-semibold tracking-tight text-text-secondary">
            Company secrets, under control.
          </p>
          <p className="animate-sv-rise mt-5 max-w-[52ch] text-[15px] leading-relaxed text-text-secondary">
            A secure workspace for the credentials companies actually run on —
            with access control and security intelligence, not a personal
            password manager wearing a dashboard.
          </p>

          <div className="animate-sv-rise mt-8 flex flex-wrap gap-3">
            <Link
              href={registerPath("free")}
              className="btn-shine inline-flex h-11 items-center gap-2 rounded-sm bg-brand-primary px-5 text-sm font-semibold text-brand-on-primary no-underline shadow-glow-green transition-colors hover:bg-brand-primary-hover"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={LANDING_PRICING}
              className="inline-flex h-11 items-center rounded-sm border border-border-default px-5 text-sm font-medium text-text-primary no-underline transition-colors hover:border-brand-primary/45 hover:text-brand-primary"
            >
              View pricing
            </Link>
          </div>

          <dl className="animate-sv-rise mt-12 grid gap-px overflow-hidden rounded-sm border border-border-subtle bg-border-subtle sm:grid-cols-3">
            {[
              { label: "Built for", value: "Teams" },
              { label: "Model", value: "Assume breach" },
              { label: "Checkout", value: "Lemon Squeezy" },
            ].map((item) => (
              <div
                key={item.label}
                className="bg-surface-card/90 px-5 py-4 transition-colors hover:bg-surface-elevated"
              >
                <dt className="text-[11px] font-semibold tracking-[0.1em] text-text-muted uppercase">
                  {item.label}
                </dt>
                <dd className="mt-1 text-[15px] font-semibold text-text-primary">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y border-border-subtle/80 bg-background-secondary/35">
          <div className="mx-auto grid w-full max-w-[1120px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12 lg:py-16">
            <div>
              <h2 className="text-[clamp(1.4rem,2.5vw,1.85rem)] font-bold tracking-tight text-text-primary">
                How we think about security
              </h2>
              <p className="mt-3 max-w-[40ch] text-[14px] leading-relaxed text-text-secondary">
                Select a principle. We keep the claims honest — no absolute
                guarantees, just layered control.
              </p>
              <div
                role="tablist"
                aria-label="Security principles"
                className="mt-7 flex flex-col gap-2"
              >
                {PRINCIPLES.map((item) => {
                  const selected = item.id === principleId;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setPrincipleId(item.id)}
                      className={`flex items-start gap-3 rounded-sm border px-3.5 py-3 text-left transition-colors duration-fast ease-sv ${
                        selected
                          ? "border-brand-primary/50 bg-brand-primary/10"
                          : "border-border-subtle bg-surface-card/50 hover:border-border-default"
                      }`}
                    >
                      <span
                        className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${
                          selected
                            ? "bg-brand-primary/20 text-brand-primary"
                            : "bg-surface-elevated text-text-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-text-primary">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-text-muted">
                          {item.short}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              role="tabpanel"
              key={principle.id}
              className="animate-sv-rise flex min-h-[240px] flex-col justify-center rounded-sm border border-border-subtle bg-surface-card/80 p-6 sm:p-8"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-brand-primary/35 bg-brand-primary/10 text-brand-primary">
                <PrincipleIcon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-5 text-[1.35rem] font-bold tracking-tight text-text-primary">
                {principle.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-pretty text-text-secondary">
                {principle.body}
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1120px] px-4 py-14 sm:px-6 sm:py-16">
          <h2 className="text-[clamp(1.4rem,2.5vw,1.85rem)] font-bold tracking-tight text-text-primary">
            Who it is for
          </h2>
          <p className="mt-3 max-w-[48ch] text-[14px] text-text-secondary">
            Pick a role. Same product — different reasons to adopt it.
          </p>

          <div
            role="tablist"
            aria-label="Audience"
            className="mt-7 flex flex-wrap gap-2"
          >
            {AUDIENCES.map((item) => {
              const selected = item.id === audienceId;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setAudienceId(item.id)}
                  className={`inline-flex items-center gap-2 rounded-sm border px-3.5 py-2 text-[13px] font-medium transition-colors duration-fast ease-sv ${
                    selected
                      ? "border-brand-primary bg-brand-primary/12 text-brand-primary"
                      : "border-border-default text-text-secondary hover:border-brand-primary/40 hover:text-text-primary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {item.title}
                </button>
              );
            })}
          </div>

          <div
            role="tabpanel"
            key={audience.id}
            className="animate-sv-rise mt-6 grid gap-6 rounded-sm border border-border-subtle bg-surface-card/70 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-7"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-sm border border-brand-primary/30 bg-brand-primary/10 text-brand-primary">
              <AudienceIcon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h3 className="text-[1.15rem] font-bold text-text-primary">
                {audience.title}
              </h3>
              <ul className="mt-4 list-none space-y-3 p-0">
                {audience.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-2.5 text-[14px] leading-snug text-text-secondary"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary"
                      aria-hidden
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="border-t border-border-subtle/80">
          <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6 px-4 py-14 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-16">
            <div>
              <h2 className="text-[clamp(1.35rem,2.4vw,1.75rem)] font-bold tracking-tight text-text-primary">
                Put secrets in one controlled place
              </h2>
              <p className="mt-2 max-w-[42ch] text-[14px] text-text-secondary">
                Start a trial, compare plans, or read the policies that govern
                billing and data.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-[12px]">
                <Link
                  href={TERMS_PATH}
                  className="text-text-muted no-underline hover:text-brand-primary"
                >
                  Terms
                </Link>
                <Link
                  href={PRIVACY_PATH}
                  className="text-text-muted no-underline hover:text-brand-primary"
                >
                  Privacy
                </Link>
                <Link
                  href={REFUND_PATH}
                  className="text-text-muted no-underline hover:text-brand-primary"
                >
                  Refunds
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={registerPath("free")}
                className="btn-shine inline-flex h-11 items-center rounded-sm bg-brand-primary px-5 text-sm font-semibold text-brand-on-primary no-underline shadow-glow-green hover:bg-brand-primary-hover"
              >
                Start free trial
              </Link>
              <a
                href="mailto:sales@secrela.com"
                className="inline-flex h-11 items-center rounded-sm border border-border-default px-5 text-sm font-medium text-text-primary no-underline hover:border-brand-primary/40"
              >
                sales@secrela.com
              </a>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
}
