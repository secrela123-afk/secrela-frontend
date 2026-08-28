/**
 * Shared Tailwind class strings for auth UI.
 * Prefer importing these over inventing new CSS classes.
 */

export const authEnter = "animate-sv-rise motion-reduce:animate-none";

export const authForm = `flex w-full flex-col ${authEnter}`;

export const authInput =
  "block h-11 w-full rounded-sm border border-border-default bg-background-secondary pl-11 pr-4 text-[15px] text-text-primary outline-none transition-[border-color,box-shadow] duration-fast ease-sv placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus";

export const authInputPassword = `${authInput} pr-11`;

export const authInputPlain =
  "block h-11 w-full rounded-sm border border-border-default bg-background-secondary px-4 text-[15px] text-text-primary outline-none transition-[border-color,box-shadow] duration-fast ease-sv placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus";

export const authFieldIcon =
  "pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-text-muted";

export const authCheckbox =
  "h-[18px] w-[18px] shrink-0 rounded-[4px] border border-border-default bg-background-secondary accent-brand-primary";

export const authPrimaryBtn =
  "relative flex h-[46px] w-full items-center justify-center rounded-[10px] bg-brand-primary text-[15px] font-semibold text-brand-on-primary shadow-glow-green transition-[background-color,box-shadow,transform] duration-fast ease-sv hover:bg-brand-primary-hover hover:shadow-glow-green-strong hover:-translate-y-px disabled:cursor-wait motion-reduce:hover:translate-y-0";

export const authOutlineBtn =
  "flex h-[46px] w-full items-center justify-center gap-2 rounded-[10px] border border-border-default bg-surface-card/72 text-sm font-medium text-text-primary transition-[border-color,background-color] duration-fast ease-sv hover:border-brand-primary/35 hover:bg-surface-elevated";

export const authSsoBtn =
  "flex h-11 items-center justify-center gap-2 rounded-[10px] border border-border-default bg-surface-card/72 text-[13px] font-medium text-text-primary transition-[border-color,background-color,transform] duration-fast ease-sv hover:-translate-y-px hover:border-brand-primary/40 hover:bg-surface-elevated motion-reduce:hover:translate-y-0";

export const authCallout =
  "flex gap-2.5 rounded-[10px] border border-border-subtle bg-surface-card/72 px-3.5 py-3 text-[12px] leading-snug text-text-secondary";

export const authTitleBadge =
  "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-brand-primary/35 bg-surface-card/85 shadow-[0_0_16px_rgb(34_211_90_/_0.12)]";

export const authFormCard =
  "w-full rounded-xl border border-border-subtle bg-surface-card/90 px-5 py-5 shadow-elevated backdrop-blur-md sm:px-8 sm:py-7";

export const authCard =
  "relative z-1 flex w-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-card/72 shadow-[0_0_0_1px_rgb(34_211_90_/_0.03),0_24px_64px_rgb(0_0_0_/_0.35)]";
