"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLandingSessionQuery } from "../../hooks/queries/useLandingSessionQuery";
import { APP_NAME } from "../../lib/brand";
import { APP_HOME, LANDING_PRICING, registerPath } from "../../lib/routes";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";

const NAV = [
  { href: "/#product", label: "Product" },
  { href: "/#security", label: "Security" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#pricing", label: "Pricing" },
] as const;

const btnPrimary =
  "btn-shine inline-flex h-[42px] items-center justify-center gap-1.5 rounded-sm bg-brand-primary px-[1.1rem] text-sm font-semibold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow,transform] duration-fast ease-sv hover:bg-brand-primary-hover hover:shadow-glow-green-strong focus-visible:outline-none focus-visible:shadow-focus active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0";

const navLink =
  "relative rounded text-sm font-medium text-text-secondary no-underline transition-colors duration-fast ease-sv hover:text-text-primary focus-visible:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus motion-reduce:transition-none after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand-primary after:transition-transform after:duration-fast after:ease-sv hover:after:scale-x-100 motion-reduce:after:transition-none";

function CtaArrow() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Marketing header — sticky, gains a blurred surface once the page scrolls.
 * Swaps auth CTAs when a verified session exists; mobile gets a slide-down menu.
 */
export function LandingHeader() {
  const session = useLandingSessionQuery();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock the menu closed when resizing up to desktop
  useEffect(() => {
    if (!menuOpen) return;
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mq.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  const desktopCtaClass = `${btnPrimary} hidden md:inline-flex`;

  const authArea =
    session.status === "loading" ? (
      <span className="hidden h-[42px] w-[120px] rounded-sm bg-surface-card/60 md:inline-flex" />
    ) : session.status === "authed" ? (
      session.hasOrganization ? (
        <Link href={APP_HOME} className={desktopCtaClass}>
          Open dashboard
          <CtaArrow />
        </Link>
      ) : (
        <Link href={LANDING_PRICING} className={desktopCtaClass}>
          Choose a plan
          <CtaArrow />
        </Link>
      )
    ) : (
      <>
        <Link
          href="/login"
          className="hidden h-[42px] items-center rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary no-underline transition-colors duration-fast ease-sv hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus motion-reduce:transition-none md:inline-flex"
        >
          Sign in
        </Link>
        <Link href={registerPath("free")} className={desktopCtaClass}>
          Get started
          <CtaArrow />
        </Link>
      </>
    );

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-fast ease-sv motion-reduce:transition-none",
        solid
          ? "border-b border-border-subtle/70 bg-background-primary/85 shadow-[0_10px_32px_rgb(0_0_0_/_0.38)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-2 px-4 sm:h-[72px] sm:gap-4 sm:px-4 lg:px-5">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-inherit no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-focus sm:gap-2.5"
          aria-label={APP_NAME}
        >
          <SecureVaultLogo state="enter" size={30} decorative />
          <span className="truncate text-[15px] font-semibold tracking-tight text-text-primary">
            {APP_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className={navLink}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {authArea}

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-border-default text-text-primary transition-colors duration-fast ease-sv hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus md:hidden"
          >
            {menuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen ? (
        <nav
          id="landing-mobile-menu"
          aria-label="Primary mobile"
          className="border-t border-border-subtle/60 bg-background-primary/95 backdrop-blur-md md:hidden"
        >
          <ul className="m-0 flex list-none flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-sm px-3 py-2.5 text-[15px] font-medium text-text-secondary no-underline transition-colors duration-fast ease-sv hover:bg-surface-card hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-border-subtle/60 pt-3">
              {session.status === "authed" ? (
                <Link
                  href={session.hasOrganization ? APP_HOME : LANDING_PRICING}
                  onClick={() => setMenuOpen(false)}
                  className={`${btnPrimary} w-full`}
                >
                  {session.hasOrganization ? "Open dashboard" : "Choose a plan"}
                  <CtaArrow />
                </Link>
              ) : (
                <>
                  <Link
                    href={registerPath("free")}
                    onClick={() => setMenuOpen(false)}
                    className={`${btnPrimary} w-full`}
                  >
                    Get started
                    <CtaArrow />
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="inline-flex h-[42px] items-center justify-center rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary no-underline transition-colors duration-fast ease-sv hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
                  >
                    Sign in
                  </Link>
                </>
              )}
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
