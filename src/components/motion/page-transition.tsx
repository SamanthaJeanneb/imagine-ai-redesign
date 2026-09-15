"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { fade } from "@/styles/motion";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/** Fade + 4px slide on route change. Reduced motion drops the slide. */
export function PageEntrance({ children, className }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
    >
      {children}
    </motion.div>
  );
}

/**
 * The same frame with no entrance, for a page arriving because a composer
 * preview was expanded into it. The block that morphs in carries the motion,
 * and a fade over the top of it would dim the morph. Pages fade their other
 * content in themselves.
 */
export function PageHandoff({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
    >
      {children}
    </motion.div>
  );
}
