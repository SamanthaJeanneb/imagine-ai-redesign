"use client";

// Imagine: shadcn spinner rewritten to use the Icon component and Motion
// (no lucide, no CSS spin). Buttons only; the agent has its own thinking state.

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { type MotionCompatibleProps } from "@/components/motion/types";
import { Icon, type IconSize } from "@/components/ui/icon";

type SpinnerProps = MotionCompatibleProps<"span"> & {
  size?: IconSize;
};

function Spinner({ className, size = "m", ...props }: SpinnerProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("inline-flex", className)}
      animate={{ rotate: reduceMotion ? 0 : 360 }}
      transition={{ duration: 0.9, ease: "linear", repeat: Infinity }}
      {...props}
    >
      <Icon name="circle-notch" size={size} />
    </motion.span>
  );
}

export { Spinner };
