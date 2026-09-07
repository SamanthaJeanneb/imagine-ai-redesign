"use client";

import { motion, useReducedMotion } from "motion/react";

import { fade } from "@/styles/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/** Fade + 4px slide on route change. Reduced motion drops the slide. */
export function PageTransition({ children, className }: PageTransitionProps) {
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
