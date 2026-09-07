"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { LandingFooter } from "../landing/LandingFooter";
import { LandingHeader } from "../landing/LandingHeader";
import { APP_NAME } from "../../lib/brand";
import { LANDING_PRICING, registerPath } from "../../lib/routes";

const PILLARS = [
  {
    id: "store",
    title: "Store secrets safely",
    body: "Passwords, API keys, and credentials in one workspace — encrypted, not scattered in chat.",
    icon: KeyRound,
  },
  {
    id: "control",
    title: "Control who sees what",
    body: "Roles, invites, and reveal paths so only the right people get access — and you can revoke it.",
    icon: ShieldCheck,
  },
  {
    id: "trace",
    title: "Know what happened",
    body: "Audit history for reveals and changes. Answer who accessed a secret, and when.",
    icon: EyeOff,
  },
] as const;

/**
 * About — brand + product promise only. No filler.
 */
export function AboutPage() {
  const [activeId, setActiveId] = useState<(typeof PILLARS)[number]["id"]>(
    "store",
  );
  const active = PILLARS.find((p) => p.id === activeId) ?? PILLARS[0];
  const Icon = active.icon;

  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgb(34 211 90 / 0.12), transparent 55%), radial-gradient(ellipse 40% 30% at 90% 30%, rgb(34 211 90 / 0.05), transparent 50%), linear-gradient(180deg, var(--color-background-primary), var(--color-background-secondary))",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[55vh] opacity-40 hero-protection-rings"
        aria-hidden
      />
      <LandingHeader />

      <div className="relative z-[1] mx-auto w-full max-w-[920px] px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
        <section className="animate-sv-rise text-center">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-brand-primary uppercase">
            About
          </p>
          <h1 className="mt-4 text-[clamp(2.6rem,8vw,4rem)] font-bold leading-[0.95] tracking-[-0.045em] text-text-primary">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-[34ch] text-[clamp(1.05rem,2.5vw,1.25rem)] font-medium leading-snug text-text-secondary">
            Company secrets under control — for teams, not personal password
            apps.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={registerPath("free")}
              className="btn-shine inline-flex h-11 items-center gap-2 rounded-sm bg-brand-primary px-5 text-sm font-semibold text-brand-on-primary no-underline shadow-glow-green hover:bg-brand-primary-hover"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href={LANDING_PRICING}
              className="inline-flex h-11 items-center rounded-sm border border-border-default px-5 text-sm font-medium text-text-primary no-underline hover:border-brand-primary/45 hover:text-brand-primary"
            >
              Pricing
            </Link>
          </div>
        </section>

        <section className="animate-sv-rise mt-16 sm:mt-20">
          <p className="text-center text-[12px] font-semibold tracking-[0.12em] text-text-muted uppercase">
            What you get
          </p>

          <div
            role="tablist"
            aria-label="Product pillars"
            className="mt-5 grid gap-2 sm:grid-cols-3"
          >
            {PILLARS.map((item) => {
              const selected = item.id === activeId;
              const ItemIcon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(item.id)}
                  onMouseEnter={() => setActiveId(item.id)}
                  className={`rounded-sm border px-4 py-4 text-left transition-all duration-fast ease-sv ${
                    selected
                      ? "border-brand-primary/50 bg-brand-primary/10"
                      : "border-border-subtle bg-surface-card/40 hover:border-border-default"
                  }`}
                >
                  <ItemIcon
                    className={`h-5 w-5 ${
                      selected ? "text-brand-primary" : "text-text-muted"
                    }`}
                    aria-hidden
                  />
                  <span className="mt-3 block text-[14px] font-semibold text-text-primary">
                    {item.title}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            key={active.id}
            role="tabpanel"
            className="animate-sv-rise mt-3 flex items-start gap-4 rounded-sm border border-border-subtle bg-surface-card/75 px-5 py-5 sm:px-6"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-primary/12 text-brand-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-[1.05rem] font-bold text-text-primary">
                {active.title}
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">
                {active.body}
              </p>
            </div>
          </div>
        </section>

        <section className="animate-sv-rise mt-16 border-t border-border-subtle/70 pt-10 text-center">
          <p className="text-[14px] text-text-secondary">
            Questions?{" "}
            <a
              href="mailto:sales@secrela.com"
              className="font-medium text-brand-primary no-underline hover:underline"
            >
              sales@secrela.com
            </a>
          </p>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
}
