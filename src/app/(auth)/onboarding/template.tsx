"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { fade } from "@/styles/motion";

/**
 * A template remounts on navigation, so each step slides in while the brand
 * header above it and the preview beside it hold still. It fills the column
 * so the step can pin its actions to the bottom.
 */
export default function Onboarding2StepTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={fade.base}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
