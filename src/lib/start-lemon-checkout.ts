import {
  ApiError,
  createBillingCheckoutRequest,
} from "./api";
import type { PaidPlanSlug } from "./plan-catalog";

export type BillingInterval = "monthly" | "yearly";

/**
 * Start Creem hosted checkout and leave this app immediately.
 * Returns true when navigation (or mock activation) succeeded.
 */
export async function startLemonCheckout(input: {
  planSlug: PaidPlanSlug;
  interval: BillingInterval;
  onMockActivated?: () => void;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const result = await createBillingCheckoutRequest({
      planSlug: input.planSlug,
      interval: input.interval,
    });
    if (result.mockActivated) {
      input.onMockActivated?.();
      return { ok: true };
    }
    if (!result.checkoutUrl) {
      return { ok: false, message: "Creem did not return a checkout URL" };
    }
    window.location.assign(result.checkoutUrl);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof ApiError ? err.message : "Could not start card checkout",
    };
  }
}
