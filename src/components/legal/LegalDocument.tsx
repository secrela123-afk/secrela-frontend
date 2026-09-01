import { LandingFooter } from "../landing/LandingFooter";
import { LandingHeader } from "../landing/LandingHeader";
import { LEGAL_EFFECTIVE_DATE, type LegalSection } from "../../lib/legal-content";

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

      <div className="relative z-[1] mx-auto w-full max-w-[880px] px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
        <header className="mb-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(1.85rem,3.4vw,2.55rem)] font-bold leading-[1.12] tracking-tight text-text-primary">
            {title}
          </h1>
          <p className="mt-3 text-[13px] text-text-muted">
            Effective {LEGAL_EFFECTIVE_DATE}
          </p>
        </header>

        <article className="rounded-2xl border border-border-subtle bg-surface-card/85 px-5 py-8 shadow-card sm:px-10 sm:py-11">
          <p className="text-[15px] leading-[1.75] text-pretty text-text-secondary">
            {intro}
          </p>

          <div className="mt-10 flex flex-col gap-0">
            {sections.map((section) => (
              <section
                key={section.heading}
                className="border-t border-border-subtle/70 py-8 first:border-t-0 first:pt-0 last:pb-0"
              >
                <h2 className="border-l-2 border-brand-primary pl-3.5 text-[1.08rem] font-semibold tracking-tight text-text-primary">
                  {section.heading}
                </h2>
                {section.paragraphs.map((p, i) => (
                  <p
                    key={`${section.heading}-${i}`}
                    className="mt-3.5 text-[15px] leading-[1.8] text-pretty break-words text-text-secondary"
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 ? (
                  <ul className="mt-4 list-none space-y-2.5 p-0">
                    {section.bullets.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 text-[15px] leading-[1.7] text-text-secondary"
                      >
                        <span
                          className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 text-pretty">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.after?.map((p, i) => (
                  <p
                    key={`${section.heading}-after-${i}`}
                    className="mt-3.5 text-[15px] leading-[1.8] text-pretty break-words text-text-secondary"
                  >
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </div>

      <div className="relative z-[1]">
        <LandingFooter />
      </div>
    </main>
  );
}
