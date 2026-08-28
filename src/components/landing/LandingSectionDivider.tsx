import { SecureVaultLogo } from "../brand/SecureVaultLogo";

/**
 * Branded chapter break: thin emerald line + hex mark.
 * Use only at major narrative shifts — not between every section.
 */
export function LandingSectionDivider() {
  return (
    <div
      className="relative flex items-center px-1 py-4 sm:px-2 sm:py-5"
      role="separator"
      aria-hidden="true"
    >
      <DividerLine />
      <span className="relative mx-0.5 grid size-11 shrink-0 place-items-center sm:mx-1 sm:size-12">
        <span className="pointer-events-none absolute inset-1 rounded-full bg-brand-primary/18 blur-xl" />
        <SecureVaultLogo size={40} decorative state="idle" />
      </span>
      <DividerLine flip />
    </div>
  );
}

function DividerLine({ flip = false }: { flip?: boolean }) {
  const bloom = flip
    ? "bg-gradient-to-l from-transparent via-brand-primary/20 to-brand-primary/45"
    : "bg-gradient-to-r from-transparent via-brand-primary/20 to-brand-primary/45";
  const core = flip
    ? "bg-gradient-to-l from-transparent to-brand-primary/80"
    : "bg-gradient-to-r from-transparent to-brand-primary/80";

  return (
    <span className="relative h-px min-w-0 flex-1">
      <span
        className={`absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 blur-[3px] ${bloom}`}
      />
      <span
        className={`absolute inset-x-0 top-1/2 h-px -translate-y-1/2 ${core}`}
      />
    </span>
  );
}
