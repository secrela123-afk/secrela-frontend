import Link from "next/link";
import { LandingFooter } from "../landing/LandingFooter";
import { LandingHeader } from "../landing/LandingHeader";
import { APP_NAME } from "../../lib/brand";
import { LANDING_PRICING, registerPath } from "../../lib/routes";

const PRINCIPLES = [
  {
    title: "Assume breach",
    body: "No hosted system can honestly claim it is impossible to compromise. We design so that one failed layer does not automatically expose every secret.",
  },
  {
    title: "Minimize exposure",
    body: "Reveal, copy, and decrypt only when authorized — and only for as long as needed. Access should expire. Secrets stay out of logs, URLs, and analytics.",
  },
  {
    title: "Control every access",
    body: "Who can see a vault, who can reveal a secret, who approved the request, and when it happened should always be answerable.",
  },
] as const;

const FOR = [
  {
    title: "Founders & small teams",
    body: "Stop spreading production credentials across chat, docs, and personal password managers.",
  },
  {
    title: "Engineering & DevOps",
    body: "Know which environment secrets exist, who can reveal them, and when they were last used.",
  },
  {
    title: "Security & leadership",
    body: "Roles, access requests, audit history, and a security center that reflects real controls — not a fake score.",
  },
] as const;

export function AboutPage() {
  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_55%_40%_at_12%_12%,rgb(34_211_90_/_0.07),transparent_55%),linear-gradient(180deg,var(--color-background-primary),var(--color-background-secondary))]"
        aria-hidden="true"
      />
      <LandingHeader />

      <div className="relative z-[1] mx-auto w-full max-w-[1040px] px-4 pt-14 pb-20 sm:px-6 sm:pt-16">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
          About {APP_NAME}
        </p>
        <h1 className="mt-3 max-w-[18ch] text-[clamp(2rem,4vw,2.85rem)] font-bold leading-[1.1] tracking-tight text-text-primary">
          Company secrets, under control.
        </h1>
        <p className="mt-5 max-w-[62ch] text-[16px] leading-[1.75] text-pretty text-text-secondary">
          {APP_NAME} is a secure workspace for the credentials companies actually
          run on — passwords, API keys, databases, cloud, and recovery codes —
          with access control and security intelligence, not a personal password
          manager wearing a dashboard.
        </p>

        <dl className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Built for", value: "Teams, not individuals" },
            { label: "Model", value: "Assume breach" },
            { label: "Payments", value: "Paddle & PayPal" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border-subtle bg-surface-card/80 px-4 py-4"
            >
              <dt className="text-[11px] font-semibold tracking-[0.1em] text-text-muted uppercase">
                {item.label}
              </dt>
              <dd className="mt-1.5 text-[15px] font-medium text-text-primary">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <section className="mt-16">
          <h2 className="text-[1.35rem] font-bold tracking-tight text-text-primary">
            How we think about security
          </h2>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-text-secondary">
            The product philosophy is simple, and we do not over-claim it.
          </p>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border-subtle bg-surface-card/85 p-5 shadow-card"
              >
                <h3 className="border-l-2 border-brand-primary pl-3 text-[15px] font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-pretty text-text-secondary">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[1.35rem] font-bold tracking-tight text-text-primary">
            Who it is for
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {FOR.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border-subtle bg-background-secondary/50 p-5"
              >
                <h3 className="text-[15px] font-semibold text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-3 text-[14px] leading-[1.7] text-pretty text-text-secondary">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-border-subtle bg-surface-card/90 px-6 py-8 sm:px-8">
          <h2 className="text-[1.25rem] font-bold tracking-tight text-text-primary">
            Ready to put secrets in one place?
          </h2>
          <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-text-secondary">
            Start a trial, or talk to us if you need a larger rollout.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={registerPath("free")}
              className="inline-flex h-11 items-center rounded-[10px] bg-brand-primary px-5 text-sm font-semibold text-brand-on-primary no-underline shadow-glow-green transition-colors duration-fast ease-sv hover:bg-brand-primary-hover"
            >
              Start free trial
            </Link>
            <Link
              href={LANDING_PRICING}
              className="inline-flex h-11 items-center rounded-[10px] border border-border-default px-5 text-sm font-medium text-text-primary no-underline transition-colors duration-fast ease-sv hover:border-brand-primary/40"
            >
              View pricing
            </Link>
            <a
              href="mailto:sales@secrela.com"
              className="inline-flex h-11 items-center text-sm font-medium text-text-secondary no-underline hover:text-text-primary"
            >
              sales@secrela.com
            </a>
          </div>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
}
