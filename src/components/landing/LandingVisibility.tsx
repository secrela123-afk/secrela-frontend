"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { landingSectionFollow } from "./landing-classes";
import {
  Bell,
  Check,
  ClipboardList,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Lock,
  LogOut,
  Search,
  Shield,
  ShieldCheck,
  Sun,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { APP_NAME } from "../../lib/brand";
import { SecureVaultLogo } from "../brand/SecureVaultLogo";
import {
  IconAccess,
  IconAudit,
  IconIntegrations,
  IconMembers,
  IconOverview,
  IconRoles,
  IconSecret,
  IconSecurity,
  IconSettings,
  IconVault,
} from "../app/icons";

const FEATURES: {
  title: string;
  body: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Complete oversight",
    body: "See everything that matters in real time.",
    Icon: ShieldCheck,
  },
  {
    title: "Smarter security",
    body: "Identify risks and fix issues before they become problems.",
    Icon: Lock,
  },
  {
    title: "Streamlined access",
    body: "Approve requests, manage roles, and keep your team productive.",
    Icon: Users,
  },
  {
    title: "Stronger posture",
    body: "Continuously improve your security with actionable insights.",
    Icon: LineChart,
  },
];

const NAV: {
  label: string;
  active?: boolean;
  Icon: (p: { className?: string }) => ReactNode;
}[] = [
  { label: "Overview", active: true, Icon: IconOverview },
  { label: "Vaults", Icon: IconVault },
  { label: "Secrets", Icon: IconSecret },
  { label: "Access Requests", Icon: IconAccess },
  { label: "Members", Icon: IconMembers },
  { label: "Roles & Permissions", Icon: IconRoles },
  { label: "Security Center", Icon: IconSecurity },
  { label: "Audit Logs", Icon: IconAudit },
  { label: "Integrations", Icon: IconIntegrations },
  { label: "Settings", Icon: IconSettings },
];

const ACTIVITY = [
  {
    name: "Ahmed",
    action: "accessed AWS Production",
    time: "2m ago",
    initials: "AH",
    tone: "bg-info/20 text-info",
  },
  {
    name: "Sara",
    action: "approved DB credentials",
    time: "14m ago",
    initials: "SA",
    tone: "bg-purple/20 text-purple",
  },
  {
    name: "Omar",
    action: "created Stripe API key",
    time: "1h ago",
    initials: "OM",
    tone: "bg-brand-primary/20 text-brand-primary",
  },
  {
    name: "Lina",
    action: "revoked staging access",
    time: "3h ago",
    initials: "LI",
    tone: "bg-warning/20 text-warning",
  },
] as const;

const METRICS: {
  label: string;
  value: string;
  meta: string;
  metaClass: string;
  Icon: LucideIcon;
}[] = [
  {
    label: "Vaults",
    value: "24",
    meta: "+3 this week",
    metaClass: "text-brand-primary",
    Icon: LayoutDashboard,
  },
  {
    label: "Secrets",
    value: "256",
    meta: "+18 this week",
    metaClass: "text-brand-primary",
    Icon: KeyRound,
  },
  {
    label: "Members",
    value: "32",
    meta: "+5 this week",
    metaClass: "text-brand-primary",
    Icon: Users,
  },
  {
    label: "Access Requests",
    value: "4",
    meta: "2 pending",
    metaClass: "text-warning",
    Icon: ClipboardList,
  },
];

const VAULTS = [
  { name: "Production", count: "86", tone: "bg-info/15 text-info" },
  { name: "Development", count: "54", tone: "bg-purple/15 text-purple" },
  { name: "Marketing", count: "21", tone: "bg-danger/15 text-danger" },
  { name: "Shared", count: "95", tone: "bg-brand-primary/15 text-brand-primary" },
] as const;

/**
 * Section — Visibility / centralized platform.
 * Left marketing copy + right static dashboard mock (no live data).
 * No decorative wave / particle background.
 */
export function LandingVisibility() {
  return (
    <section
      id="product"
      className={landingSectionFollow}
      aria-labelledby="landing-visibility-title"
    >
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] lg:gap-10 xl:gap-12">
        {/* Left copy */}
        <div className="max-w-md" data-reveal="">
          <p className="m-0 inline-flex items-center gap-2 rounded-full border border-brand-primary/45 bg-brand-primary/5 px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-brand-primary uppercase">
            <Shield className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
            Centralized security platform
          </p>

          <h2
            id="landing-visibility-title"
            className="mt-5 text-[clamp(1.85rem,3.4vw,2.55rem)] font-bold leading-[1.12] tracking-tight text-text-primary"
          >
            Full visibility.
            <br />
            <span className="text-brand-primary">Total control.</span>
          </h2>

          <p className="mt-4 text-[0.9375rem] leading-relaxed text-text-secondary">
            A single place to manage your secrets, users, access, and security
            posture.
          </p>

          <ul className="mt-7 m-0 flex list-none flex-col gap-4 p-0">
            {FEATURES.map(({ title, body, Icon }) => (
              <li key={title} className="flex items-start gap-3.5">
                <FeatureIconBezel>
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                </FeatureIconBezel>
                <div className="min-w-0 pt-0.5">
                  <div className="text-[14px] font-semibold tracking-tight text-text-primary">
                    {title}
                  </div>
                  <p className="mt-0.5 m-0 text-[13px] leading-relaxed text-text-secondary">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <Link
            href="/register"
            className="btn-shine mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-brand-primary px-5 text-sm font-semibold text-brand-on-primary shadow-[0_0_28px_rgb(25_224_111_/_0.35)] transition-colors duration-fast ease-sv hover:bg-brand-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            See it in action
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div
          className="min-w-0 [perspective:1400px]"
          data-reveal=""
          style={{ "--reveal-delay": "140ms" } as CSSProperties}
        >
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4.5 11.5 11.5 4.5M6 4.5h5.5V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Watch-bezel / gear ring around feature icons —
 * outer dots + radial tick marks (like a minute track).
 */
function FeatureIconBezel({ children }: { children: ReactNode }) {
  const cx = 22;
  const cy = 22;
  const dotCount = 52;
  const tickCount = 40;

  return (
    <span className="relative grid h-11 w-11 shrink-0 place-items-center text-text-primary">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_0_7px_rgb(25_224_111_/_0.55)]"
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
      >
        {/* Soft core fill */}
        <circle cx={cx} cy={cy} r="13.5" fill="rgb(25 224 111 / 0.06)" />

        {/* Thin guide ring under ticks */}
        <circle
          cx={cx}
          cy={cy}
          r="17.2"
          stroke="rgb(25 224 111 / 0.28)"
          strokeWidth="0.7"
        />

        {/* Radial tick marks (gear / watch minute track) */}
        {Array.from({ length: tickCount }, (_, i) => {
          const deg = (i / tickCount) * 360;
          const major = i % 5 === 0;
          return (
            <line
              key={`t-${i}`}
              x1={cx}
              y1={major ? 3.2 : 4.2}
              x2={cx}
              y2={major ? 7.4 : 6.6}
              stroke="#19E06F"
              strokeWidth={major ? 1.15 : 0.85}
              strokeLinecap="round"
              opacity={major ? 0.95 : 0.7}
              transform={`rotate(${deg} ${cx} ${cy})`}
            />
          );
        })}

        {/* Outer dotted ring */}
        {Array.from({ length: dotCount }, (_, i) => {
          const a = (i / dotCount) * Math.PI * 2 - Math.PI / 2;
          const r = 20.4;
          return (
            <circle
              key={`d-${i}`}
              cx={cx + Math.cos(a) * r}
              cy={cy + Math.sin(a) * r}
              r={i % 4 === 0 ? 0.85 : 0.55}
              fill="#19E06F"
              opacity={i % 4 === 0 ? 0.95 : 0.65}
            />
          );
        })}

        {/* Inner solid accent ring */}
        <circle
          cx={cx}
          cy={cy}
          r="12.2"
          stroke="rgb(25 224 111 / 0.4)"
          strokeWidth="0.9"
        />
      </svg>

      <span className="relative z-[1]">{children}</span>
    </span>
  );
}

function ScoreRing() {
  const r = 32;
  const c = 2 * Math.PI * r;
  const score = 92;
  const offset = c * (1 - score / 100);
  return (
    <div className="relative h-[76px] w-[76px]">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          className="stroke-border-subtle"
          strokeWidth="6.5"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          className="stroke-brand-primary drop-shadow-[0_0_8px_rgb(25_224_111_/_0.45)]"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-bold leading-none text-text-primary">
          92
        </span>
        <span className="text-[9px] text-text-muted">/100</span>
      </div>
    </div>
  );
}

function RiskDonut() {
  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] -rotate-90" aria-hidden="true">
      <circle cx="36" cy="36" r="24" fill="none" stroke="#1B2935" strokeWidth="10" />
      <circle
        cx="36"
        cy="36"
        r="24"
        fill="none"
        stroke="#8B6CFF"
        strokeWidth="10"
        strokeDasharray="22 151"
        strokeDashoffset="0"
      />
      <circle
        cx="36"
        cy="36"
        r="24"
        fill="none"
        stroke="#F5B82E"
        strokeWidth="10"
        strokeDasharray="40 151"
        strokeDashoffset="-22"
      />
      <circle
        cx="36"
        cy="36"
        r="24"
        fill="none"
        stroke="#19E06F"
        strokeWidth="10"
        strokeDasharray="68 151"
        strokeDashoffset="-62"
      />
    </svg>
  );
}

function MiniSpark() {
  return (
    <svg viewBox="0 0 64 20" className="h-3.5 w-12" aria-hidden="true">
      <path
        d="M1 14 C10 12, 14 8, 22 10 C30 12, 36 4, 44 6 C52 8, 58 3, 63 4"
        fill="none"
        stroke="#19E06F"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Decorative product dashboard — not wired to live data. */
function DashboardPreview() {
  return (
    <div
      className="origin-center overflow-hidden rounded-lg border border-brand-primary/30 bg-surface-card shadow-[0_0_0_1px_rgb(25_224_111_/_0.06),0_28px_80px_rgb(0_0_0_/_0.55),_-18px_12px_40px_rgb(0_0_0_/_0.35)] [transform:rotateY(-8deg)_rotateX(3deg)_rotateZ(-1.25deg)]"
      aria-hidden="true"
    >
      <div className="grid min-h-[440px] grid-cols-1 md:grid-cols-[172px_1fr]">
        {/* Sidebar */}
        <aside className="hidden flex-col border-r border-border-subtle bg-background-secondary p-2.5 md:flex">
          <div className="mb-2.5 flex items-center gap-2 px-1.5 pt-1">
            <SecureVaultLogo state="idle" size={22} decorative />
            <span className="text-[12px] font-semibold tracking-tight text-text-primary">
              {APP_NAME}
            </span>
          </div>

          <div className="mb-2.5 flex items-center gap-2 rounded-md border border-border-subtle bg-surface-elevated px-2 py-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-sm bg-brand-primary/15 text-[9px] font-bold text-brand-primary">
              A
            </span>
            <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-text-primary">
              Acme Corporation
            </span>
            <span className="text-[9px] text-text-muted">▾</span>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5">
            {NAV.map((item) => {
              const Icon = item.Icon;
              return (
                <div
                  key={item.label}
                  className={
                    item.active
                      ? "flex items-center gap-2 rounded-sm border-l-2 border-brand-primary bg-brand-primary/10 py-1.5 pr-2 pl-[6px] text-[10px] font-medium text-brand-primary"
                      : "flex items-center gap-2 rounded-sm px-2 py-1.5 text-[10px] font-medium text-text-muted"
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </nav>

          <div className="mt-2 flex items-center gap-2 border-t border-border-subtle px-1 pt-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-purple/20 text-[10px] font-bold text-purple">
              MH
            </span>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold text-text-primary">
                Mohamed Hesham
              </div>
              <div className="text-[9px] text-text-muted">Owner</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-col bg-background-primary/50 p-3 sm:p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 flex-1 items-center gap-2 rounded-md border border-border-subtle bg-background-secondary px-2.5">
              <Search className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.8} />
              <span className="flex-1 truncate text-[10px] text-text-muted">
                Search secrets, vaults, members…
              </span>
              <kbd className="rounded border border-border-subtle px-1 py-0.5 text-[9px] text-text-muted">
                ⌘K
              </kbd>
            </div>
            <div className="hidden items-center gap-1.5 text-text-muted sm:flex">
              <HeaderIcon>
                <Sun className="h-3.5 w-3.5" strokeWidth={1.8} />
              </HeaderIcon>
              <HeaderIcon badge>
                <Bell className="h-3.5 w-3.5" strokeWidth={1.8} />
              </HeaderIcon>
              <HeaderIcon>
                <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
              </HeaderIcon>
              <HeaderIcon>
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.8} />
              </HeaderIcon>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid gap-2 sm:grid-cols-[128px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-md border border-border-subtle bg-surface-elevated p-2.5">
              <div className="text-[9px] font-semibold tracking-[0.1em] text-text-muted uppercase">
                Security Score
              </div>
              <div className="mt-1.5">
                <ScoreRing />
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-brand-primary">
                  Excellent
                </span>
                <MiniSpark />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {METRICS.map((m) => {
                const Icon = m.Icon;
                return (
                  <div
                    key={m.label}
                    className="relative rounded-md border border-border-subtle bg-surface-elevated p-2.5"
                  >
                    <Icon
                      className="absolute top-2.5 right-2.5 h-3.5 w-3.5 text-brand-primary/70"
                      strokeWidth={1.8}
                    />
                    <div className="pr-5 text-[9px] text-text-muted">{m.label}</div>
                    <div className="mt-1 text-lg font-bold tracking-tight text-text-primary">
                      {m.value}
                    </div>
                    <div className={`mt-0.5 text-[9px] font-medium ${m.metaClass}`}>
                      {m.meta}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle */}
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            <div className="rounded-md border border-border-subtle bg-surface-elevated p-3">
              <div className="text-[11px] font-semibold text-text-primary">
                Recent Activity
              </div>
              <ul className="mt-2 flex list-none flex-col gap-2 p-0">
                {ACTIVITY.map((row) => (
                  <li key={row.name + row.time} className="flex items-center gap-2">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-[8px] font-bold ${row.tone}`}
                    >
                      {row.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] text-text-primary">
                        <span className="font-semibold">{row.name}</span>{" "}
                        <span className="text-text-secondary">{row.action}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[9px] text-text-muted">
                      {row.time}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-border-subtle bg-surface-elevated p-3">
              <div className="text-[11px] font-semibold text-text-primary">
                Secrets Exposure Risk
              </div>
              <div className="mt-3 flex items-center gap-4">
                <RiskDonut />
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-[10px]">
                  <li className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-purple" /> High · 3
                  </li>
                  <li className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-warning" /> Medium · 7
                  </li>
                  <li className="flex items-center gap-2 text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-brand-primary" /> Low · 12
                  </li>
                </ul>
              </div>
              <div className="mt-3 inline-flex h-7 items-center rounded-sm border border-brand-primary/50 px-2.5 text-[10px] font-semibold text-brand-primary">
                Go to Security Center →
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            <div className="rounded-md border border-border-subtle bg-surface-elevated p-3">
              <div className="text-[11px] font-semibold text-text-primary">Top Vaults</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {VAULTS.map((v) => (
                  <div
                    key={v.name}
                    className="flex items-center gap-2 rounded-sm border border-border-subtle bg-background-secondary px-2 py-1.5"
                  >
                    <span
                      className={`grid h-5 w-5 place-items-center rounded text-[9px] font-bold ${v.tone}`}
                    >
                      {v.name[0]}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[10px] font-medium text-text-primary">
                        {v.name}
                      </div>
                      <div className="text-[9px] text-text-muted">{v.count} secrets</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-border-subtle bg-surface-elevated p-3">
              <div className="text-[11px] font-semibold text-text-primary">
                Pending Access Requests
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-sm border border-border-subtle bg-background-secondary px-2.5 py-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-warning/15 text-[9px] font-bold text-warning">
                  AH
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold text-text-primary">Ahmad</div>
                  <div className="truncate text-[9px] text-text-muted">
                    Requesting AWS Production · 4h
                  </div>
                </div>
                <span className="grid h-6 w-6 place-items-center rounded-sm bg-brand-primary/15 text-brand-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
                <span className="grid h-6 w-6 place-items-center rounded-sm bg-danger/15 text-danger">
                  <X className="h-3.5 w-3.5" strokeWidth={2.2} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderIcon({
  children,
  badge,
}: {
  children: ReactNode;
  badge?: boolean;
}) {
  return (
    <span className="relative grid h-7 w-7 place-items-center rounded-md border border-border-subtle bg-background-secondary">
      {children}
      {badge ? (
        <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-warning" />
      ) : null}
    </span>
  );
}
