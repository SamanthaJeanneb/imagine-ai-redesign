import { cn } from "cn";

import { Progress } from "@/components/ui/progress";

interface StepHeadingProps {
  title: string;
  /** 1-based step number and total, drives the progress hairline. */
  step: number;
  total: number;
  className?: string;
}

/** Onboarding step title with the progress hairline beneath it. */
export function StepHeading({
  title,
  step,
  total,
  className,
}: StepHeadingProps) {
  return (
    <div
      data-slot="step-heading"
      className={cn("flex flex-col gap-m", className)}
    >
      <h1 className="type-display">{title}</h1>
      <Progress
        value={total > 0 ? step / total : 0}
        aria-label={`Step ${String(step)} of ${String(total)}`}
        className="w-40"
      />
    </div>
  );
}
