import { redirect } from "next/navigation";
import { BILLING_PATH } from "../../lib/routes";

/** Alias — in-app billing lives under the workspace shell. */
export default function BillingAliasPage() {
  redirect(BILLING_PATH);
}
