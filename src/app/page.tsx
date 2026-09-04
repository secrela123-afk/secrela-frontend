import { LandingFinalCta } from "../components/landing/LandingFinalCta";
import { LandingFooter } from "../components/landing/LandingFooter";
import { LandingHeader } from "../components/landing/LandingHeader";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingHowItWorks } from "../components/landing/LandingHowItWorks";
import { LandingPricing } from "../components/landing/LandingPricing";
import { LandingProblems } from "../components/landing/LandingProblems";
import { LandingSectionDivider } from "../components/landing/LandingSectionDivider";
import { LandingSecurity } from "../components/landing/LandingSecurity";
import { LandingSocialStrip } from "../components/landing/LandingSocialStrip";
import { LandingVisibility } from "../components/landing/LandingVisibility";
import { ScrollReveal } from "../components/landing/ScrollReveal";

/**
 * Marketing landing — full page through final CTA + footer.
 *
 * Section order (marketing narrative):
 * Hero → platforms strip (trust) → problem → solution (access control)
 * → how it works → security → product showcase → pricing → final CTA.
 */
export default function Home() {
  return (
    <main className="relative min-h-full overflow-x-clip bg-background-primary text-text-primary">
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_60%_45%_at_82%_32%,rgb(34_211_90_/_0.05),transparent_55%),linear-gradient(180deg,var(--color-background-primary),var(--color-background-secondary))]"
        aria-hidden="true"
      />

      <LandingHeader />
      <ScrollReveal />

      <div className="relative z-[1] mx-auto w-full max-w-[1400px] px-4 sm:px-4 lg:px-5">
        <LandingHero />
        <LandingSocialStrip />
        <LandingSectionDivider />
        <LandingProblems />
        <LandingHowItWorks />
        <LandingSectionDivider />
        <LandingSecurity />
        <LandingVisibility />
        <LandingSectionDivider />
        <LandingPricing />
        <LandingFinalCta />
      </div>

      <div className="relative z-[1]">
        <LandingFooter />
      </div>
    </main>
  );
}
