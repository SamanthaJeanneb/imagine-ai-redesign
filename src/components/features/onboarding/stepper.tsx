"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Icon } from "@/components/ui/icon";
import { fade, spring, stagger } from "@/styles/motion";

export interface Step {
  id: string;
  label: string;
}

interface StepperProps {
  steps: readonly Step[];
  /** Index of the current step. Everything before it is done. */
  current: number;
  onSelect?: (index: number) => void;
  className?: string;
}

/**
 * Vertical onboarding steps: done steps show a check, the current step is a
 * filled accent number, upcoming steps fade back. A hairline connects them.
 */
export function Stepper({ steps, current, onSelect, className }: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      aria-label="Setup progress"
      className={cn("flex flex-col", className)}
    >
      {steps.map((step, index) => {
        const state =
          index < current ? "done" : index === current ? "current" : "upcoming";
        const last = index === steps.length - 1;
        const clickable = state === "done" && onSelect !== undefined;

        return (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...fade.base, delay: index * stagger.list }}
            className="relative flex gap-m"
          >
            {last ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-6 bottom-0 left-[11px] w-px",
                  state === "done"
                    ? "bg-imagine-foreground-faint"
                    : "bg-imagine-border",
                )}
              />
            )}
            <button
              type="button"
              disabled={!clickable}
              aria-current={state === "current" ? "step" : undefined}
              onClick={
                clickable
                  ? () => {
                      onSelect(index);
                    }
                  : undefined
              }
              className={cn(
                "flex items-center gap-m pb-xl text-left outline-none focus-visible:underline disabled:cursor-default",
                last && "pb-0",
              )}
            >
              <motion.span
                layout
                transition={spring.snappy}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full type-small font-semibold tabular-nums",
                  state === "done" &&
                    "bg-imagine-surface-raised text-imagine-foreground-muted",
                  state === "current" &&
                    "bg-imagine-secondary text-imagine-secondary-foreground ring-4 ring-imagine-secondary-soft",
                  state === "upcoming" &&
                    "bg-imagine-surface-raised/60 text-imagine-foreground-faint",
                )}
              >
                {state === "done" ? (
                  <Icon name="check" size="s" active />
                ) : (
                  index + 1
                )}
              </motion.span>
              <span
                className={cn(
                  "type-body",
                  state === "current" && "font-semibold",
                  state === "done" && "text-imagine-foreground-muted",
                  state === "upcoming" && "text-imagine-foreground-faint",
                )}
              >
                {step.label}
              </span>
            </button>
          </motion.li>
        );
      })}
    </ol>
  );
}
