"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/** Every step of this flow, counting sign-in as the first. */
const TOTAL_STEPS = 6;

interface StepFrameProps {
  /** 1-based, counting sign-in as the first step. */
  step: number;
  title: string;
  description: string;
  /** The form or panel for this step. */
  children: ReactNode;
  /**
   * Pinned to the foot of the column. Back at the left edge; the primary
   * action at the right, with a skip link just before it.
   */
  actions: ReactNode;
}

/**
 * One setup step: the progress hairline, the question as the title, a line
 * of context, the step's own content, and the actions. On a phone they stick
 * to the bottom so Continue stays in reach; on a wider frame they pin to the
 * foot of the column so they sit in the same place on every step.
 */
export function StepFrame({
  step,
  title,
  description,
  children,
  actions,
}: StepFrameProps) {
  return (
    <div
      data-slot="step-frame"
      className="flex min-h-0 flex-1 flex-col gap-xxl pt-xl md:justify-between md:gap-section md:pt-section"
    >
      <div className="flex flex-col gap-xxl">
        <div className="flex flex-col gap-l md:gap-xl">
          <Progress
            value={step / TOTAL_STEPS}
            aria-label={`Step ${String(step)} of ${String(TOTAL_STEPS)}`}
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
      <div className="flex items-center justify-between gap-l max-md:sticky max-md:bottom-0 max-md:z-10 max-md:-mx-l max-md:mt-auto max-md:flex-col-reverse max-md:items-stretch max-md:gap-s max-md:border-t max-md:border-imagine-border max-md:bg-imagine-surface max-md:px-l max-md:pt-m max-md:pb-[max(var(--spacing-m),env(safe-area-inset-bottom))]">
        {actions}
      </div>
    </div>
  );
}

/** The way out of a step. Give it the step it goes back to. */
function StepFrameBack({ to, disabled }: { to: string; disabled?: boolean }) {
  const router = useRouter();
  return (
    <Button
      variant="link"
      disabled={disabled}
      className="text-imagine-foreground-muted max-md:self-start"
      onClick={() => {
        router.push(to);
      }}
    >
      Back
    </Button>
  );
}

StepFrame.Back = StepFrameBack;
