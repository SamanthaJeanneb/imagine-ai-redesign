"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { Shimmer } from "@/components/motion/shimmer";
import { fade } from "@/styles/motion";

interface ThinkingIndicatorProps {
  /** Rotating status lines, e.g. "Reading your calendar". */
  statuses: readonly string[];
  /** Seconds each status stays visible. */
  interval?: number;
  className?: string;
}

const BREATHE_DURATION = 1.6;

/**
 * The agent's thinking state: a pink hairline that breathes in width under the
 * avatar, paired with rotating status text. Not a spinner.
 */
export function ThinkingIndicator({
  statuses,
  interval = 2.4,
  className,
}: ThinkingIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (statuses.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % statuses.length);
    }, interval * 1000);
    return () => {
      window.clearInterval(id);
    };
  }, [interval, statuses.length]);

  const status = statuses[index] ?? statuses[0] ?? "Thinking";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col gap-s", className)}
    >
      <div className="relative h-5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={status}
            className="absolute inset-0 type-small"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -6 }}
            transition={fade.base}
          >
            <Shimmer>{status}</Shimmer>
          </motion.span>
        </AnimatePresence>
      </div>
      <motion.span
        aria-hidden="true"
        className="h-px w-12 origin-left rounded-full bg-imagine-secondary"
        animate={reduceMotion ? { scaleX: 1 } : { scaleX: [0.3, 1, 0.3] }}
        transition={{
          duration: BREATHE_DURATION,
          ease: "easeInOut",
          repeat: Infinity,
        }}
      />
    </div>
  );
}
