"use client";

import { useId, type ReactNode } from "react";

/** Shared chip icon wrapper — 24×24 rounded square. */
function chipIcon(
  fill: string,
  inner: ReactNode,
  className?: string,
) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill={fill} />
      {inner}
    </svg>
  );
}

/* ── Generic secret types (product categories) ── */

export function PasswordIcon({ className }: { className?: string }) {
  return chipIcon(
    "#14532d",
    <path
      fill="#22D35A"
      d="M12 5.5a3 3 0 0 1 3 3V10h.8c.7 0 1.2.5 1.2 1.2v5.1c0 .7-.5 1.2-1.2 1.2H8.2c-.7 0-1.2-.5-1.2-1.2v-5.1c0-.7.5-1.2 1.2-1.2H9V8.5a3 3 0 0 1 3-3Zm0 1.8a1.2 1.2 0 0 0-1.2 1.2V10h2.4V8.5A1.2 1.2 0 0 0 12 7.3Z"
    />,
    className,
  );
}

export function ApiKeyIcon({ className }: { className?: string }) {
  return chipIcon(
    "#1e293b",
    <path
      fill="#22D35A"
      d="M8.2 7.6a3.4 3.4 0 0 1 5.3-.4l.3.3 1.1-1.1 1.2 1.2-1.1 1.1.8.8a3.4 3.4 0 0 1-5.3.4l-.8-.8-2.1 2.1-1.2-1.2 2.1-2.1-.3-.3Zm3.4 1.4a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8Z"
    />,
    className,
  );
}

export function DatabaseCredIcon({ className }: { className?: string }) {
  return chipIcon(
    "#0f172a",
    <>
      <ellipse cx="12" cy="8.2" rx="5.2" ry="2" fill="#22D35A" />
      <path
        fill="#16a34a"
        d="M6.8 8.2v7.6c0 1.1 2.3 2 5.2 2s5.2-.9 5.2-2V8.2c0 1.1-2.3 2-5.2 2s-5.2-.9-5.2-2Z"
      />
    </>,
    className,
  );
}

export function SshKeyIcon({ className }: { className?: string }) {
  return chipIcon(
    "#111827",
    <>
      <rect x="5" y="6" width="14" height="12" rx="2" fill="#1f2937" stroke="#22D35A" strokeWidth="1.2" />
      <path fill="#22D35A" d="M7.5 9.2h9v1.2h-9V9.2Zm0 2.4h6v1.2h-6v-1.2Zm0 2.4h4v1.2h-4v-1.2Z" />
    </>,
    className,
  );
}

export function TokenIcon({ className }: { className?: string }) {
  return chipIcon(
    "#312e81",
    <path
      fill="#a5b4fc"
      d="M12 5.5 15.8 8l-1.4 4.8H9.6L8.2 8 12 5.5Zm0 9.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z"
    />,
    className,
  );
}

export function LicenseKeyIcon({ className }: { className?: string }) {
  return chipIcon(
    "#422006",
    <path
      fill="#fbbf24"
      d="M7.5 7.2h9v9.6h-9V7.2Zm1.8 1.8v1.8h1.8V9h-1.8Zm3.6 0v1.8h1.8V9h-1.8Zm-3.6 3.6v1.8h5.4v-1.8H9.3Z"
    />,
    className,
  );
}

export function RecoveryCodeIcon({ className }: { className?: string }) {
  return chipIcon(
    "#1e293b",
    <>
      <rect x="6.5" y="6.5" width="4.2" height="4.2" rx="1" fill="#22D35A" />
      <rect x="13.3" y="6.5" width="4.2" height="4.2" rx="1" fill="#22D35A" opacity="0.75" />
      <rect x="6.5" y="13.3" width="4.2" height="4.2" rx="1" fill="#22D35A" opacity="0.75" />
      <rect x="13.3" y="13.3" width="4.2" height="4.2" rx="1" fill="#22D35A" />
    </>,
    className,
  );
}

export function EnvSecretIcon({ className }: { className?: string }) {
  return chipIcon(
    "#0f172a",
    <path
      fill="#22D35A"
      d="M8.2 7.8h7.6v1.6H8.2V7.8Zm0 3.2h5.4v1.6H8.2v-1.6Zm0 3.2h7.6V16H8.2v-1.8Z"
      opacity="0.9"
    />,
    className,
  );
}

export function EmailAccountIcon({ className }: { className?: string }) {
  return chipIcon(
    "#1e3a5f",
    <path
      fill="#60a5fa"
      d="M5.5 8.2h13v7.6h-13V8.2Zm1.8 1.6v.1l4.7 3 4.7-3v-.1H7.3Z"
    />,
    className,
  );
}

export function HostingIcon({ className }: { className?: string }) {
  return chipIcon(
    "#111827",
    <>
      <rect x="6" y="7" width="12" height="3" rx="1" fill="#374151" />
      <rect x="6" y="11" width="12" height="3" rx="1" fill="#22D35A" opacity="0.85" />
      <rect x="6" y="15" width="12" height="3" rx="1" fill="#374151" />
      <circle cx="8.2" cy="8.5" r="0.7" fill="#22D35A" />
      <circle cx="8.2" cy="12.5" r="0.7" fill="#111827" />
      <circle cx="8.2" cy="16.5" r="0.7" fill="#22D35A" />
    </>,
    className,
  );
}

/* ── Cloud & infrastructure ── */

export function AwsIcon({ className }: { className?: string }) {
  return chipIcon(
    "#232F3E",
    <path
      fill="#FF9900"
      d="M7.2 14.2c3.1 2.3 7.6 3.5 11.5 3.5 2.7 0 5.6-.5 8.3-1.7l.3-.1v-1.2l-.4.2c-2.5 1.1-5.2 1.6-7.9 1.6-3.6 0-7.1-1.1-9.8-3.1l-.3-.2.3 1Zm0-2.8c3.1 2.2 7.4 3.4 11.2 3.4 2.3 0 4.7-.4 6.9-1.2l.4-.2v-1.1l-.5.2c-2.1.8-4.3 1.2-6.5 1.2-3.4 0-6.7-1-9.3-2.9l-.3-.2.3 1Zm11.8-2.4c.4.3.5.7.5 1.2 0 .5-.2 1-.5 1.3-.4.3-.9.5-1.5.5H7.8c-.6 0-1.1-.2-1.5-.5-.4-.3-.5-.8-.5-1.3 0-.5.2-1 .5-1.3.4-.3.9-.5 1.5-.5h9.2c.6 0 1.1.2 1.5.5Z"
      transform="translate(-4 -1) scale(0.72)"
    />,
    className,
  );
}

export function GoogleCloudIcon({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="6" fill="#1a2332" />
      <path fill={`url(#gcp-a-${gid})`} d="M12 6.5 17.2 9v5l-5.2 2.5L6.8 14V9l5.2-2.5Z" />
      <path fill={`url(#gcp-b-${gid})`} d="M6.8 9 12 6.5 12 14l-5.2-2.5V9Z" />
      <path fill="#FBBC04" d="M12 6.5 17.2 9 12 14V6.5Z" />
      <path fill="#FBBC04" d="M12 14 17.2 9v5L12 14Z" />
      <defs>
        <linearGradient id={`gcp-a-${gid}`} x1="6.8" y1="9" x2="17.2" y2="14">
          <stop stopColor="#4285F4" />
          <stop offset="1" stopColor="#34A853" />
        </linearGradient>
        <linearGradient id={`gcp-b-${gid}`} x1="6.8" y1="9" x2="12" y2="14">
          <stop stopColor="#EA4335" />
          <stop offset="1" stopColor="#FBBC04" />
        </linearGradient>
        <linearGradient id={`gcp-c-${gid}`} x1="12" y1="6.5" x2="17.2" y2="14">
          <stop stopColor="#4285F4" />
          <stop offset="1" stopColor="#EA4335" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AzureIcon({ className }: { className?: string }) {
  return chipIcon(
    "#0078D4",
    <path fill="#fff" d="m6.2 16.8 3.2-8.6 2.4 4.6 2.2-4.6 3 8.6H6.2Z" />,
    className,
  );
}

export function CloudflareIcon({ className }: { className?: string }) {
  return chipIcon(
    "#F38020",
    <path
      fill="#fff"
      d="M12 7.2c1.8 0 3.2 1.2 3.6 2.9h1.1c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8H7.3c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2h.3c.4-1.7 1.8-2.9 3.6-2.9Z"
    />,
    className,
  );
}

export function DigitalOceanIcon({ className }: { className?: string }) {
  return chipIcon(
    "#0080FF",
    <>
      <rect x="10.5" y="6" width="3" height="3" rx="1.5" fill="#fff" />
      <rect x="10.5" y="10.5" width="3" height="3" rx="1.5" fill="#fff" opacity="0.85" />
      <rect x="10.5" y="15" width="3" height="3" rx="1.5" fill="#fff" opacity="0.7" />
    </>,
    className,
  );
}

export function VercelIcon({ className }: { className?: string }) {
  return chipIcon(
    "#000",
    <path fill="#fff" d="M7 17.5 12 6.5l5 11H7Z" />,
    className,
  );
}

/* ── Databases ── */

export function PostgresIcon({ className }: { className?: string }) {
  return chipIcon(
    "#336791",
    <path
      fill="#fff"
      d="M14.2 8.2c-.8-.5-1.8-.4-2.4.2-.5.5-.7 1.2-.5 1.9.3 1.2 1.6 2 2.9 1.8.9-.1 1.7-.7 2-1.5.4-1-.1-2.2-1-2.4Zm-3.8 1.1c-.3 1.5.2 3.1 1.3 4.2 1.2 1.2 3 1.7 4.6 1.3-.2.8-.8 1.5-1.6 1.8-1.5.6-3.2-.2-3.9-1.7-.4-.9-.3-2 .2-2.8-.3-.1-.4-.4-.6-.8Z"
    />,
    className,
  );
}

export function MongoDbIcon({ className }: { className?: string }) {
  return chipIcon(
    "#001E2B",
    <path
      fill="#00ED64"
      d="M12 5.5c-.1 2.1-.7 3.6-1.5 5.1-.9 1.6-1.8 3.2-1.9 5.5 0 1.8.4 3.2 1 4.4.1-.9.3-1.8.7-2.6.6-1.2 1.4-2.2 2-3.4.6-1.1 1.1-2.3 1.2-3.7.1-1.5-.2-2.8-.5-4.3Z"
    />,
    className,
  );
}

export function MySqlIcon({ className }: { className?: string }) {
  return chipIcon(
    "#00758F",
    <path
      fill="#F29111"
      d="M8.5 8.2c1.2-.3 2.5-.2 3.6.3 1.2.6 2.1 1.7 2.4 3-.2-.1-.5-.2-.8-.2-1.4 0-2.6 1-2.8 2.4-.2 1.5.8 2.9 2.2 3.2 1.6.4 3.3-.5 3.8-2 .5-1.3 0-2.8-1.2-3.5-1.2-.7-2.8-.4-3.7.5-.5.5-.8 1.2-.8 1.9 0 .3 0 .5.1.8-.8-.4-1.4-1.1-1.6-2-.2-1.2.4-2.4 1.4-3.1.8-.6 1.8-.9 2.8-.9.2 0 .4 0 .6.1Z"
    />,
    className,
  );
}

export function RedisIcon({ className }: { className?: string }) {
  return chipIcon(
    "#DC382D",
    <>
      <path fill="#fff" d="M12 6.5 17 9l-5 2.5L7 9l5-2.5Z" opacity="0.95" />
      <path fill="#fff" d="M7 11.5l5 2.5 5-2.5v3L12 17l-5-2.5v-3Z" opacity="0.85" />
    </>,
    className,
  );
}

/* ── Dev & business tools ── */

export function GitHubIcon({ className }: { className?: string }) {
  return chipIcon(
    "#24292f",
    <path
      fill="#fff"
      d="M12 5.8c-3.6 0-6.5 2.9-6.5 6.5 0 2.9 1.9 5.3 4.5 6.1.3.1.4-.1.4-.3v-2.1c-1.8.4-2.2-.9-2.2-.9-.3-.8-.7-1-.7-1-.6-.4 0-.4 0-.4.7 0 1 .7 1 .7.6 1.1 1.6.8 2 .6.1-.5.2-.8.4-1-1.4-.2-2.9-.7-2.9-3.1 0-.7.2-1.2.6-1.7-.1-.2-.3-.9.1-1.8 0 0 .5-.2 1.7.6.5-.1 1-.2 1.5-.2s1 .1 1.5.2c1.2-.8 1.7-.6 1.7-.6.4 1 .2 1.6.1 1.8.4.5.6 1 .6 1.7 0 2.4-1.5 2.9-2.9 3.1.2.2.4.6.4 1.2v1.8c0 .2.1.4.4.3 2.6-.8 4.5-3.2 4.5-6.1 0-3.6-2.9-6.5-6.5-6.5Z"
    />,
    className,
  );
}

export function GitLabIcon({ className }: { className?: string }) {
  return chipIcon(
    "#FC6D26",
    <path fill="#fff" d="M12 6.2 14.8 12H9.2L12 6.2Zm-4.2 5.8L12 18.8l4.2-6.8H7.8Z" />,
    className,
  );
}

export function StripeIcon({ className }: { className?: string }) {
  return chipIcon(
    "#635BFF",
    <path
      fill="#fff"
      d="M9.2 8.8c0-.8.7-1.1 1.8-1.1 1.6 0 3.6.5 5.2 1.3v4.8c0 2.4-2 4.2-4.9 4.2-1.6 0-3-.4-4.1-1.1v-2.4c1.1.7 2.4 1.1 3.7 1.1 1.5 0 2.2-.5 2.2-1.3 0-.8-.6-1.1-2-1.4-2.3-.5-3.9-1.2-3.9-3.4V8.8Z"
    />,
    className,
  );
}

export function SlackIcon({ className }: { className?: string }) {
  return chipIcon(
    "#4A154B",
    <>
      <rect x="6.5" y="10.5" width="3.5" height="7" rx="1.5" fill="#36C5F0" />
      <rect x="10.5" y="6.5" width="7" height="3.5" rx="1.5" fill="#2EB67D" />
      <rect x="14" y="10.5" width="3.5" height="7" rx="1.5" fill="#E01E5A" />
      <rect x="6.5" y="14" width="7" height="3.5" rx="1.5" fill="#ECB22E" />
    </>,
    className,
  );
}

export function DockerIcon({ className }: { className?: string }) {
  return chipIcon(
    "#2496ED",
    <path
      fill="#fff"
      d="M6.5 13.2h1.4v-1.3H6.5v1.3Zm1.8 0h1.4v-1.3H8.3v1.3Zm1.8 0h1.4v-1.3h-1.4v1.3Zm1.8 0h1.4v-1.3h-1.4v1.3Zm-5.4 1.8h1.4v-1.3H6.5v1.3Zm1.8 0h1.4v-1.3H8.3v1.3Zm1.8 0h1.4v-1.3h-1.4v1.3Zm1.8 0h1.4v-1.3h-1.4v1.3Zm1.8 0h1.4v-1.3h-1.4v1.3Zm-9 1.8h1.4v-1.3H6.5v1.3Zm10.8-5.4c-.6-.4-1.4-.7-2.2-.8-.3-1.2-1.1-2.2-2.1-2.9-.1 1.3.4 2.6 1.2 3.6h-8.9c-.8 0-1.4.6-1.5 1.4-.1.5-.2 1-.2 1.5 0 .5.1 1 .2 1.5h11.5c1 0 1.9-.4 2.5-1.1.7-.8 1.1-1.9 1.1-3 0-.5-.1-1-.6-1.2Z"
    />,
    className,
  );
}

export function NpmIcon({ className }: { className?: string }) {
  return chipIcon(
    "#CB3837",
    <path fill="#fff" d="M6.5 6.5h11v11h-3.5v-3.5H10v3.5H6.5V6.5Z" />,
    className,
  );
}

export function GmailIcon({ className }: { className?: string }) {
  return chipIcon(
    "#1a2332",
    <>
      <path fill="#EA4335" d="M7 8.5 12 12.2 17 8.5v7H7V8.5Z" />
      <path fill="#FBBC04" d="M7 8.5 12 12.2 17 8.5H7Z" opacity="0.95" />
      <path fill="#34A853" d="M7 15.5V8.5l5 3.7v3.3H7Z" />
      <path fill="#4285F4" d="M17 8.5v7h-5v-3.3l5-3.7Z" />
    </>,
    className,
  );
}

export function OutlookIcon({ className }: { className?: string }) {
  return chipIcon(
    "#0078D4",
    <>
      <rect x="6" y="8" width="8" height="8" rx="1" fill="#fff" opacity="0.95" />
      <path fill="#0078D4" d="M8 10.5h4v3H8v-3Z" />
      <path fill="#28A8EA" d="M14.5 9.5h3v5h-3l1.5-2.5-1.5-2.5Z" />
    </>,
    className,
  );
}

/* ── Social platforms ── */

export function FacebookIcon({ className }: { className?: string }) {
  return chipIcon(
    "#1877F2",
    <path
      fill="#fff"
      d="M15.1 12.4h-1.9v6.9H10v-6.9H8.4V9.7H10V8c0-1.6.8-2.6 2.7-2.6h1.7v2.6h-1.1c-.8 0-.9.3-.9.9v.8h2.1l-.4 2.7Z"
    />,
    className,
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id={`ig-${gid}`} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill={`url(#ig-${gid})`} />
      <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.6" r="1" fill="#fff" />
    </svg>
  );
}

export function LinkedInIcon({ className }: { className?: string }) {
  return chipIcon(
    "#0A66C2",
    <path
      fill="#fff"
      d="M7.4 10.2H5.2V18h2.2v-7.8ZM6.3 6.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6ZM18.8 13.2c0-2.1-1.1-3.1-2.7-3.1-.9 0-1.6.4-2 1.1V10.2h-2.2c0 .4 0 7.8 0 7.8h2.2v-4.4c0-.2 0-.5.1-.7.2-.5.7-1.1 1.5-1.1 1.1 0 1.5.8 1.5 2v4.2h2.2v-4.8Z"
    />,
    className,
  );
}

export function XIcon({ className }: { className?: string }) {
  return chipIcon(
    "#000",
    <path fill="#fff" d="M16.4 6.2h1.8l-3.9 4.5 4.6 6.1h-3.6l-2.8-3.7-3.2 3.7H7.5l4.2-4.8-4.4-5.8h3.7l2.5 3.4 3-3.4Zm-.7 9.7h1L9.4 7.3H8.3l7.4 8.6Z" />,
    className,
  );
}

export function YouTubeIcon({ className }: { className?: string }) {
  return chipIcon(
    "#FF0000",
    <path fill="#fff" d="M10 8.8v6.4l5.4-3.2L10 8.8Z" />,
    className,
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return chipIcon(
    "#010101",
    <path
      fill="#fff"
      d="M15.2 5.2c.3 1.5 1.2 2.6 2.6 2.9v1.8c-.9.1-1.8-.1-2.6-.6v4c0 2.4-1.7 4.1-4.1 4.1S7 15.7 7 13.3s1.7-4.1 4.1-4.1c.2 0 .4 0 .6.1v1.9c-.2-.1-.4-.1-.6-.1-1.2 0-2.2 1-2.2 2.2s1 2.2 2.2 2.2 2.2-1 2.2-2.2V5.2h1.9Z"
    />,
    className,
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return chipIcon(
    "#25D366",
    <path
      fill="#fff"
      d="M12 4.4A7.5 7.5 0 0 0 5.4 15.7L4.5 19.4l3.8-1A7.5 7.5 0 1 0 12 4.4Zm4.2 10.6c-.2.5-1 1-1.6 1.1-.4.1-.9.1-1.5-.1-.8-.3-1.9-.8-3.1-1.7-1.6-1.2-2.6-2.8-2.8-3-.2-.3-.9-1.4-.1-2.5.2-.3.6-.5.9-.5h.7c.2 0 .3 0 .5.4l.7 1.8c.1.2 0 .4-.1.5l-.3.4c-.1.1-.2.3-.1.5.4.6 1 1.3 1.6 1.8.6.5 1.2.8 1.5.9.2.1.4 0 .6-.2l.5-.6c.1-.2.3-.2.5-.1l1.7.8c.2.1.3.1.4.3-.1.2-.1.6-.3 1.1Z"
    />,
    className,
  );
}

export function DiscordIcon({ className }: { className?: string }) {
  return chipIcon(
    "#5865F2",
    <path
      fill="#fff"
      d="M17.4 7.3A10.8 10.8 0 0 0 14.8 6.5l-.2.5a9.6 9.6 0 0 1 2.3 1 8.9 8.9 0 0 0-7.3 0 9.3 9.3 0 0 1 2.3-1l-.2-.5A10.8 10.8 0 0 0 9.1 7.3C6.9 10.6 6.3 13.6 6.6 16.7a11 11 0 0 0 3.4 1.7l.7-1.1c-.3-.1-.7-.3-1.1-.5l.3-.2c2.1.9 4.3.9 6.3 0l.3.2c-.4.2-.7.4-1.1.5l.7 1.1a11 11 0 0 0 3.4-1.7c.4-3.5-.5-6.5-2.1-9.4ZM10.4 14.6c-.6 0-1.2-.6-1.2-1.3s.5-1.3 1.2-1.3 1.2.6 1.2 1.3-.6 1.3-1.2 1.3Zm3.4 0c-.6 0-1.2-.6-1.2-1.3s.5-1.3 1.2-1.3 1.2.6 1.2 1.3-.5 1.3-1.2 1.3Z"
    />,
    className,
  );
}

export function TelegramIcon({ className }: { className?: string }) {
  return chipIcon(
    "#26A5E4",
    <path
      fill="#fff"
      d="M7.2 11.8 16.8 7.5c.5-.2 1 .2.8.8l-1.5 7.1c-.2.7-.9.9-1.4.6l-3.9-2.9-1.9 1.8c-.2.2-.5.3-.8.2l.3-3.6 7.2-6.5c.3-.3-.1-.4-.5-.2L6.8 12.8l-3.7-1.2c-.8-.3-.8-.8.1-1.2Z"
    />,
    className,
  );
}
