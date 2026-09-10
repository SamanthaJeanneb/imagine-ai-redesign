"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId } from "react";

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
  const markerId = useId();

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
                "flex items-center gap-m pb-l text-left outline-none focus-visible:underline disabled:cursor-default",
                last && "pb-0",
              )}
            >
              <span
                className={cn(
                  "relative flex size-6 shrink-0 items-center justify-center rounded-full type-small font-semibold tabular-nums transition-colors",
                  // The rail sits on the background, which matches
                  // surface-raised in light mode, so these read off foreground.
                  state === "done" &&
                    "bg-imagine-foreground-faint text-imagine-surface",
                  state === "current" && "text-imagine-secondary-foreground",
                  state === "upcoming" &&
                    "bg-imagine-border text-imagine-foreground-faint",
                )}
              >
                {/* One accent disc for the whole list, so it slides between steps. */}
                {state === "current" ? (
                  <motion.span
                    layoutId={`${markerId}-current`}
                    aria-hidden="true"
                    transition={spring.snappy}
                    className="absolute inset-0 rounded-full bg-imagine-secondary ring-4 ring-imagine-secondary-soft"
                  />
                ) : null}
                {/* A flex box, not an inline span: inline would sit the icon
                    on the text baseline and lift it off the disc's center. */}
                <span className="relative flex items-center justify-center">
                  {state === "done" ? (
                    <Icon name="check" size="s" active />
                  ) : (
                    index + 1
                  )}
                </span>
              </span>
              <span
                className={cn(
                  "type-body transition-colors",
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
