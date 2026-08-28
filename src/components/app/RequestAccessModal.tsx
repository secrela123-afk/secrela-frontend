"use client";

import { useState, type FormEvent } from "react";

const DURATIONS = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 240, label: "4 hours" },
  { minutes: 480, label: "8 hours" },
  { minutes: 720, label: "12 hours" },
  { minutes: 1440, label: "24 hours" },
] as const;

export function RequestAccessModal({
  secretId,
  secretName,
  vaultName,
  busy,
  onClose,
  onSubmit,
}: {
  secretId: string;
  secretName: string;
  vaultName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    secretId: string;
    durationMinutes: number;
    reason: string;
  }) => Promise<void>;
}) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 8) {
      setFormError("Reason must be at least 8 characters.");
      return;
    }
    setFormError(null);
    await onSubmit({
      secretId,
      durationMinutes,
      reason: reason.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-md border border-border-subtle bg-surface-card shadow-card"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-[15px] font-semibold text-text-primary">
            Request Access
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-text-muted hover:text-text-primary"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          <div className="rounded-sm border border-border-subtle bg-background-secondary px-3 py-2.5">
            <p className="text-[13px] font-semibold text-text-primary">
              {secretName}
            </p>
            <p className="text-[11px] text-text-muted">{vaultName}</p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Permission
            </span>
            <input
              value="Use (temporary reveal)"
              disabled
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-3 text-[13px] text-text-muted"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Duration
            </span>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="h-10 w-full rounded-sm border border-border-default bg-background-secondary px-2.5 text-[13px] text-text-primary outline-none focus:border-brand-primary"
            >
              {DURATIONS.map((d) => (
                <option key={d.minutes} value={d.minutes}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
              Reason
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="e.g. Deploy production update"
              className="w-full resize-none rounded-sm border border-border-default bg-background-secondary px-3 py-2 text-[13px] text-text-primary outline-none focus:border-brand-primary focus:shadow-focus"
            />
          </label>
          {formError ? (
            <p className="text-[12px] text-danger">{formError}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="h-9 rounded-sm border border-border-default px-3.5 text-[13px] font-semibold text-text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-9 rounded-sm bg-brand-primary px-3.5 text-[13px] font-semibold text-brand-on-primary disabled:opacity-60"
            >
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
