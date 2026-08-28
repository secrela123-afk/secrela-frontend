"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { APP_NAME } from "../../lib/brand";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";

const PRODUCT_LINKS = [
  { href: "#product", label: "Features" },
  { href: "#security", label: "Security" },
  { href: "#", label: "Integrations" },
  { href: "#", label: "Changelog" },
] as const;

const SOLUTION_LINKS = [
  { href: "#", label: "Developers" },
  { href: "#", label: "DevOps" },
  { href: "#", label: "IT & Security" },
  { href: "#", label: "Compliance" },
] as const;

const RESOURCE_LINKS = [
  { href: "#", label: "Docs" },
  { href: "#", label: "Blog" },
  { href: "#", label: "Guides" },
  { href: "#", label: "Help Center" },
] as const;

const COMPANY_LINKS = [
  { href: "#", label: "About" },
  { href: "#", label: "Careers" },
  { href: "mailto:sales@secrela.com", label: "Contact" },
  { href: "#", label: "Privacy" },
] as const;

const LINK_COLUMNS = [
  { title: "Product", links: PRODUCT_LINKS },
  { title: "Solutions", links: SOLUTION_LINKS },
  { title: "Resources", links: RESOURCE_LINKS },
  { title: "Company", links: COMPANY_LINKS },
] as const;

const SOCIAL = [
  { label: "GitHub", href: "#", Icon: GitHubIcon },
  { label: "Discord", href: "#", Icon: DiscordIcon },
  { label: "X", href: "#", Icon: XIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
] as const;

const LEGAL_LINKS = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#security", label: "Security" },
] as const;

const linkClass =
  "text-[13px] text-text-secondary no-underline transition-colors duration-fast ease-sv hover:text-text-primary focus-visible:text-brand-primary focus-visible:outline-none";

/**
 * Landing footer — brand + link columns + newsletter, with a legal bottom bar.
 */
export function LandingFooter() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function onSubscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    // UI only for now — no newsletter API yet.
    setEmail("");
    setSubscribed(true);
  }

  return (
    <footer className="relative border-t border-border-subtle/80 bg-background-primary">
      {/* Soft top accent */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-px w-[min(720px,90%)] -translate-x-1/2 bg-gradient-to-r from-transparent via-brand-primary/35 to-transparent"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-[1400px] px-3 pt-12 sm:px-4 lg:px-5 lg:pt-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.15fr)_repeat(4,minmax(0,0.72fr))_minmax(0,1.25fr)] lg:gap-8 xl:gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
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
            <p className="mt-4 max-w-[230px] text-[13px] leading-relaxed text-text-secondary">
              Secure every secret. Control every access.
            </p>

            <div className="mt-5 flex items-center gap-2.5">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle bg-surface-card/60 text-text-muted transition-colors duration-fast ease-sv hover:border-brand-primary/45 hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
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
                    ) : link.href.startsWith("/") ? (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    ) : (
                      <a href={link.href} className={linkClass}>
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Stay updated */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-[11px] font-semibold tracking-[0.12em] text-text-muted uppercase">
              Stay updated
            </h3>
            <p className="mt-3 max-w-[260px] text-[13px] leading-relaxed text-text-secondary">
              Get the latest updates and security best practices.
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
                placeholder="Enter your email"
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

      {/* Bottom bar */}
      <div className="mt-10 border-t border-border-subtle/60">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-3 px-3 py-5 text-[12px] text-text-muted sm:flex-row sm:px-4 lg:px-5">
          <p className="m-0">
            © {year} {APP_NAME}. All rights reserved.
          </p>
          <ul className="m-0 flex list-none flex-wrap items-center gap-x-5 gap-y-1 p-0">
            {LEGAL_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-[12px] text-text-muted no-underline transition-colors duration-fast ease-sv hover:text-text-primary focus-visible:text-brand-primary focus-visible:outline-none"
                >
                  {link.label}
                </a>
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

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.12-1.52-1.12-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.8c.85 0 1.7.12 2.5.34 1.9-1.32 2.74-1.05 2.74-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.58.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.36-.76-.54-1.09l-.07-.03c-1.5.26-2.94.71-4.27 1.33l-.04.02C2.86 9.38 2.16 13.3 2.5 17.17l.01.04a16.3 16.3 0 0 0 4.96 2.52l.05-.02c.38-.52.72-1.07 1.01-1.65l-.02-.01a10.6 10.6 0 0 1-1.63-.79l.03-.02c.14-.1.27-.22.4-.33a9.4 9.4 0 0 0 8.38 0c.13.12.26.24.4.34l.03.01c-.52.31-1.07.57-1.64.8l-.02.01c.3.58.63 1.13 1.01 1.65l.05.02a16.2 16.2 0 0 0 4.97-2.52l.01-.04c.4-4.47-.67-8.35-2.83-11.82l-.03-.02ZM8.7 14.68c-.86 0-1.57-.8-1.57-1.78s.7-1.78 1.57-1.78 1.58.8 1.57 1.78c0 .98-.7 1.78-1.57 1.78Zm6.61 0c-.86 0-1.57-.8-1.57-1.78s.7-1.78 1.57-1.78 1.58.8 1.57 1.78c0 .98-.7 1.78-1.57 1.78Z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.81-5.96 6.81H1.68l7.73-8.84L1.25 2.25h6.81l4.71 6.23 5.47-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0Z" />
    </svg>
  );
}
