"use client";

// Imagine: a hairline progress bar that animates to its value. Accent fill by
// default (onboarding step progress); `neutral` for usage meters.

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { spring } from "@/styles/motion";

interface ProgressProps extends React.ComponentProps<"div"> {
  /** 0 to 1. */
  value: number;
  tone?: "accent" | "neutral";
}

function Progress({
  value,
  tone = "accent",
  className,
  ...props
}: ProgressProps) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      data-slot="progress"
      className={cn(
        "h-1 w-full overflow-hidden rounded-full bg-imagine-surface-raised",
        className,
      )}
      {...props}
    >
      <motion.div
        className={cn(
          "h-full origin-left rounded-full",
          tone === "accent" ? "bg-imagine-secondary" : "bg-imagine-foreground",
        )}
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: clamped }}
        transition={spring.soft}
      />
    </div>
  );
}

export { Progress };
