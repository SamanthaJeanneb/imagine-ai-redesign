import { cn } from "cn";

interface StepHeadingProps {
  title: string;
  /** One line under the title: what this step is for, or what it unlocks. */
  description?: string;
  /** 1-based step number and total, counting sign-in as the first step. */
  step: number;
  total: number;
  className?: string;
}

/**
 * Onboarding step title: one segment per step above, the question as the
 * title, and a line of context under it. Steps already done are foreground,
 * this one is accent, the rest are hairlines.
 */
export function StepHeading({
  title,
  description,
  step,
  total,
  className,
}: StepHeadingProps) {
  return (
    <div
      data-slot="step-heading"
      className={cn("flex flex-col gap-xxxl", className)}
    >
      <ol
        aria-label={`Step ${String(step)} of ${String(total)}`}
        className="flex w-64 max-w-full gap-xs"
      >
        {Array.from({ length: total }, (_, index) => {
          const number = index + 1;
          return (
            <li
              key={number}
              aria-current={number === step ? "step" : undefined}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-colors",
                number < step && "bg-imagine-foreground",
                number === step && "bg-imagine-secondary",
                number > step && "bg-imagine-border",
              )}
            />
          );
        })}
      </ol>
      <div className="flex flex-col gap-s">
        <h1 className="type-display text-balance">{title}</h1>
        {description === undefined ? null : (
          <p className="type-small text-imagine-foreground-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
