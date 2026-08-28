"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { landingSection, landingSectionDivider } from "./landing-classes";
import { useLandingSessionQuery } from "../../hooks/queries/useLandingSessionQuery";
import { APP_HOME, LANDING_PRICING, registerPath } from "../../lib/routes";

const TRUST_POINTS = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
] as const;

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9.5 4.5 13 8l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Final CTA — swaps guest vs signed-in actions.
 * Content rises in on scroll; static fallback for reduced motion.
 */
export function LandingFinalCta() {
  const session = useLandingSessionQuery();
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const primary =
    session.status === "authed"
      ? session.hasOrganization
        ? { href: APP_HOME, label: "Open dashboard" }
        : { href: LANDING_PRICING, label: "Choose your plan" }
      : { href: registerPath("free"), label: "Get started free" };

  const subtitle =
    session.status === "authed" && !session.hasOrganization
      ? "Your email is verified. Open your dashboard or choose a paid plan."
      : "Set up your organization, invite your team, and secure your first secret in minutes.";

  const rise = (delay: string) =>
    [
      "transition-all duration-700 ease-out",
      delay,
      active ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0",
    ].join(" ");

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-hidden ${landingSectionDivider} ${landingSection}`}
      aria-labelledby="landing-final-cta-title"
    >
      {/* Top beam under the section border */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-px w-[min(560px,80%)] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -top-6 left-1/2 h-12 w-[min(420px,60%)] -translate-x-1/2 rounded-full bg-brand-primary/15 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_55%,rgb(34_211_90_/_0.14),transparent_65%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgb(34_211_90_/_0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(34_211_90_/_0.12)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_55%_50%_at_50%_60%,black_15%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-2xl px-4 text-center">
        <p
          className={`m-0 inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/5 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-brand-primary uppercase ${rise("delay-0")}`}
        >
          <ShieldCheck className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
          Start securing today
        </p>

        <h2
          id="landing-final-cta-title"
          className={`mt-5 text-[clamp(1.75rem,3.5vw,2.5rem)] font-bold leading-[1.15] tracking-tight text-text-primary ${rise("delay-100")}`}
        >
          Bring every secret under{" "}
          <span className="text-brand-primary">control</span>.
        </h2>
        <p className={`mt-4 text-body text-text-secondary ${rise("delay-200")}`}>
          {subtitle}
        </p>

        <div
          className={`mt-8 flex flex-wrap items-center justify-center gap-3 ${rise("delay-300")}`}
        >
          <Link
            href={primary.href}
            className="btn-shine group inline-flex h-12 items-center gap-2 rounded-sm bg-brand-primary px-5 text-[15px] font-semibold text-brand-on-primary shadow-glow-green transition-all duration-fast ease-sv hover:bg-brand-primary-hover hover:shadow-glow-green-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            {primary.label}
            <ArrowRight className="h-4 w-4 transition-transform duration-fast ease-sv group-hover:translate-x-0.5" />
          </Link>
          {session.status === "authed" && !session.hasOrganization ? (
            <Link
              href={APP_HOME}
              className="inline-flex h-12 items-center justify-center rounded-sm border border-border-default bg-transparent px-5 text-[15px] font-semibold text-text-primary transition-colors duration-fast ease-sv hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
            >
              Skip to dashboard
            </Link>
          ) : (
            <a
              href="mailto:sales@secrela.com"
              className="inline-flex h-12 items-center justify-center rounded-sm border border-border-default bg-background-primary/40 px-5 text-[15px] font-semibold text-text-primary backdrop-blur-[2px] transition-colors duration-fast ease-sv hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
            >
              Book a demo
            </a>
          )}
        </div>

        <ul
          className={`mx-auto mt-7 flex list-none flex-wrap items-center justify-center gap-x-6 gap-y-2 p-0 ${rise("delay-500")}`}
        >
          {TRUST_POINTS.map((point) => (
            <li
              key={point}
              className="inline-flex items-center gap-1.5 text-[12.5px] text-text-muted"
            >
              <Check
                className="h-3.5 w-3.5 text-brand-primary"
                strokeWidth={2.4}
                aria-hidden="true"
              />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
