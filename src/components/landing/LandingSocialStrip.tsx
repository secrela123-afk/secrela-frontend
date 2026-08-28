"use client";

import { type ReactNode } from "react";
import { landingSection } from "./landing-classes";
import {
  ApiKeyIcon,
  AwsIcon,
  AzureIcon,
  CloudflareIcon,
  DatabaseCredIcon,
  DigitalOceanIcon,
  DiscordIcon,
  DockerIcon,
  EmailAccountIcon,
  EnvSecretIcon,
  FacebookIcon,
  GitHubIcon,
  GitLabIcon,
  GmailIcon,
  GoogleCloudIcon,
  HostingIcon,
  InstagramIcon,
  LicenseKeyIcon,
  LinkedInIcon,
  MongoDbIcon,
  MySqlIcon,
  NpmIcon,
  OutlookIcon,
  PasswordIcon,
  PostgresIcon,
  RecoveryCodeIcon,
  RedisIcon,
  SlackIcon,
  SshKeyIcon,
  StripeIcon,
  TelegramIcon,
  TikTokIcon,
  TokenIcon,
  VercelIcon,
  WhatsAppIcon,
  XIcon,
  YouTubeIcon,
} from "./credential-strip-icons";

type CredentialItem = {
  name: string;
  Icon: (props: { className?: string }) => ReactNode;
};

/**
 * Everything SecureVault stores — secret categories + real platforms/brands.
 * Matches product scope: passwords, API keys, DB, SSH, cloud, social, etc.
 */
const CREDENTIALS: CredentialItem[] = [
  { name: "Passwords", Icon: PasswordIcon },
  { name: "API Keys", Icon: ApiKeyIcon },
  { name: "Database Credentials", Icon: DatabaseCredIcon },
  { name: "SSH Keys", Icon: SshKeyIcon },
  { name: "OAuth Tokens", Icon: TokenIcon },
  { name: "License Keys", Icon: LicenseKeyIcon },
  { name: "Recovery Codes", Icon: RecoveryCodeIcon },
  { name: "Environment Secrets", Icon: EnvSecretIcon },
  { name: "Email Accounts", Icon: EmailAccountIcon },
  { name: "Hosting Access", Icon: HostingIcon },
  { name: "AWS", Icon: AwsIcon },
  { name: "Google Cloud", Icon: GoogleCloudIcon },
  { name: "Microsoft Azure", Icon: AzureIcon },
  { name: "Cloudflare", Icon: CloudflareIcon },
  { name: "DigitalOcean", Icon: DigitalOceanIcon },
  { name: "Vercel", Icon: VercelIcon },
  { name: "PostgreSQL", Icon: PostgresIcon },
  { name: "MongoDB", Icon: MongoDbIcon },
  { name: "MySQL", Icon: MySqlIcon },
  { name: "Redis", Icon: RedisIcon },
  { name: "GitHub", Icon: GitHubIcon },
  { name: "GitLab", Icon: GitLabIcon },
  { name: "Stripe", Icon: StripeIcon },
  { name: "Slack", Icon: SlackIcon },
  { name: "Docker", Icon: DockerIcon },
  { name: "npm", Icon: NpmIcon },
  { name: "Gmail", Icon: GmailIcon },
  { name: "Outlook", Icon: OutlookIcon },
  { name: "Facebook", Icon: FacebookIcon },
  { name: "Instagram", Icon: InstagramIcon },
  { name: "LinkedIn", Icon: LinkedInIcon },
  { name: "X", Icon: XIcon },
  { name: "YouTube", Icon: YouTubeIcon },
  { name: "TikTok", Icon: TikTokIcon },
  { name: "WhatsApp", Icon: WhatsAppIcon },
  { name: "Discord", Icon: DiscordIcon },
  { name: "Telegram", Icon: TelegramIcon },
];

function CredentialTrack({
  copy,
  items,
}: {
  copy: string;
  items: typeof CREDENTIALS;
}) {
  return (
    <ul
      className="flex list-none items-center gap-2.5 p-0 pr-2.5"
      aria-hidden={copy === "a" ? undefined : true}
    >
      {items.map(({ name, Icon }, index) => (
        <li
          key={`${copy}-${name}-${index}`}
          className="flex h-11 shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-surface-card px-3 shadow-card"
        >
          <Icon className="h-5 w-5 shrink-0 rounded-[5px]" />
          <span className="whitespace-nowrap text-xs font-medium text-text-primary sm:text-sm">
            {name}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Two identical halves for seamless -50% marquee loop. */
const LOOP_HALF = [...CREDENTIALS, ...CREDENTIALS];

/**
 * Credentials marquee — secret types + platforms (icon + label chips),
 * infinite scroll right → left.
 */
export function LandingSocialStrip() {
  return (
    <section
      id="platforms"
      className={`${landingSection} scroll-mt-24`}
      aria-labelledby="landing-social-title"
    >
      <h2
        id="landing-social-title"
        data-reveal=""
        className="mx-auto max-w-3xl px-2 text-center text-[clamp(1.35rem,2.4vw,1.75rem)] font-semibold tracking-tight text-text-primary"
      >
        Secure <span className="text-brand-primary">every secret</span> your
        business relies on
      </h2>
      <p
        data-reveal=""
        className="mx-auto mt-3 max-w-2xl px-2 text-center text-[13px] leading-relaxed text-text-secondary sm:text-sm"
      >
        Passwords, API keys, databases, cloud access, email, social accounts,
        license keys, recovery codes, and more — all in one encrypted vault.
      </p>

      <div className="relative mx-auto mt-8 w-full max-w-[1080px] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-background-primary to-transparent sm:w-10"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-background-primary to-transparent sm:w-10"
          aria-hidden="true"
        />

        <div className="flex w-max animate-sv-marquee hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:justify-center">
          <CredentialTrack copy="a" items={LOOP_HALF} />
          <CredentialTrack copy="b" items={LOOP_HALF} />
        </div>
      </div>
    </section>
  );
}
