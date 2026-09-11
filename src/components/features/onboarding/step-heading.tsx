import { cn } from "cn";

import { Progress } from "@/components/ui/progress";

interface StepHeadingProps {
  title: string;
  /** One line under the title: what this step is for, or what it unlocks. */
  description?: string;
  /** 1-based step number and total, drives the progress hairline. */
  step: number;
  total: number;
  className?: string;
}

/**
 * Onboarding step title: the progress hairline above, the question as the
 * title, and a line of context under it.
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
      className={cn("flex flex-col gap-xl", className)}
    >
      <Progress
        value={total > 0 ? step / total : 0}
        aria-label={`Step ${String(step)} of ${String(total)}`}
        className="w-40"
      />
      <div className="flex flex-col gap-s">
        <h1 className="type-display text-balance">{title}</h1>
        {description === undefined ? null : (
          <p className="type-body text-imagine-foreground-muted">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
