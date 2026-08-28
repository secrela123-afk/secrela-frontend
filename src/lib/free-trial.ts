const FREE_TRIAL_USED_KEY = "sv_free_trial_used";

export function markFreeTrialUsedLocally(): void {
  try {
    localStorage.setItem(FREE_TRIAL_USED_KEY, "1");
  } catch {
    /* ignore private mode */
  }
}

export function hasUsedFreeTrialLocally(): boolean {
  try {
    return localStorage.getItem(FREE_TRIAL_USED_KEY) === "1";
  } catch {
    return false;
  }
}

export function syncFreeTrialUsedFromUser(freeTrialUsed?: boolean): void {
  if (freeTrialUsed) markFreeTrialUsedLocally();
}
