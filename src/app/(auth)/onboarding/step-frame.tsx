import { cn } from "cn";
import type { ReactNode } from "react";

import { Progress } from "@/components/ui/progress";

interface StepFrameProps {
  /** 1-based, counting sign-in as the first step. */
  step: number;
  total: number;
  title: string;
  description: string;
  /** The form or panel for this step. */
  children: ReactNode;
  /**
   * Pinned to the foot of the column. Back at the left edge; the primary
   * action at the right, with a skip link just before it.
   */
  actions: ReactNode;
  className?: string;
}

/**
 * One setup step: the progress hairline, the question as the title, a line
 * of context, the step's own content, and the actions pinned to the bottom
 * of the column so they sit in the same place on every step.
 */
export function StepFrame({
  step,
  total,
  title,
  description,
  children,
  actions,
  className,
}: StepFrameProps) {
  return (
    <div
      data-slot="step-frame"
      className={cn(
        "flex min-h-0 flex-1 flex-col justify-between gap-section pt-section",
        className,
      )}
    >
      <div className="flex flex-col gap-xxl">
        <div className="flex flex-col gap-xl">
          <Progress
            value={total > 0 ? step / total : 0}
            aria-label={`Step ${String(step)} of ${String(total)}`}
            className="w-40"
          />
          <div className="flex flex-col gap-s">
            <h1 className="type-display text-balance">{title}</h1>
            <p className="type-body text-imagine-foreground-muted">
              {description}
            </p>
          </div>
        </div>
        {children}
      </div>
      <div className="flex items-center justify-between gap-l">{actions}</div>
    </div>
  );
}
