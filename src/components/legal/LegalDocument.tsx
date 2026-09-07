"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { ChevronDown, FileText, Mail, Scale } from "lucide-react";
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
  const slug = heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `section-${index}-${slug || "item"}`;
}

const RELATED = [
  { href: TERMS_PATH, label: "Terms" },
  { href: PRIVACY_PATH, label: "Privacy" },
  { href: REFUND_PATH, label: "Refunds" },
] as const;

/**
 * Policy hub — sticky outline + expandable clauses (not a blog article).
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

  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const nodes = items
      .map((item) => document.getElementById(item.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [items]);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  function jumpTo(id: string) {
    setOpenId(id);
    setActiveId(id);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 8% 0%, rgb(34 211 90 / 0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 92% 12%, rgb(34 211 90 / 0.04), transparent 50%), linear-gradient(180deg, var(--color-background-primary), var(--color-background-secondary))",
        }}
      />
      <LandingHeader />

      <div className="relative z-[1] mx-auto w-full max-w-[1120px] px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <header className="animate-sv-rise max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-sm border border-brand-primary/35 bg-brand-primary/8 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-brand-primary uppercase">
            <Scale className="h-3.5 w-3.5" aria-hidden />
            {eyebrow}
          </div>
          <h1 className="mt-4 text-[clamp(2rem,4.2vw,2.9rem)] font-bold leading-[1.08] tracking-tight text-text-primary">
            {title}
          </h1>
          <p className="mt-4 max-w-[58ch] text-[15px] leading-relaxed text-text-secondary">
            {intro}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-card/70 px-3 py-1.5 text-[12px] text-text-secondary">
              <FileText className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
              Effective {LEGAL_EFFECTIVE_DATE}
            </span>
            <a
              href={`mailto:${LEGAL_CONTACT}`}
              className="inline-flex items-center gap-1.5 rounded-sm border border-border-subtle bg-surface-card/70 px-3 py-1.5 text-[12px] text-text-secondary no-underline transition-colors hover:border-brand-primary/40 hover:text-text-primary"
            >
              <Mail className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
              {LEGAL_CONTACT}
            </a>
          </div>

          <nav aria-label="Related policies" className="mt-5 flex flex-wrap gap-2">
            {RELATED.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary no-underline transition-colors hover:border-brand-primary/45 hover:text-brand-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-sm border border-border-subtle bg-surface-card/60 p-4 backdrop-blur-sm">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-text-muted uppercase">
                On this page
              </p>
              <nav aria-label="Section outline" className="mt-3 flex flex-col gap-0.5">
                {items.map((item, index) => {
                  const active = activeId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpTo(item.id)}
                      className={`rounded-sm px-2.5 py-2 text-left text-[12.5px] leading-snug transition-colors ${
                        active
                          ? "bg-brand-primary/12 font-semibold text-brand-primary"
                          : "text-text-secondary hover:bg-surface-elevated hover:text-text-primary"
                      }`}
                    >
                      <span className="mr-1.5 tabular-nums text-text-muted">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {item.heading.replace(/^\d+\.\s*/, "")}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 space-y-2">
            <p className="mb-3 text-[12px] text-text-muted lg:hidden">
              {items.length} sections · tap a row to expand
            </p>

            {items.map((section, index) => {
              const open = openId === section.id;
              const panelId = `${baseId}-${section.id}-panel`;
              const buttonId = `${baseId}-${section.id}-button`;

              return (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 overflow-hidden rounded-sm border border-border-subtle bg-surface-card/75 transition-[border-color] duration-fast ease-sv hover:border-border-default"
                >
                  <h2 className="m-0 text-[1rem]">
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggle(section.id)}
                      className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-brand-primary/30 bg-brand-primary/10 text-[11px] font-bold tabular-nums text-brand-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] font-semibold tracking-tight text-text-primary">
                        {section.heading.replace(/^\d+\.\s*/, "")}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-text-muted transition-transform duration-fast ease-sv ${
                          open ? "rotate-180 text-brand-primary" : ""
                        }`}
                        aria-hidden
                      />
                    </button>
                  </h2>

                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!open}
                    className={
                      open
                        ? "border-t border-border-subtle/80 px-4 pb-5 sm:px-5"
                        : undefined
                    }
                  >
                    {open ? (
                      <div className="pt-4 animate-sv-rise">
                        {section.paragraphs.map((p, i) => (
                          <p
                            key={`${section.id}-p-${i}`}
                            className="mt-3 text-[14px] leading-[1.7] text-pretty text-text-secondary first:mt-0"
                          >
                            {p}
                          </p>
                        ))}
                        {section.bullets && section.bullets.length > 0 ? (
                          <ul className="mt-4 list-none space-y-2.5 p-0">
                            {section.bullets.map((item) => (
                              <li
                                key={item}
                                className="flex gap-2.5 rounded-sm border border-border-subtle/80 bg-background-secondary/40 px-3 py-2.5 text-[13.5px] leading-snug text-text-secondary"
                              >
                                <span
                                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary"
                                  aria-hidden
                                />
                                <span className="min-w-0 text-pretty">{item}</span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {section.after?.map((p, i) => (
                          <p
                            key={`${section.id}-a-${i}`}
                            className="mt-3 text-[14px] leading-[1.7] text-pretty text-text-secondary"
                          >
                            {p}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative z-[1]">
        <LandingFooter />
      </div>
    </main>
  );
}
