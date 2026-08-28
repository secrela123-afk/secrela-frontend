export const FREE_TRIAL_DAYS = 14;
export const MAX_TRIAL_BONUS_DAYS = 14;
export const MAX_SINGLE_TRIAL_EXTENSION = 7;

export function trialDaysRemaining(trialEndsAt: string | null | undefined): number {
  if (!trialEndsAt) return 0;
  return Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86_400_000),
  );
}

export function formatTrialEndDate(trialEndsAt: string | null | undefined): string {
  if (!trialEndsAt) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(trialEndsAt));
}
