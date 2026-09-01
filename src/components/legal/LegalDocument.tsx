import Link from "next/link";
import { LandingFooter } from "../landing/LandingFooter";
import { LandingHeader } from "../landing/LandingHeader";
import { LEGAL_EFFECTIVE_DATE, type LegalSection } from "../../lib/legal-content";
import {
  PRIVACY_PATH,
  REFUND_PATH,
  TERMS_PATH,
} from "../../lib/legal-paths";

const RELATED = [
  { href: TERMS_PATH, label: "Terms of Service" },
  { href: PRIVACY_PATH, label: "Privacy Policy" },
  { href: REFUND_PATH, label: "Refund Policy" },
] as const;

export function LegalDocument({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_45%_at_82%_18%,rgb(34_211_90_/_0.05),transparent_55%),linear-gradient(180deg,var(--color-background-primary),var(--color-background-secondary))]"
        aria-hidden="true"
      />
      <LandingHeader />

      <article className="relative z-[1] mx-auto w-full max-w-[760px] px-4 pt-14 pb-8 sm:px-6 sm:pt-16">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-[clamp(1.75rem,3vw,2.35rem)] font-bold leading-[1.15] tracking-tight text-text-primary">
          {title}
        </h1>
        <p className="mt-3 text-[13px] text-text-muted">
          Effective {LEGAL_EFFECTIVE_DATE}
        </p>
        <p className="mt-6 text-[15px] leading-relaxed text-text-secondary">
          {intro}
        </p>

        <nav
          aria-label="Legal pages"
          className="mt-8 flex flex-wrap gap-2 border-y border-border-subtle/80 py-3"
        >
          {RELATED.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm border border-border-subtle bg-surface-card/70 px-3 py-1.5 text-[12px] font-medium text-text-secondary no-underline transition-colors duration-fast ease-sv hover:border-brand-primary/40 hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 flex flex-col gap-9">
          {sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-[1.05rem] font-semibold tracking-tight text-text-primary">
                {section.heading}
              </h2>
              {section.paragraphs.map((p, i) => (
                <p
                  key={`${section.heading}-${i}`}
                  className="mt-3 text-[15px] leading-[1.7] text-text-secondary"
                >
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <div className="relative z-[1] mt-8">
        <LandingFooter />
      </div>
    </main>
  );
}
