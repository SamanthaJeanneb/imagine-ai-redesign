"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { fade } from "@/styles/motion";

interface LogoLoaderProps {
  /** Rendered width in px. Height follows the wordmark's aspect. */
  width?: number;
  label?: string;
  className?: string;
}

/**
 * The Imagine wordmark with a light band sweeping through it. Fades in so a
 * fast load never flashes it. Use `PageLoader` for a whole route.
 */
export function LogoLoader({
  width = 120,
  label = "Loading",
  className,
}: LogoLoaderProps) {
  return (
    <motion.div
      role="status"
      aria-label={label}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...fade.slow, delay: 0.15 }}
      data-slot="logo-loader"
      className={cn("inline-flex", className)}
    >
      <span
        aria-hidden="true"
        className="block logo-shimmer"
        style={{ width }}
      />
    </motion.div>
  );
}

/** Centers the loader in whatever flex parent it is given. */
export function PageLoader({ className, ...props }: LogoLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 items-center justify-center",
        className,
      )}
    >
      <LogoLoader {...props} />
    </div>
  );
}
