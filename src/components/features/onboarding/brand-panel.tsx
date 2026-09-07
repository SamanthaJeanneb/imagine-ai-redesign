"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { Icon } from "@/components/ui/icon";

interface BrandPanelProps {
  className?: string;
}

/**
 * The sign-in page's right half: the one place the accent fills a whole
 * surface. Soft drifting blooms stand in for the wireframe's clouds.
 */
export function BrandPanel({ className }: BrandPanelProps) {
  const reduceMotion = useReducedMotion();
  const drift = reduceMotion
    ? undefined
    : {
        duration: 18,
        repeat: Infinity,
        repeatType: "mirror" as const,
        ease: "easeInOut" as const,
      };

  return (
    <div
      data-slot="brand-panel"
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-surface bg-imagine-secondary text-imagine-secondary-foreground",
        className,
      )}
    >
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, -24, 0] }}
        transition={drift}
        className="absolute -top-1/4 -left-1/4 size-3/4 rounded-full bg-imagine-secondary-strong/70 blur-3xl"
      />
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: [0, -32, 0], y: [0, 28, 0] }}
        transition={drift}
        className="absolute -right-1/4 -bottom-1/4 size-3/4 rounded-full bg-imagine-secondary-foreground/25 blur-3xl"
      />
      <motion.span
        aria-hidden="true"
        animate={reduceMotion ? undefined : { x: [0, 20, 0], y: [0, 16, 0] }}
        transition={drift}
        className="absolute top-1/3 left-1/3 size-1/2 rounded-full bg-imagine-secondary-foreground/15 blur-3xl"
      />
      <div className="relative flex items-center gap-m">
        <span className="flex size-12 items-center justify-center rounded-panel bg-imagine-foreground/85 text-imagine-primary-foreground">
          <Icon name="sparkles" size="xl" active />
        </span>
        <span className="type-display font-semibold tracking-tight text-imagine-foreground/85">
          Imagine
        </span>
      </div>
    </div>
  );
}
