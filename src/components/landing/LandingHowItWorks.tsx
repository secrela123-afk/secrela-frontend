import {
  Eye,
  FolderKey,
  Lock,
  ShieldCheck,
  User,
  Vault,
  type LucideIcon,
} from "lucide-react";
import { APP_NAME } from "../../lib/brand";
import { landingSection } from "./landing-classes";

const STEPS = [
  {
    number: "01",
    title: "Create your vault",
    body: "Set up vaults for your teams, projects, and environments in just a few clicks.",
    tag: "Secure foundation",
    TagIcon: Lock,
    Icon: Vault,
  },
  {
    number: "02",
    title: "Add your secrets",
    body: "Store passwords, API keys, tokens, certificates, and other sensitive data securely.",
    tag: "Encrypted storage",
    TagIcon: User,
    Icon: FolderKey,
  },
  {
    number: "03",
    title: "Control & monitor access",
    body: "Manage access, set granular permissions, rotate secrets, and monitor every activity in real-time.",
    tag: "Full visibility & control",
    TagIcon: Eye,
    Icon: ShieldCheck,
  },
] as const;

/**
 * Section 5 — How Secrela works (3 steps).
 */
export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className={`hiw-section ${landingSection}`}
      aria-labelledby="landing-how-title"
    >
      <header className="mx-auto max-w-2xl text-center">
        <p className="hiw-badge m-0 inline-flex items-center gap-2 rounded-full border border-brand-primary/35 bg-brand-primary/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
          <span className="hiw-badge-dot" aria-hidden="true" />
          How {APP_NAME} works
          <span className="hiw-badge-dot" aria-hidden="true" />
        </p>

        <h2
          id="landing-how-title"
          className="mt-5 text-[clamp(1.65rem,3.2vw,2.35rem)] font-semibold leading-[1.12] tracking-tight text-text-primary"
        >
          Simple steps.{" "}
          <span className="text-brand-primary">Serious security.</span>
        </h2>

        <p className="mt-4 text-[0.9375rem] leading-relaxed text-text-secondary">
          {APP_NAME} makes it easy to secure, manage, and control your most
          sensitive data — without slowing your team down.
        </p>
      </header>

      <div className="relative mx-auto mt-16 hidden max-w-[1080px] md:grid md:grid-cols-3 md:gap-5 lg:gap-6">
        {STEPS.map((step, index) => (
          <StepCard key={step.number} {...step} index={index} />
        ))}
      </div>

      <ol className="mt-12 flex list-none flex-col gap-10 overflow-x-clip p-0 pt-8 md:hidden">
        {STEPS.map((step, index) => (
          <li key={step.number}>
            <StepCard {...step} index={index} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function StepCard({
  number,
  title,
  body,
  tag,
  TagIcon,
  Icon,
  index,
}: (typeof STEPS)[number] & { index: number }) {
  const featured = index === 1;

  return (
    <div className={featured ? "relative md:pb-16" : "relative md:pb-10"}>
      <div className="relative">
        <article
          className={[
            "hiw-card relative z-[1] flex flex-col items-center overflow-visible px-4 pb-6 pt-[4.25rem] text-center backdrop-blur-[2px] sm:px-6",
            featured
              ? "hiw-card--featured px-4 pb-7 pt-[4.5rem] sm:px-7"
              : "hiw-card--standard",
          ].join(" ")}
        >
          {!featured ? (
            <span className="hiw-side-sheen pointer-events-none absolute inset-0 z-[6] overflow-hidden rounded-[inherit]" aria-hidden="true">
              {/* Card 01: left only · Card 03: right only */}
              {index === 0 ? (
                <span className="hiw-side-sheen-beam hiw-side-sheen-beam--left absolute left-0 h-24 w-px" />
              ) : null}
              {index === 2 ? (
                <span className="hiw-side-sheen-beam hiw-side-sheen-beam--right absolute right-0 h-24 w-px" />
              ) : null}
            </span>
          ) : null}

          <CardTopEdge featured={featured} />

          {featured ? (
            <div
              className="hiw-card-base-glow pointer-events-none absolute inset-x-6 bottom-0 z-[2] h-px bg-gradient-to-r from-transparent via-brand-primary/50 to-transparent"
              aria-hidden="true"
            />
          ) : null}

          <HubIcon Icon={Icon} featured={featured} />

          <p className="relative z-[2] m-0 text-[2.35rem] font-bold leading-none tracking-tight text-brand-primary">
            {number}
          </p>

          <h3 className="relative z-[2] mt-3 text-[1.05rem] font-semibold tracking-tight text-text-primary">
            {title}
          </h3>

          <p className="relative z-[2] mt-3 max-w-[19rem] text-[13px] leading-[1.65] text-text-secondary">
            {body}
          </p>

          <div className="relative z-[2] mt-6 w-full border-t border-border-subtle/50 pt-4">
            <p className="m-0 flex items-center justify-center gap-2 text-[13px] text-text-muted">
              <TagIcon
                className="h-3.5 w-3.5 shrink-0 text-brand-primary"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              {tag}
            </p>
          </div>
        </article>

        <div className="hidden md:block">
          <CardProjection featured={featured} />
        </div>
      </div>
    </div>
  );
}

function CardProjection({ featured }: { featured: boolean }) {
  if (!featured) {
    return (
      <div
        className="hiw-projection hiw-projection--soft pointer-events-none absolute inset-x-0 top-full z-0 h-[3.75rem]"
        aria-hidden="true"
      >
        {/* Same floor effect on cards 01 & 03 */}
        <span className="hiw-soft-base-glow absolute left-1/2 top-0 h-px w-[72%] -translate-x-1/2" />
        <span className="hiw-soft-contact absolute left-1/2 top-0 h-[0.55rem] w-[38%] -translate-x-1/2 -translate-y-[35%]" />
        <span className="hiw-soft-bloom absolute left-1/2 top-[0.1rem] h-8 w-[58%] -translate-x-1/2" />

        <span className="hiw-soft-ripple hiw-soft-ripple--1 absolute left-1/2 top-[0.05rem] h-[0.7rem] w-[42%] -translate-x-1/2 rounded-[100%]" />
        <span className="hiw-soft-ripple hiw-soft-ripple--2 absolute left-1/2 top-[0.35rem] h-[1.15rem] w-[62%] -translate-x-1/2 rounded-[100%]" />
        <span className="hiw-soft-ripple hiw-soft-ripple--3 absolute left-1/2 top-[0.7rem] h-[1.65rem] w-[82%] -translate-x-1/2 rounded-[100%]" />
        <span className="hiw-soft-ripple hiw-soft-ripple--4 absolute left-1/2 top-[1.1rem] h-[2.15rem] w-[98%] -translate-x-1/2 rounded-[100%]" />
      </div>
    );
  }

  return (
    <div
      className="hiw-projection hiw-projection--featured pointer-events-none absolute inset-x-0 top-full z-0 -mt-[0.05rem] h-[7rem]"
      aria-hidden="true"
    >
      {/* Inverted funnel: wide flush to card → narrow into floor rings */}
      <span className="hiw-feat-beam absolute left-1/2 top-0 h-[4.4rem] w-[78%] -translate-x-1/2" />
      <span className="hiw-feat-beam-core absolute left-1/2 top-0 h-[4.4rem] w-[52%] -translate-x-1/2" />
      <span className="hiw-feat-particles absolute left-1/2 top-0 h-[4.4rem] w-[74%] -translate-x-1/2 overflow-hidden">
        <span className="hiw-feat-particles-rain hiw-feat-particles-rain--a absolute inset-x-0 top-0 h-[200%]" />
        <span className="hiw-feat-particles-rain hiw-feat-particles-rain--b absolute inset-x-0 top-0 h-[200%]" />
      </span>

      {/* Bright line where beam kisses the card */}
      <span className="hiw-feat-rim absolute left-1/2 top-0 h-px w-[78%] -translate-x-1/2" />
      <span className="hiw-feat-rim-glow absolute left-1/2 top-0 h-3 w-[56%] -translate-x-1/2 -translate-y-[40%]" />

      {/* Tip glow into the ripples */}
      <span className="hiw-feat-tip absolute left-1/2 top-[3.85rem] h-3 w-8 -translate-x-1/2 rounded-full" />

      {/* Flat concentric floor rings */}
      <span className="hiw-feat-ripple hiw-feat-ripple--1 absolute left-1/2 top-[4rem] h-[0.85rem] w-[34%] -translate-x-1/2 rounded-[100%]" />
      <span className="hiw-feat-ripple hiw-feat-ripple--2 absolute left-1/2 top-[4.25rem] h-[1.35rem] w-[52%] -translate-x-1/2 rounded-[100%]" />
      <span className="hiw-feat-ripple hiw-feat-ripple--3 absolute left-1/2 top-[4.55rem] h-[1.85rem] w-[70%] -translate-x-1/2 rounded-[100%]" />
      <span className="hiw-feat-ripple hiw-feat-ripple--4 absolute left-1/2 top-[4.9rem] h-[2.35rem] w-[88%] -translate-x-1/2 rounded-[100%]" />
      <span className="hiw-feat-floor absolute left-1/2 top-[4.2rem] h-10 w-[70%] -translate-x-1/2 rounded-[100%]" />
    </div>
  );
}

/** Top border split around the embedded hub semicircle. */
function CardTopEdge({ featured }: { featured: boolean }) {
  const tone = featured ? "featured" : "standard";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-px" aria-hidden="true">
      <span className={`hiw-card-top-edge hiw-card-top-edge--left hiw-card-top-edge--${tone}`} />
      <span className={`hiw-card-top-edge hiw-card-top-edge--right hiw-card-top-edge--${tone}`} />
    </div>
  );
}

function HubIcon({ Icon, featured }: { Icon: LucideIcon; featured: boolean }) {
  return (
    <div className="absolute left-1/2 top-0 z-[4] -translate-x-1/2 -translate-y-1/2">
      <div
        className={[
          "hiw-hub relative grid h-[5.5rem] w-[5.5rem] place-items-center",
          featured ? "hiw-hub--featured" : "",
        ].join(" ")}
      >
        <span className="hiw-hub-ring hiw-hub-ring--outer absolute inset-0 rounded-full border border-brand-primary/30 bg-background-primary/40" />
        <span className="hiw-hub-ring hiw-hub-ring--inner absolute inset-[0.72rem] rounded-full border border-brand-primary/45 bg-background-primary/55" />
        <span className="hiw-hub-core relative z-[1] grid h-[2.65rem] w-[2.65rem] place-items-center rounded-full bg-background-primary">
          <Icon
            className="h-[1.35rem] w-[1.35rem] text-brand-primary"
            strokeWidth={1.85}
            aria-hidden="true"
          />
        </span>
      </div>
    </div>
  );
}
