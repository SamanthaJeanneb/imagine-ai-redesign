import { cn } from "cn";

import { Progress } from "@/components/ui/progress";

interface StepHeadingProps {
  title: string;
  /** One line under the title: what this step is for, or what it unlocks. */
  description?: string;
  /** 1-based step number and total, drives the eyebrow and the hairline. */
  step: number;
  total: number;
  className?: string;
}

/**
 * Onboarding step title. "Step 1 of 3" above, the question as the title, a
 * line of context under it, and the progress hairline beneath.
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
      className={cn("flex flex-col gap-m", className)}
    >
      <div className="flex flex-col gap-xs">
        <span className="type-small font-medium text-imagine-foreground-muted">
          Step {step} of {total}
        </span>
        <h1 className="type-display text-balance">{title}</h1>
        {description === undefined ? null : (
          <p className="type-body text-imagine-foreground-muted">
            {description}
          </p>
        )}
      </div>
      <Progress
        value={total > 0 ? step / total : 0}
        aria-label={`Step ${String(step)} of ${String(total)}`}
        className="w-40"
      />
    </div>
  );
}
