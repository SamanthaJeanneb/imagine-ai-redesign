"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { BrandMark } from "@/components/ui/brand-mark";
import { fade } from "@/styles/motion";

/**
 * What a conversation looks like before it starts: the mark, faint, holding
 * the middle of the empty thread. It fades out as soon as the first turn
 * arrives, so it never competes with the messages.
 */
export function ChatEmptyMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...fade.slow, delay: 0.1 }}
      className={cn(
        "pointer-events-none flex min-h-0 flex-1 items-center justify-center",
        className,
      )}
    >
      <BrandMark name="imagine" className="size-16 text-imagine-foreground/8" />
    </motion.div>
  );
}
