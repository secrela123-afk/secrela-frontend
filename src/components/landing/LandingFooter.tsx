"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { APP_NAME } from "../../lib/brand";
import {
  ABOUT_PATH,
  PRIVACY_PATH,
  REFUND_PATH,
  TERMS_PATH,
} from "../../lib/legal-paths";
import { LANDING_PRICING } from "../../lib/routes";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";

const PRODUCT_LINKS = [
  { href: "/#product", label: "Features" },
  { href: "/#security", label: "Security" },
  { href: LANDING_PRICING, label: "Pricing" },
] as const;

const COMPANY_LINKS = [
  { href: ABOUT_PATH, label: "About" },
  { href: "mailto:sales@secrela.com", label: "Contact" },
] as const;

const LINK_COLUMNS = [
  { title: "Product", links: PRODUCT_LINKS },
  { title: "Company", links: COMPANY_LINKS },
] as const;

const LEGAL_LINKS = [
  { href: PRIVACY_PATH, label: "Privacy Policy" },
  { href: TERMS_PATH, label: "Terms of Service" },
  { href: REFUND_PATH, label: "Refund Policy" },
] as const;

const linkClass =
  "text-[13px] text-text-secondary no-underline transition-colors duration-fast ease-sv hover:text-text-primary focus-visible:text-brand-primary focus-visible:outline-none";

/**
 * Landing footer — brand, real links only, newsletter, legal bar.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setEmail("");
    setSubscribed(true);
  }

  return (
    <footer className="relative border-t border-border-subtle/80 bg-background-primary">
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-px w-[min(720px,90%)] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-primary/35 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-[1400px] px-3 pt-12 sm:px-4 lg:px-5 lg:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.2fr] lg:gap-12">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-inherit no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-focus"
              aria-label={APP_NAME}
            >
              <SecureVaultLogo state="idle" size={28} decorative />
              <span className="text-[15px] font-semibold tracking-tight text-text-primary lowercase">
                {APP_NAME}
              </span>
            </Link>
            <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-text-secondary">
              Secure every secret. Control every access.
            </p>
          </div>

          {LINK_COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[11px] font-semibold tracking-[0.12em] text-text-muted uppercase">
                {col.title}
              </h3>
              <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("mailto:") ? (
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div>
            <h3 className="text-[11px] font-semibold tracking-[0.12em] text-text-muted uppercase">
              Stay updated
            </h3>
            <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-text-secondary">
              Product and security notes. No spam.
            </p>
            <form
              onSubmit={onSubscribe}
              className="mt-4 flex max-w-[300px] items-stretch overflow-hidden rounded-md border border-border-default bg-background-secondary transition-[border-color,box-shadow] duration-fast ease-sv focus-within:border-brand-primary focus-within:shadow-focus"
              noValidate
            >
              <label htmlFor="footer-email" className="sr-only">
                Email
              </label>
              <input
                id="footer-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Work email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSubscribed(false);
                }}
                className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[13px] text-text-primary outline-none placeholder:text-text-muted"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center bg-brand-primary text-brand-on-primary transition-colors duration-fast ease-sv hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
            <p
              className="mt-2.5 min-h-[18px] text-[12px] text-brand-primary"
              role="status"
              aria-live="polite"
            >
              {subscribed ? "Thanks — you're on the list." : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border-subtle/60">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-3 px-3 py-5 text-[12px] text-text-muted sm:flex-row sm:px-4 lg:px-5">
          <p className="m-0">
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-[12px] text-text-muted no-underline transition-colors duration-fast ease-sv hover:text-text-primary focus-visible:text-brand-primary focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
