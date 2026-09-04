"use client";

import { useEffect } from "react";

/**
 * Global, lightweight scroll reveal for the landing page.
 *
 * Any element with a `data-reveal` attribute starts slightly faded/lowered
 * (see globals.css) and is switched to `data-reveal="visible"` the first
 * time it enters the viewport. Stagger via `--reveal-delay` inline style.
 *
 * One IntersectionObserver for the whole page; elements are unobserved
 * after revealing, so there is zero ongoing cost.
 */
export function ScrollReveal() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-reveal='visible'])"),
    );
    if (els.length === 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const el of els) el.setAttribute("data-reveal", "visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-reveal", "visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.01, rootMargin: "80px 0px 80px 0px" },
    );

    for (const el of els) io.observe(el);
    return () => io.disconnect();
  }, []);

  return null;
}
