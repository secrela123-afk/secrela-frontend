import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function base(props: IconProps, children: ReactNode) {
  const { className, ...rest } = props;
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function IconOverview(p: IconProps) {
  return base(
    p,
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </>,
  );
}

export function IconVault(p: IconProps) {
  return base(
    p,
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="14.5" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 16.9v1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

/** Credentials / API keys — distinct from the padlock used for account security. */
export function IconSecret(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="8" cy="14" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10.6 11.8 19 4.8M16.2 4.8H19v2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.2 6.6l1.8 1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconLock(p: IconProps) {
  return base(
    p,
    <>
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 14.2v2.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

export function IconFolder(p: IconProps) {
  return base(
    p,
    <path
      d="M3.5 8.5V7a2 2 0 0 1 2-2h4l1.5 2H18.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-6.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />,
  );
}

export function IconTemplate(p: IconProps) {
  return base(
    p,
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

export function IconAccess(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="8" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12.5 10h5.5M15.5 7.5 18 10l-2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 18c.6-2.2 2.2-3.2 3.5-3.2S10.9 15.8 11.5 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconMembers(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="10" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 18.5c.7-2.4 2.6-3.5 4.5-3.5s3.8 1.1 4.5 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14 15c1.5 0 3 .7 3.7 2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconRoles(p: IconProps) {
  return base(
    p,
    <>
      <rect x="6.5" y="4" width="11" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 16.5c.5-1.4 1.6-2 3-2s2.5.6 3 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconOrganization(p: IconProps) {
  return base(
    p,
    <>
      <path
        d="M5 20V8.5A1.5 1.5 0 0 1 6.5 7h11A1.5 1.5 0 0 1 19 8.5V20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M3.5 20h17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M9 20v-4h6v4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 10.5h1.5M14.5 10.5H16M8 14h1.5M14.5 14H16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconSecurity(p: IconProps) {
  return base(
    p,
    <path
      d="M12 3.5 19 6.5v5.2c0 4.2-2.9 7.7-7 9.3-4.1-1.6-7-5.1-7-9.3V6.5L12 3.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />,
  );
}

export function IconAudit(p: IconProps) {
  return base(
    p,
    <path
      d="M7 4.5h10A2.5 2.5 0 0 1 19.5 7v13L12 16.5 4.5 20V7A2.5 2.5 0 0 1 7 4.5Z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />,
  );
}

export function IconAlert(p: IconProps) {
  return base(
    p,
    <>
      <path
        d="M12 4.5 20.5 19H3.5L12 4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 10v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
    </>,
  );
}

export function IconIntegrations(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 9.2 11.2 13.5M14 9.2 12.8 13.5" stroke="currentColor" strokeWidth="1.6" />
    </>,
  );
}

export function IconSettings(p: IconProps) {
  return base(
    p,
    <>
      <path
        d="M10 3.5h4l.55 2.15 2.05-.9 2 3.45-1.7 1.4.9 2.05H20.5v4h-2.7l-.9 2.05 1.7 1.4-2 3.45-2.05-.9L14 20.5h-4l-.55-2.15-2.05.9-2-3.45 1.7-1.4L6.2 12.4H3.5v-4h2.7l.9-2.05-1.7-1.4 2-3.45 2.05.9L10 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </>,
  );
}

export function IconSearch(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="11" cy="11" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 15.5 20 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

export function IconBell(p: IconProps) {
  return base(
    p,
    <>
      <path
        d="M6 16.5h12l-1.2-1.4a2 2 0 0 1-.4-1.2V10a4.4 4.4 0 1 0-8.8 0v3.9c0 .4-.14.85-.4 1.2L6 16.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

export function IconHelp(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.8 9.5a2.4 2.4 0 1 1 3.5 2.1c-.7.4-1.1.9-1.1 1.7V14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16.5" r="0.9" fill="currentColor" />
    </>,
  );
}

export function IconSun(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconChevronLeft(p: IconProps) {
  return base(
    p,
    <path d="M14.5 6.5 9.5 12l5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  );
}

export function IconChevronDown(p: IconProps) {
  return base(
    p,
    <path d="M6.5 9.5 12 15l5.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  );
}

export function IconCheck(p: IconProps) {
  return base(
    p,
    <path d="M5.5 12.5 10 17l8.5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  );
}

export function IconX(p: IconProps) {
  return base(
    p,
    <path d="M7 7l10 10M17 7 7 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  );
}

export function IconPlus(p: IconProps) {
  return base(
    p,
    <path d="M12 5.5v13M5.5 12h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  );
}

export function IconTrendUp(p: IconProps) {
  return base(
    p,
    <path d="M4 16.5 10 10l3.5 3.5L20 7.5M14.5 7.5H20v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />,
  );
}

export function IconUsers(p: IconProps) {
  return IconMembers(p);
}

export function IconUser(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="12" cy="8.5" r="2.7" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5.5 18.5c.8-2.8 3-4.2 6.5-4.2s5.7 1.4 6.5 4.2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconClipboard(p: IconProps) {
  return base(
    p,
    <>
      <rect x="6" y="5" width="12" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="9" y="3.2" width="6" height="3.2" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 11h6M9 14.5h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </>,
  );
}

export function IconKey(p: IconProps) {
  return IconSecret(p);
}

export function IconWarning(p: IconProps) {
  return IconAlert(p);
}

export function IconFilter(p: IconProps) {
  return base(
    p,
    <path
      d="M4 6h16M7 12h10M10 18h4"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />,
  );
}

export function IconClock(p: IconProps) {
  return base(
    p,
    <>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 8v4.5l3 1.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  );
}

export function IconListView(p: IconProps) {
  return base(
    p,
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />,
  );
}

export function IconGridView(p: IconProps) {
  return base(
    p,
    <>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" stroke="currentColor" strokeWidth="1.6" />
    </>,
  );
}

export function IconCreditCard(p: IconProps) {
  return base(
    p,
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 10h17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </>,
  );
}

export function IconChevronRight(p: IconProps) {
  return base(
    p,
    <path
      d="M9.5 6.5 14.5 12l-5 5.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
  );
}

export function IconCopy(p: IconProps) {
  return base(
    p,
    <>
      <rect x="8" y="8" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6 16H5.5A1.5 1.5 0 0 1 4 14.5v-9A1.5 1.5 0 0 1 5.5 4h9A1.5 1.5 0 0 1 16 5.5V6"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </>,
  );
}

export function IconMail(p: IconProps) {
  return base(
    p,
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m4.5 8 7.5 5 7.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>,
  );
}

export function IconReveal(p: IconProps) {
  return base(
    p,
    <>
      <path
        d="M3.5 12s3.2-5.5 8.5-5.5S20.5 12 20.5 12s-3.2 5.5-8.5 5.5S3.5 12 3.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </>,
  );
}
