import { redirect } from "next/navigation";
import { ACCOUNT_SECURITY_PATH } from "../../lib/routes";

/** Alias — account security lives under the workspace shell. */
export default function AccountSecurityAliasPage() {
  redirect(ACCOUNT_SECURITY_PATH);
}
