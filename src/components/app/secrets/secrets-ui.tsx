"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type {
  OrganizationSecret,
  SecretRiskLevel,
  SecretType,
} from "../../../lib/api";
import { Avatar } from "../ui";
import { RowActionsMenu, type ActionItem } from "../RowActionsMenu";
import {
  IconAlert,
  IconClock,
  IconFilter,
  IconKey,
  IconLock,
  IconPlus,
  IconReveal,
  IconSearch,
  IconSecurity,
  IconVault,
  IconX,
} from "../icons";

export const TYPE_LABELS: Record<SecretType, string> = {
  credential: "Credential",
  api_key: "API Key",
  database: "Database",
  token: "Token",
  key_pair: "Key Pair",
  other: "Other",
};

export const RISK_OPTIONS: {
  value: SecretRiskLevel;
  label: string;
  className: string;
}[] = [
  { value: "unknown", label: "Unknown", className: "bg-surface-elevated text-text-muted" },
  { value: "low", label: "Low", className: "bg-brand-primary/15 text-brand-primary" },
  { value: "medium", label: "Medium", className: "bg-warning/15 text-warning" },
  { value: "high", label: "High", className: "bg-danger/15 text-danger" },
];

export const RISK_RANK: Record<SecretRiskLevel, number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

export type SecretSortKey = "updated" | "name" | "risk" | "accessed";

export type AccessKind = "reveal" | "temporary" | "pending" | "request" | "blocked" | "none";

export function accessKind(
  secret: OrganizationSecret,
  opts: { isAccessBlocked: boolean; canRequestAccess: boolean },
): AccessKind {
  if (secret.hasPendingAccessRequest) return "pending";
  if (secret.canReveal && secret.temporaryAccessExpiresAt) return "temporary";
  if (secret.canReveal) return "reveal";
  if (opts.isAccessBlocked) return "blocked";
  if (opts.canRequestAccess) return "request";
  return "none";
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatExpiry(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function vaultDot(color: string) {
  const map: Record<string, string> = {
    brand: "bg-brand-primary",
    purple: "bg-purple",
    info: "bg-info",
    warning: "bg-warning",
    danger: "bg-danger",
  };
  return map[color] ?? "bg-brand-primary";
}

export function TypeIcon({ type }: { type: SecretType }) {
  const map: Record<SecretType, { bg: string; icon: ReactNode }> = {
    credential: {
      bg: "bg-brand-primary/15 text-brand-primary",
      icon: <IconSecurity className="h-3.5 w-3.5" />,
    },
    api_key: {
      bg: "bg-info/15 text-info",
      icon: <IconKey className="h-3.5 w-3.5" />,
    },
    database: {
      bg: "bg-purple/15 text-purple",
      icon: <IconVault className="h-3.5 w-3.5" />,
    },
    token: {
      bg: "bg-surface-elevated text-text-secondary",
      icon: <IconLock className="h-3.5 w-3.5" />,
    },
    key_pair: {
      bg: "bg-surface-elevated text-text-secondary",
      icon: <IconKey className="h-3.5 w-3.5" />,
    },
    other: {
      bg: "bg-surface-elevated text-text-muted",
      icon: <IconLock className="h-3.5 w-3.5" />,
    },
  };
  const tone = map[type];
  return (
    <span
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm ${tone.bg}`}
    >
      {tone.icon}
    </span>
  );
}

export function TypeBadge({ type }: { type: SecretType }) {
  const map: Record<SecretType, string> = {
    credential: "bg-brand-primary/15 text-brand-primary",
    api_key: "bg-info/15 text-info",
    database: "bg-purple/15 text-purple",
    token: "bg-surface-elevated text-text-secondary",
    key_pair: "bg-surface-elevated text-text-secondary",
    other: "bg-surface-elevated text-text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold ${map[type]}`}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}

export function RiskBadge({ level }: { level: SecretRiskLevel }) {
  const map: Record<SecretRiskLevel, string> = {
    high: "bg-danger/15 text-danger",
    medium: "bg-warning/15 text-warning",
    low: "bg-brand-primary/15 text-brand-primary",
    unknown: "bg-surface-elevated text-text-muted",
  };
  return (
    <span
      className={`inline-flex items-center rounded-xs px-2 py-0.5 text-[11px] font-semibold capitalize ${map[level]}`}
    >
      {level}
    </span>
  );
}

function AccessBadge({
  kind,
  tempUntil,
}: {
  kind: AccessKind;
  tempUntil: string | null;
}) {
  const map: Record<AccessKind, { label: string; className: string }> = {
    reveal: {
      label: "Can reveal",
      className: "bg-brand-primary/10 text-brand-primary",
    },
    temporary: {
      label: tempUntil
        ? `Temp access · ${formatRelative(tempUntil)}`
        : "Temporary access",
      className: "bg-info/10 text-info",
    },
    pending: {
      label: "Request pending",
      className: "bg-warning/10 text-warning",
    },
    request: {
      label: "Request required",
      className: "bg-surface-elevated text-text-secondary",
    },
    blocked: {
      label: "Temporarily blocked",
      className: "bg-danger/10 text-danger",
    },
    none: {
      label: "No reveal access",
      className: "bg-surface-elevated text-text-muted",
    },
  };
  const tone = map[kind];
  return (
    <span
      className={`inline-flex max-w-[11rem] items-center truncate rounded-xs px-2 py-0.5 text-[11px] font-semibold ${tone.className}`}
      title={tone.label}
    >
      {tone.label}
    </span>
  );
}

export function SecretsEmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-card px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
        <IconLock className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-card text-text-primary">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-small text-text-secondary">{body}</p>
      {action}
    </div>
  );
}

export function SecretsErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-4 lg:p-8">
      <SecretsEmptyState
        title="Could not load secrets"
        body={message}
        action={
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-11 items-center rounded-sm border border-border-default px-4 text-[13px] font-semibold text-text-primary hover:border-brand-primary hover:text-brand-primary focus-visible:outline-none focus-visible:shadow-focus"
          >
            Try again
          </button>
        }
      />
    </div>
  );
}

export function SecretsSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-surface-card">
      <div className="hidden border-b border-border-subtle px-4 py-3 md:grid md:grid-cols-12 md:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-xs bg-surface-elevated md:col-span-2"
          />
        ))}
      </div>
      <ul className="m-0 list-none divide-y divide-border-subtle p-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-4">
            <span className="h-8 w-8 shrink-0 animate-pulse rounded-sm bg-surface-elevated" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/5 animate-pulse rounded-xs bg-surface-elevated" />
              <div className="h-2.5 w-1/4 animate-pulse rounded-xs bg-background-secondary" />
            </div>
            <div className="hidden h-3 w-16 animate-pulse rounded-xs bg-surface-elevated sm:block" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SecretsAttentionBar({
  total,
  highRisk,
  expired,
  filteredCount,
  filtersActive,
  onHighRisk,
  onExpired,
}: {
  total: number;
  highRisk: number;
  expired: number;
  filteredCount: number;
  filtersActive: boolean;
  onHighRisk: () => void;
  onExpired: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="text-small text-text-secondary">
        {filtersActive ? (
          <>
            Showing{" "}
            <span className="font-semibold text-text-primary">{filteredCount}</span> of{" "}
            <span className="font-semibold text-text-primary">{total}</span>
          </>
        ) : (
          <>
            <span className="font-semibold text-text-primary">{total}</span>{" "}
            {total === 1 ? "secret" : "secrets"} in inventory
          </>
        )}
      </p>
      {highRisk > 0 ? (
        <button
          type="button"
          onClick={onHighRisk}
          className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-danger/30 bg-danger/10 px-2.5 text-[11px] font-semibold text-danger hover:border-danger/50 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <IconAlert className="h-3.5 w-3.5" />
          {highRisk} high risk
        </button>
      ) : null}
      {expired > 0 ? (
        <button
          type="button"
          onClick={onExpired}
          className="inline-flex h-8 items-center gap-1.5 rounded-xs border border-warning/30 bg-warning/10 px-2.5 text-[11px] font-semibold text-warning hover:border-warning/50 focus-visible:outline-none focus-visible:shadow-focus"
        >
          <IconClock className="h-3.5 w-3.5" />
          {expired} expired
        </button>
      ) : null}
    </div>
  );
}

export function SecretsToolbar({
  query,
  onQuery,
  sort,
  onSort,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
  searchId,
}: {
  query: string;
  onQuery: (value: string) => void;
  sort: SecretSortKey;
  onSort: (value: SecretSortKey) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
  searchId: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <label htmlFor={searchId} className="sr-only">
          Search secrets
        </label>
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-muted">
          <IconSearch className="h-4 w-4" />
        </span>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search by name, vault, or description"
          className="h-11 w-full rounded-sm border border-border-default bg-background-secondary py-0 pr-3 pl-9 text-[13px] text-text-primary outline-none placeholder:text-text-muted focus:border-brand-primary focus:shadow-focus"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleFilters}
          aria-expanded={filtersOpen}
          className={`inline-flex h-11 items-center gap-2 rounded-sm border px-3 text-[13px] font-medium focus-visible:outline-none focus-visible:shadow-focus ${
            filtersOpen || activeFilterCount > 0
              ? "border-brand-primary/50 bg-brand-primary/10 text-brand-primary"
              : "border-border-default bg-background-secondary text-text-secondary hover:text-text-primary"
          }`}
        >
          <IconFilter className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-pill bg-brand-primary px-1.5 text-[10px] font-bold text-brand-on-primary">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
        <label className="sr-only" htmlFor={`${searchId}-sort`}>
          Sort secrets
        </label>
        <select
          id={`${searchId}-sort`}
          value={sort}
          onChange={(e) => onSort(e.target.value as SecretSortKey)}
          className="h-11 rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] font-medium text-text-secondary outline-none focus:border-brand-primary focus:shadow-focus"
        >
          <option value="updated">Last updated</option>
          <option value="name">Name</option>
          <option value="risk">Risk</option>
          <option value="accessed">Last accessed</option>
        </select>
      </div>
    </div>
  );
}

export function FilterChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex h-8 items-center gap-1 rounded-xs border border-border-subtle bg-surface-elevated pl-2.5 pr-1 text-[11px] font-medium text-text-secondary">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-6 w-6 items-center justify-center rounded-xs text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:shadow-focus"
        aria-label={`Remove filter ${label}`}
      >
        <IconX className="h-3 w-3" />
      </button>
    </span>
  );
}

function RevealActionButton({
  kind,
  disabled,
  onClick,
}: {
  kind: AccessKind;
  disabled: boolean;
  onClick: () => void;
}) {
  if (kind === "none") return null;

  const label =
    kind === "reveal" || kind === "temporary"
      ? "Reveal"
      : kind === "pending"
        ? "Pending"
        : kind === "blocked"
          ? "Blocked"
          : "Request";

  const caution = kind === "reveal" || kind === "temporary";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={
        caution
          ? "Requires recent authentication. Value is shown temporarily."
          : undefined
      }
      className={`inline-flex h-9 items-center gap-1.5 rounded-sm border px-2.5 text-[12px] font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-40 ${
        caution
          ? "border-warning/40 text-warning hover:bg-warning/10"
          : "border-border-default text-text-secondary hover:border-brand-primary hover:text-brand-primary"
      }`}
    >
      <IconReveal className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

export function SecretsInventory({
  rows,
  isAccessBlocked,
  canRequestAccess,
  onReveal,
  rowActions,
}: {
  rows: OrganizationSecret[];
  isAccessBlocked: boolean;
  canRequestAccess: boolean;
  onReveal: (secret: OrganizationSecret) => void;
  rowActions: (secret: OrganizationSecret) => ActionItem[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle text-label tracking-wide text-text-muted uppercase">
              <th className="px-4 py-3 font-semibold">Secret</th>
              <th className="px-3 py-3 font-semibold">Vault</th>
              <th className="px-3 py-3 font-semibold">Risk</th>
              <th className="px-3 py-3 font-semibold">Access</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((secret) => {
              const kind = accessKind(secret, {
                isAccessBlocked,
                canRequestAccess,
              });
              const revealDisabled =
                secret.hasPendingAccessRequest ||
                (isAccessBlocked && !secret.canReveal);
              return (
                <tr
                  key={secret.id}
                  className={`border-b border-border-subtle last:border-b-0 hover:bg-surface-elevated/50 ${
                    secret.riskLevel === "high"
                      ? "border-l-2 border-l-danger"
                      : "border-l-2 border-l-transparent"
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <TypeIcon type={secret.type} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-text-primary">
                          {secret.name}
                        </p>
                        <p className="truncate text-[11px] text-text-muted">
                          {TYPE_LABELS[secret.type]}
                          {secret.description ? ` · ${secret.description}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex max-w-[10rem] items-center gap-1.5 truncate text-[13px] text-text-secondary">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${vaultDot(secret.vault.color)}`}
                      />
                      {secret.vault.name}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <RiskBadge level={secret.riskLevel} />
                  </td>
                  <td className="px-3 py-3">
                    <AccessBadge
                      kind={kind}
                      tempUntil={secret.temporaryAccessExpiresAt}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`text-[12px] font-medium ${
                        secret.status === "expired"
                          ? "text-warning"
                          : "text-text-secondary"
                      }`}
                    >
                      {secret.status === "expired" ? "Expired" : "Active"}
                      {secret.expiresAt ? (
                        <span className="mt-0.5 block text-[11px] font-normal text-text-muted">
                          {secret.status === "expired" ? "Ended" : "Ends"}{" "}
                          {formatExpiry(secret.expiresAt)}
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-text-secondary">
                    {formatRelative(secret.lastUpdatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <RevealActionButton
                        kind={kind}
                        disabled={revealDisabled}
                        onClick={() => onReveal(secret)}
                      />
                      <RowActionsMenu items={rowActions(secret)} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
        {rows.map((secret) => {
          const kind = accessKind(secret, {
            isAccessBlocked,
            canRequestAccess,
          });
          const revealDisabled =
            secret.hasPendingAccessRequest ||
            (isAccessBlocked && !secret.canReveal);
          return (
            <li
              key={secret.id}
              className={`rounded-md border border-border-subtle bg-surface-card p-4 ${
                secret.riskLevel === "high" ? "border-l-2 border-l-danger" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <TypeIcon type={secret.type} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-text-primary">
                    {secret.name}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-text-muted">
                    {secret.vault.name} · {TYPE_LABELS[secret.type]}
                  </p>
                </div>
                <RowActionsMenu items={rowActions(secret)} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RiskBadge level={secret.riskLevel} />
                <AccessBadge
                  kind={kind}
                  tempUntil={secret.temporaryAccessExpiresAt}
                />
                <span
                  className={`text-[11px] font-medium ${
                    secret.status === "expired"
                      ? "text-warning"
                      : "text-text-muted"
                  }`}
                >
                  {secret.status === "expired" ? "Expired" : "Active"}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[12px] text-text-muted">
                  <Avatar initials={secret.owner.initials} size="sm" />
                  {secret.owner.name}
                </span>
                <RevealActionButton
                  kind={kind}
                  disabled={revealDisabled}
                  onClick={() => onReveal(secret)}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function SecretsPagination({
  from,
  to,
  total,
  page,
  totalPages,
  onPage,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const windowSize = 5;
  const start = Math.max(
    1,
    Math.min(page - 2, totalPages - windowSize + 1),
  );
  const pages = Array.from(
    { length: Math.min(totalPages, windowSize) },
    (_, i) => start + i,
  ).filter((p) => p >= 1 && p <= totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-4 py-3">
      <p className="text-[12px] text-text-muted">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-focus"
          aria-label="Previous page"
        >
          ‹
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-sm border px-2 text-[12px] font-semibold focus-visible:outline-none focus-visible:shadow-focus ${
              p === page
                ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                : "border-border-default text-text-secondary hover:text-text-primary"
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-default text-text-secondary hover:text-text-primary disabled:opacity-40 focus-visible:outline-none focus-visible:shadow-focus"
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function SecretsActivity({
  items,
  canViewAudit,
}: {
  items: {
    id: string;
    secretName: string;
    action: string;
    actorName: string;
    at: string;
  }[];
  canViewAudit: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-md border border-border-subtle bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-semibold text-text-primary">
          Recent secret activity
        </h2>
        {canViewAudit ? (
          <Link
            href="/app/audit"
            className="text-[12px] font-semibold text-brand-primary no-underline hover:text-brand-primary-hover"
          >
            Audit logs
          </Link>
        ) : null}
      </div>
      <ul className="mt-3 m-0 flex list-none flex-col gap-3 p-0">
        {items.slice(0, 5).map((item) => (
          <li key={item.id} className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-surface-elevated text-text-secondary">
              <IconLock className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-text-primary">
                {item.secretName}
              </p>
              <p className="text-[11px] text-text-muted">
                {item.action === "accessed" ? "Revealed" : "Updated"} by{" "}
                {item.actorName} · {formatRelative(item.at)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function NewSecretButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 self-start rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary shadow-glow-green transition-colors duration-fast hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
    >
      <IconPlus className="h-4 w-4" />
      New secret
    </button>
  );
}
