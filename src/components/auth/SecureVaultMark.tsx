import Link from "next/link";
import { APP_NAME } from "../../lib/brand";
import {
  SecureVaultLogo,
  type SecureVaultLogoState,
} from "../brand/SecureVaultLogo";

type SecureVaultMarkProps = {
  className?: string;
  state?: SecureVaultLogoState;
  size?: number;
};

/**
 * Brand mark for auth chrome — links back to the marketing landing.
 */
export function SecureVaultMark({
  className,
  state = "enter",
  size = 40,
}: SecureVaultMarkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-1.5 text-inherit no-underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:shadow-focus ${className ?? ""}`}
      aria-label={APP_NAME}
    >
      <SecureVaultLogo state={state} size={size} decorative />
      <span className="text-[15px] font-semibold tracking-tight text-text-primary">
        {APP_NAME}
      </span>
    </Link>
  );
}
