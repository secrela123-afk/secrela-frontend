"use client";

import { useToastStore, type ToastTone } from "../../stores/toast-store";

const TONE_STYLES: Record<
  ToastTone,
  { bar: string; icon: string; border: string }
> = {
  success: {
    bar: "bg-brand-primary",
    icon: "text-brand-primary",
    border: "border-brand-primary/35",
  },
  error: {
    bar: "bg-danger",
    icon: "text-danger",
    border: "border-danger/40",
  },
  warning: {
    bar: "bg-warning",
    icon: "text-warning",
    border: "border-warning/40",
  },
  info: {
    bar: "bg-info",
    icon: "text-info",
    border: "border-info/40",
  },
};

function ToastIcon({ tone }: { tone: ToastTone }) {
  const className = `h-4 w-4 shrink-0 ${TONE_STYLES[tone].icon}`;
  if (tone === "success") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3.2 8.2 6.4 11.2 12.8 4.6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === "error") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (tone === "warning") {
    return (
      <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M8 3.2 13.5 13H2.5L8 3.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path
          d="M8 6.5v3.2M8 11.2h.01"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 7.2V11M8 5.2h.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Global toasts — slide down from top. Not for form/modal field errors.
 */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-4 sm:pt-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((item) => {
        const styles = TONE_STYLES[item.tone];
        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-md animate-sv-toast-in overflow-hidden rounded-md border bg-surface-card shadow-card ${styles.border}`}
          >
            <span className={`w-1 shrink-0 ${styles.bar}`} aria-hidden />
            <div className="flex min-w-0 flex-1 items-start gap-2.5 px-3.5 py-3">
              <ToastIcon tone={item.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-text-primary">
                  {item.title}
                </p>
                {item.message ? (
                  <p className="mt-0.5 text-[12px] leading-snug text-text-secondary">
                    {item.message}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="rounded-sm p-1 text-text-muted hover:text-text-primary"
                aria-label="Dismiss"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3.5 3.5l7 7M10.5 3.5l-7 7"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
