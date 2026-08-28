"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  getCurrentOrganizationRequest,
  meRequest,
} from "../../lib/api";
import {
  hasUsedFreeTrialLocally,
  syncFreeTrialUsedFromUser,
} from "../../lib/free-trial";
import { queryKeys } from "../../lib/query-keys";

export type LandingSession =
  | { status: "loading" }
  | { status: "guest"; freeTrialUsed: boolean }
  | {
      status: "authed";
      hasOrganization: boolean;
      freeTrialUsed: boolean;
      subscriptionExpired: boolean;
      onFreePlan: boolean;
    };

type LandingSessionData = Exclude<LandingSession, { status: "loading" }>;

async function fetchLandingSession(): Promise<LandingSessionData> {
  const localFreeTrialUsed = hasUsedFreeTrialLocally();

  try {
    const me = await meRequest();
    syncFreeTrialUsedFromUser(me.user.freeTrialUsed);
    const freeTrialUsed =
      Boolean(me.user.freeTrialUsed) || localFreeTrialUsed;

    if (!me.user.emailVerified) {
      return { status: "guest", freeTrialUsed: localFreeTrialUsed };
    }

    try {
      const org = await getCurrentOrganizationRequest();
      const organization = org.organization;
      return {
        status: "authed",
        hasOrganization: true,
        freeTrialUsed,
        subscriptionExpired: organization.subscriptionStatus === "expired",
        onFreePlan: organization.planSlug === "free",
      };
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "NO_ORGANIZATION" || err.status === 404)
      ) {
        return {
          status: "authed",
          hasOrganization: false,
          freeTrialUsed,
          subscriptionExpired: false,
          onFreePlan: false,
        };
      }
      if (
        err instanceof ApiError &&
        (err.code === "SUBSCRIPTION_EXPIRED" ||
          err.code === "SUBSCRIPTION_PAYMENT_REQUIRED")
      ) {
        return {
          status: "authed",
          hasOrganization: true,
          freeTrialUsed: true,
          subscriptionExpired: true,
          onFreePlan: true,
        };
      }
      return {
        status: "authed",
        hasOrganization: false,
        freeTrialUsed,
        subscriptionExpired: false,
        onFreePlan: false,
      };
    }
  } catch {
    return { status: "guest", freeTrialUsed: localFreeTrialUsed };
  }
}

/** Marketing CTAs — session + org presence (cached). */
export function useLandingSessionQuery(): LandingSession {
  const query = useQuery({
    queryKey: queryKeys.landingSession,
    queryFn: fetchLandingSession,
    staleTime: 30_000,
  });

  if (query.isPending) return { status: "loading" };
  return (
    query.data ?? { status: "guest", freeTrialUsed: hasUsedFreeTrialLocally() }
  );
}
