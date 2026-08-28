"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  acceptPendingInviteRequest,
  getPendingInviteForMeRequest,
  type AuthUser,
} from "../../lib/api";
import { CreateOrganizationForm } from "./CreateOrganizationForm";
import { toast } from "../../stores/toast-store";

/**
 * No membership yet: auto-join pending invite, otherwise create-org (owners only path).
 */
export function NoOrganizationGate({
  user,
  onJoinedOrCreated,
}: {
  user: AuthUser;
  onJoinedOrCreated: () => void;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"checking" | "joining" | "create-org">(
    "checking",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { invitation } = await getPendingInviteForMeRequest();
        if (cancelled) return;

        if (!invitation) {
          setPhase("create-org");
          return;
        }

        setPhase("joining");
        await acceptPendingInviteRequest();
        if (cancelled) return;
        toast.success(
          "Joined workspace",
          `You are now a member of ${invitation.organization.name}.`,
        );
        onJoinedOrCreated();
        router.replace("/app");
        router.refresh();
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Unable to join the invited workspace",
        );
        setPhase("create-org");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onJoinedOrCreated, router]);

  if (phase === "checking" || phase === "joining") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background-primary px-6 text-center text-text-secondary">
        <p className="text-[13px]">
          {phase === "joining"
            ? "Joining your team workspace…"
            : "Checking invitations…"}
        </p>
        {error ? (
          <p className="max-w-sm text-small text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <CreateOrganizationForm user={user} onCreated={onJoinedOrCreated} />
  );
}
