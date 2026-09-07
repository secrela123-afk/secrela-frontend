"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ChevronRight, Mail } from "lucide-react";
import { LandingFooter } from "../landing/LandingFooter";
import { LandingHeader } from "../landing/LandingHeader";
import {
  LEGAL_CONTACT,
  LEGAL_EFFECTIVE_DATE,
  type LegalSection,
} from "../../lib/legal-content";
import {
  PRIVACY_PATH,
  REFUND_PATH,
  TERMS_PATH,
} from "../../lib/legal-paths";

function sectionId(heading: string, index: number): string {
  return `s-${index}-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

const RELATED = [
  { href: TERMS_PATH, label: "Terms" },
  { href: PRIVACY_PATH, label: "Privacy" },
  { href: REFUND_PATH, label: "Refunds" },
] as const;

/**
 * Compact interactive policy page — pick a topic, read only what you need.
 */
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
  const baseId = useId();
  const items = useMemo(
    () =>
      sections.map((section, index) => ({
        ...section,
        id: sectionId(section.heading, index),
      })),
    [sections],
  );

  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const active = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 50% -10%, rgb(34 211 90 / 0.09), transparent 60%), linear-gradient(180deg, var(--color-background-primary), var(--color-background-secondary))",
        }}
      />
      <LandingHeader />

      <div className="relative z-[1] mx-auto w-full max-w-[960px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <header className="animate-sv-rise text-center sm:text-left">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)] font-bold leading-[1.1] tracking-tight">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-[52ch] text-[14px] leading-relaxed text-text-secondary sm:mx-0">
            {intro}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <span className="rounded-sm border border-border-subtle px-2.5 py-1 text-[11px] text-text-muted">
              Updated {LEGAL_EFFECTIVE_DATE}
            </span>
            <nav className="flex flex-wrap gap-1.5" aria-label="Policies">
              {RELATED.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-sm px-2.5 py-1 text-[12px] font-medium text-text-secondary no-underline transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="animate-sv-rise mt-10 grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-5">
          <div
            role="tablist"
            aria-label="Topics"
            className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0"
          >
            {items.map((item, index) => {
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(item.id)}
                  className={`shrink-0 rounded-sm border px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-fast ease-sv sm:w-full ${
                    selected
                      ? "border-brand-primary/55 bg-brand-primary/12 text-brand-primary shadow-[inset_3px_0_0_0_var(--color-brand-primary)]"
                      : "border-border-subtle bg-surface-card/50 text-text-secondary hover:border-border-default hover:text-text-primary"
                  }`}
                >
                  <span className="mr-2 tabular-nums text-[11px] text-text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.heading}
                </button>
              );
            })}
          </div>

          {active ? (
            <article
              key={active.id}
              role="tabpanel"
              id={`${baseId}-panel`}
              className="animate-sv-rise min-h-[280px] rounded-sm border border-border-subtle bg-surface-card/80 p-5 sm:p-7"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[1.2rem] font-bold tracking-tight text-text-primary">
                  {active.heading}
                </h2>
                <ChevronRight
                  className="mt-1 h-4 w-4 shrink-0 text-brand-primary"
                  aria-hidden
                />
              </div>

              {active.paragraphs.map((p, i) => (
                <p
                  key={`${active.id}-p-${i}`}
                  className="mt-3.5 text-[14px] leading-[1.7] text-pretty text-text-secondary first:mt-4"
                >
                  {p}
                </p>
              ))}

              {active.bullets && active.bullets.length > 0 ? (
                <ul className="mt-4 list-none space-y-2 p-0">
                  {active.bullets.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2.5 rounded-sm bg-background-secondary/55 px-3 py-2.5 text-[13.5px] leading-snug text-text-secondary"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {active.after?.map((p, i) => (
                <p
                  key={`${active.id}-a-${i}`}
                  className="mt-3.5 text-[14px] leading-[1.7] text-pretty text-text-secondary"
                >
                  {p}
                </p>
              ))}

              <a
                href={`mailto:${LEGAL_CONTACT}`}
                className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-brand-primary no-underline hover:underline"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                {LEGAL_CONTACT}
              </a>
            </article>
          ) : null}
        </div>
      </div>

      <LandingFooter />
    </main>
  );
}
