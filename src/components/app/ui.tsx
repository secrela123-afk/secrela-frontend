import type { ReactNode } from "react";
import { BrandLoadingScreen } from "../brand/BrandLoadingScreen";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-text-primary sm:text-section">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-small text-text-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Settings screens — title + stacked cards, matching Account security. */
export function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-4 lg:p-6">
      <PageHeader title={title} description={description} />
      <div className="grid max-w-3xl gap-4">{children}</div>
    </div>
  );
}

export const settingsPrimaryBtn =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-sm bg-brand-primary px-4 text-sm font-semibold text-brand-on-primary shadow-glow-green transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus";

export const settingsSecondaryBtn =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-sm border border-border-default px-4 text-sm font-semibold text-text-primary no-underline transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus";

export function SettingsCard({
  title,
  description,
  status,
  action,
  children,
}: {
  title: string;
  description?: string;
  status?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-subtle bg-surface-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-text-primary">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-xl text-small text-text-secondary">{description}</p>
          ) : null}
          {status ? <div className="mt-3 text-small text-text-primary">{status}</div> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={`rounded-md border border-border-subtle bg-surface-card shadow-card ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          {title ? (
            <h2 className="text-[13px] font-semibold text-text-primary">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function PrimaryButton({
  children,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary shadow-glow-green transition-colors hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border-default bg-transparent px-3.5 text-[13px] font-semibold text-text-primary transition-colors hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
    >
      {children}
    </button>
  );
}

export function StatusBadge({
  tone,
  children,
}: {
  tone: "brand" | "info" | "warning" | "danger" | "muted" | "purple";
  children: ReactNode;
}) {
  const map = {
    brand: "bg-brand-primary/10 text-brand-primary",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
    danger: "bg-danger/10 text-danger",
    purple: "bg-purple/10 text-purple",
    muted: "bg-surface-elevated text-text-muted",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-[11px]";
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface-elevated font-semibold text-text-primary ${dim}`}
    >
      {initials}
    </div>
  );
}

/** Centered page/section loader — Secrela hex mark with loading animation. */
export function PageLoading({
  label = "Loading…",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return <BrandLoadingScreen label={label} size={52} className={className} />;
}
