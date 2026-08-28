"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { landingSection } from "./landing-classes";
import {
  Building2,
  CheckCircle2,
  Gem,
  Lock,
  Rocket,
  Star,
} from "lucide-react";
import {
  useLandingSessionQuery,
  type LandingSession,
} from "../../hooks/queries/useLandingSessionQuery";
import {
  APP_HOME,
  LANDING_PRICING,
  ORG_ONBOARDING_PATH,
  checkoutPath,
  registerPath,
  authPathWithNext,
} from "../../lib/routes";

type Billing = "monthly" | "yearly";
type Accent = "green" | "purple";

type Plan = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: string | null;
  yearlyPrice: string | null;
  features: string[];
  guestCta: string;
  guestHref: string;
  featured?: boolean;
  isFree?: boolean;
  isEnterprise?: boolean;
  accent: Accent;
  Icon: (props: { className?: string }) => ReactNode;
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free trial",
    tagline: "For individuals getting started",
    description:
      "All the basics to secure your secrets from day one — 14 days free, no card required.",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    isFree: true,
    accent: "green",
    Icon: ({ className }) => (
      <Rocket className={className} strokeWidth={1.75} aria-hidden="true" />
    ),
    features: [
      "1 User",
      "3 Vaults",
      "100 Secrets",
      "Basic Access Controls",
      "Community Support",
    ],
    guestCta: "Start 14-day free trial",
    guestHref: registerPath("free"),
  },
  {
    id: "starter",
    name: "Starter",
    tagline: "For small teams",
    description:
      "Secure company secrets for small teams — up to 5 members, unlimited vaults, RBAC, and 7-day audit logs.",
    monthlyPrice: "$28",
    yearlyPrice: "$22",
    accent: "green",
    Icon: ({ className }) => (
      <Lock className={className} strokeWidth={1.75} aria-hidden="true" />
    ),
    features: [
      "Up to 5 Users",
      "Unlimited Vaults",
      "Unlimited Secrets",
      "Advanced Access Controls",
      "Custom Roles",
      "Audit Logs (7 days)",
      "Email Support",
    ],
    guestCta: "Subscribe to Starter",
    guestHref: checkoutPath("starter"),
  },
  {
    id: "team",
    name: "Team",
    tagline: "For growing teams",
    description:
      "Advanced security for growing teams — Security Center, integrations, full audit history, and priority support.",
    monthlyPrice: "$36",
    yearlyPrice: "$29",
    featured: true,
    accent: "green",
    Icon: ({ className }) => (
      <Gem className={className} strokeWidth={1.75} aria-hidden="true" />
    ),
    features: [
      "Up to 10 Users",
      "Unlimited Vaults",
      "Unlimited Secrets",
      "Advanced Access Controls",
      "Custom Roles",
      "Full Audit History",
      "Security Center",
      "Integrations",
      "Priority Support",
    ],
    guestCta: "Subscribe to Team",
    guestHref: checkoutPath("team"),
  },
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "For organizations with advanced needs",
    description:
      "Tailored solutions with enterprise-grade security, compliance, and support.",
    monthlyPrice: null,
    yearlyPrice: null,
    isEnterprise: true,
    accent: "purple",
    Icon: ({ className }) => (
      <Building2 className={className} strokeWidth={1.75} aria-hidden="true" />
    ),
    features: [
      "Unlimited Users",
      "Unlimited Vaults & Secrets",
      "Advanced Security Controls",
      "Custom Integrations",
      "Dedicated Support",
      "SLA & Compliance",
      "Onboarding & Training",
    ],
    guestCta: "Contact sales",
    guestHref: "mailto:sales@secrela.com",
  },
];

function planSlugForCheckout(plan: Plan): "starter" | "team" | null {
  if (plan.isFree || plan.isEnterprise) return null;
  if (plan.id === "team") return "team";
  if (plan.id === "starter") return "starter";
  return null;
}

type PlanAction = {
  cta: string;
  href?: string;
  disabled: boolean;
};

function planAction(
  plan: Plan,
  session: LandingSession,
  billing: Billing,
): PlanAction {
  if (plan.isEnterprise) {
    return { href: plan.guestHref, cta: plan.guestCta, disabled: false };
  }

  if (session.status === "loading") {
    return { href: plan.guestHref, cta: plan.guestCta, disabled: false };
  }

  if (plan.isFree) {
    if (session.freeTrialUsed) {
      const onActiveFree =
        session.status === "authed" &&
        session.hasOrganization &&
        session.onFreePlan &&
        !session.subscriptionExpired;
      return {
        cta: onActiveFree ? "Current plan" : "Free trial used",
        disabled: true,
      };
    }

    if (session.status === "guest") {
      return {
        href: registerPath("free"),
        cta: "Start 14-day free trial",
        disabled: false,
      };
    }

    if (!session.hasOrganization) {
      return {
        href: ORG_ONBOARDING_PATH,
        cta: "Create your workspace",
        disabled: false,
      };
    }

    return { href: APP_HOME, cta: "Open dashboard", disabled: false };
  }

  const slug = planSlugForCheckout(plan);
  const checkoutUrl = slug ? checkoutPath(slug, billing) : APP_HOME;

  if (session.status !== "authed") {
    return {
      href: authPathWithNext("/login", { next: checkoutUrl }),
      cta: plan.guestCta,
      disabled: false,
    };
  }

  if (!session.hasOrganization) {
    return {
      href: ORG_ONBOARDING_PATH,
      cta: "Create your workspace",
      disabled: false,
    };
  }

  return {
    href: checkoutUrl,
    cta: plan.guestCta,
    disabled: false,
  };
}

/**
 * Pricing — matches reference: centered title, billing switch,
 * 4 cards with elevated glowing Team card.
 */
export function LandingPricing() {
  const [billing, setBilling] = useState<Billing>("yearly");
  const session = useLandingSessionQuery();

  const subscriptionExpired =
    session.status === "authed" && session.subscriptionExpired;

  return (
    <section
      id="pricing"
      className={`${landingSection} scroll-mt-24`}
      aria-labelledby="landing-pricing-title"
    >
      {/* Heading */}
      <div className="mx-auto max-w-2xl text-center" data-reveal="">
        <h2
          id="landing-pricing-title"
          className="text-[clamp(1.9rem,3.6vw,2.6rem)] font-bold leading-[1.12] tracking-tight text-text-primary"
        >
          Simple pricing.{" "}
          <span className="text-brand-primary">Maximum security.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[0.9375rem] leading-relaxed text-text-secondary">
          Start free, scale as you grow, and unlock enterprise-grade security
          built for modern teams.
        </p>
      </div>

      {/* Billing toggle */}
      <div
        className="mt-7 flex flex-wrap items-center justify-center gap-3"
        data-reveal=""
        style={{ "--reveal-delay": "100ms" } as CSSProperties}
      >
        <span
          className={
            billing === "monthly"
              ? "text-sm font-semibold text-text-primary"
              : "text-sm font-medium text-text-muted"
          }
        >
          Monthly
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={billing === "yearly"}
          aria-label="Toggle yearly billing"
          onClick={() =>
            setBilling((b) => (b === "yearly" ? "monthly" : "yearly"))
          }
          className="relative h-[26px] w-[50px] shrink-0 rounded-full border border-border-subtle bg-background-secondary transition-colors duration-fast ease-sv focus-visible:outline-none focus-visible:shadow-focus"
        >
          <span
            className={
              billing === "yearly"
                ? "absolute top-[2px] left-[26px] h-5 w-5 rounded-full bg-brand-primary shadow-[0_0_12px_rgb(25_224_111_/_0.65)] transition-[left] duration-fast ease-sv"
                : "absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-text-secondary transition-[left] duration-fast ease-sv"
            }
          />
        </button>

        <span
          className={
            billing === "yearly"
              ? "text-sm font-semibold text-text-primary"
              : "text-sm font-medium text-text-muted"
          }
        >
          Yearly
        </span>

        <span className="inline-flex items-center rounded-full bg-brand-primary/12 px-2.5 py-1 text-[11px] font-semibold text-brand-primary">
          Save 20%
        </span>
      </div>

      {session.status === "authed" && !session.hasOrganization ? (
        <p className="mt-4 text-center text-sm text-text-secondary">
          Your account is ready. Open your dashboard or pick a paid plan.
        </p>
      ) : subscriptionExpired ? (
        <p className="mt-4 text-center text-sm text-text-secondary">
          Your free trial has ended. Choose a paid plan to continue.
        </p>
      ) : null}

      {/* Cards */}
      <div className="mt-12 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        {PLANS.map((plan, planIndex) => {
          const action =
            session.status === "loading"
              ? { href: plan.guestHref, cta: plan.guestCta, disabled: false }
              : planAction(plan, session, billing);

          const isCustom = plan.monthlyPrice === null;
          const showDeal = billing === "yearly" && !isCustom && !plan.isFree;
          const priceLabel = isCustom
            ? "Custom"
            : billing === "yearly"
              ? plan.yearlyPrice
              : plan.monthlyPrice;

          const green = plan.accent === "green";
          const checkClass = green ? "text-brand-primary" : "text-purple";
          const iconWrap = green
            ? "border-brand-primary/45 bg-brand-primary/10 text-brand-primary"
            : "border-purple/45 bg-purple/10 text-purple";

          return (
            <article
              key={plan.id}
              data-reveal=""
              style={
                { "--reveal-delay": `${180 + planIndex * 110}ms` } as CSSProperties
              }
              className={
                plan.featured
                  ? "relative flex flex-col overflow-hidden rounded-2xl border border-brand-primary bg-surface-card p-5 shadow-[0_0_0_1px_rgb(25_224_111_/_0.35),0_0_45px_rgb(25_224_111_/_0.28)] sm:p-6 xl:-my-5 xl:py-9"
                  : "relative flex flex-col rounded-2xl border border-border-subtle bg-surface-card p-5 shadow-card sm:p-6"
              }
            >
              {plan.featured ? (
                <>
                  {/* Hex pattern behind header */}
                  <svg
                    className="pointer-events-none absolute top-0 right-0 h-36 w-44 opacity-[0.16]"
                    viewBox="0 0 176 144"
                    fill="none"
                    aria-hidden="true"
                  >
                    {[0, 1, 2, 3].map((row) =>
                      [0, 1, 2, 3, 4].map((col) => {
                        const x = col * 34 + (row % 2 === 0 ? 0 : 17);
                        const y = row * 30;
                        return (
                          <path
                            key={`${row}-${col}`}
                            d={`M${x + 17} ${y} l14 8v16l-14 8-14-8V${y + 8}Z`}
                            stroke="#19E06F"
                            strokeWidth="1"
                          />
                        );
                      }),
                    )}
                  </svg>

                  <span className="absolute top-4 right-4 z-[1] inline-flex items-center gap-1.5 rounded-full border border-brand-primary/55 bg-background-primary/80 px-3 py-1 text-[11px] font-semibold text-brand-primary">
                    <Star
                      className="h-3 w-3 fill-brand-primary text-brand-primary"
                      strokeWidth={0}
                      aria-hidden="true"
                    />
                    Most popular
                  </span>
                </>
              ) : null}

              <div className="relative z-[1] flex flex-1 flex-col">
                {/* Header: icon + name + tagline */}
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg border ${iconWrap}`}
                  >
                    <plan.Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3
                      className={
                        plan.featured
                          ? "text-[1.25rem] font-bold tracking-tight text-text-primary"
                          : "text-[1.05rem] font-bold tracking-tight text-text-primary"
                      }
                    >
                      {plan.name}
                    </h3>
                    <p className="mt-0.5 text-[12px] leading-snug text-text-muted">
                      {plan.tagline}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-6 flex items-baseline gap-1.5">
                  <span
                    className={
                      plan.featured
                        ? "text-[2.6rem] leading-none font-bold tracking-tight text-text-primary"
                        : "text-[2.1rem] leading-none font-bold tracking-tight text-text-primary"
                    }
                  >
                    {priceLabel}
                  </span>
                  {!isCustom ? (
                    <span className="text-sm text-text-muted">/month</span>
                  ) : null}
                </div>

                {showDeal ? (
                  <p className="mt-2 flex items-center gap-2.5 text-[13px]">
                    <span className="text-text-muted line-through">
                      {plan.monthlyPrice}
                    </span>
                    <span className="font-semibold text-brand-primary">
                      Save 20%
                    </span>
                  </p>
                ) : null}

                {/* Description */}
                <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                  {plan.description}
                </p>

                {/* Divider */}
                {plan.featured ? (
                  <div className="relative mt-4 h-px w-full bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent">
                    <span className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary shadow-[0_0_8px_rgb(25_224_111_/_0.9)]" />
                  </div>
                ) : (
                  <div className="mt-4 h-px w-full bg-border-subtle" />
                )}

                {/* Features */}
                <ul className="mt-4 flex flex-1 list-none flex-col gap-2.5 p-0">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-[13px] leading-snug text-text-secondary"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${checkClass}`}
                        strokeWidth={1.9}
                        aria-hidden="true"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {action.disabled ? (
                  <span
                    aria-disabled="true"
                    className={
                      plan.featured
                        ? "mt-6 inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-elevated px-4 text-sm font-semibold text-text-muted opacity-70"
                        : green
                          ? "mt-6 inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-elevated px-4 text-[13px] font-semibold text-text-muted opacity-70"
                          : "mt-6 inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border-default bg-surface-elevated px-4 text-[13px] font-semibold text-text-muted opacity-70"
                    }
                  >
                    {action.cta}
                  </span>
                ) : (
                  <Link
                    href={action.href ?? LANDING_PRICING}
                    className={
                      plan.featured
                        ? "btn-shine mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary shadow-[0_0_24px_rgb(25_224_111_/_0.4)] transition-colors duration-fast ease-sv hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
                        : green
                          ? "mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border-default px-4 text-[13px] font-semibold text-text-primary transition-colors duration-fast ease-sv hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
                          : "mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-purple/55 px-4 text-[13px] font-semibold text-text-primary transition-colors duration-fast ease-sv hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:shadow-focus"
                    }
                  >
                    {action.cta}
                    <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
