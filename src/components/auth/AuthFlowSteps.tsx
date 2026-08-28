export const FORGOT_FLOW_STEPS = [
  "Email",
  "Check inbox",
  "New password",
  "Sign in",
] as const;

export const VERIFY_FLOW_STEPS = [
  "Create account",
  "Verify email",
  "Enter app",
] as const;

type AuthFlowStepsProps = {
  steps: readonly string[];
  /** 0-based index of the active step */
  current: number;
};

/**
 * Compact horizontal stepper for auth recovery / verify flows.
 */
export function AuthFlowSteps({ steps, current }: AuthFlowStepsProps) {
  return (
    <ol
      className="m-0 flex w-full list-none items-start p-0"
      aria-label="Progress"
    >
      {steps.map((label, index) => {
        const state =
          index < current ? "done" : index === current ? "current" : "todo";
        const dotClass =
          state === "current"
            ? "border-brand-primary bg-brand-primary text-brand-on-primary shadow-glow-green"
            : state === "done"
              ? "border-brand-primary/50 bg-brand-primary/15 text-brand-primary"
              : "border-border-subtle bg-background-secondary text-text-muted";
        const labelClass =
          state === "current"
            ? "text-text-primary"
            : state === "done"
              ? "text-text-secondary"
              : "text-text-muted";
        const connectorClass =
          index < current ? "bg-brand-primary/50" : "bg-border-subtle";

        return (
          <li
            key={label}
            className={`flex min-w-0 items-start ${index < steps.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex min-w-0 flex-col items-center gap-1.5">
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold leading-none ${dotClass}`}
                aria-current={state === "current" ? "step" : undefined}
                aria-hidden="true"
              >
                {index < current ? "✓" : index + 1}
              </span>
              <span
                className={`max-w-[4.5rem] text-center text-[10px] font-medium leading-tight sm:max-w-none sm:text-[11px] ${labelClass}`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <span
                className={`mx-1 mt-3 h-px min-w-[8px] flex-1 ${connectorClass}`}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
