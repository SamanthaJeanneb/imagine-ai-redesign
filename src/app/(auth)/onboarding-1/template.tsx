"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { fade } from "@/styles/motion";

/**
 * A template remounts on navigation, so each step slides in while the rail
 * beside it keeps its state and moves its own marker.
 */
export default function OnboardingStepTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={fade.base}
      className="flex min-h-0 min-w-0 flex-col gap-xxl md:gap-xxxl"
    >
      {children}
    </motion.div>
  );
}
