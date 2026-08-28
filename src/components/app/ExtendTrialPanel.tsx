"use client";

import { useState } from "react";
import { ApiError, extendTrialRequest, type ExtendTrialResponse } from "../../lib/api";
import {
  MAX_SINGLE_TRIAL_EXTENSION,
  MAX_TRIAL_BONUS_DAYS,
} from "../../lib/subscription";

type ExtendTrialPanelProps = {
  bonusDaysRemaining: number;
  compact?: boolean;
  onExtended?: (result: ExtendTrialResponse) => void;
};

export function ExtendTrialPanel({
  bonusDaysRemaining,
  compact,
  onExtended,
}: ExtendTrialPanelProps) {
  const [days, setDays] = useState(
    Math.min(7, Math.max(1, bonusDaysRemaining)),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (bonusDaysRemaining <= 0) {
    return (
      <p className="text-[12px] text-text-muted">
        No bonus trial days remain for this workspace (max {MAX_TRIAL_BONUS_DAYS}{" "}
        total).
      </p>
    );
  }

  async function onExtend() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await extendTrialRequest(days);
      setSuccess(`Added ${days} day(s). Trial active again.`);
      onExtended?.(result);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to extend the trial",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-[12px] text-text-secondary">
        Grant up to {MAX_SINGLE_TRIAL_EXTENSION} days per request ({bonusDaysRemaining}{" "}
        bonus day(s) left of {MAX_TRIAL_BONUS_DAYS} lifetime cap).
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="block text-[12px] font-medium text-text-primary">
          Days to add
          <input
            type="number"
            min={1}
            max={Math.min(MAX_SINGLE_TRIAL_EXTENSION, bonusDaysRemaining)}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="mt-1.5 h-10 w-24 rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
          />
        </label>
        <button
          type="button"
          disabled={loading}
          onClick={() => void onExtend()}
          className="h-10 rounded-sm bg-brand-primary px-4 text-[13px] font-semibold text-brand-on-primary shadow-glow-green hover:bg-brand-primary-hover disabled:opacity-60"
        >
          {loading ? "Adding…" : "Extend trial"}
        </button>
      </div>
      {error ? (
        <p className="text-[12px] text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-[12px] text-brand-primary" role="status">
          {success}
        </p>
      ) : null}
    </div>
  );
}
