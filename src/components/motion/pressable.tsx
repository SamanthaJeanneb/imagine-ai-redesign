"use client";

import { motion } from "motion/react";

import { hoverLift, press } from "@/styles/motion";

type PressableProps = React.ComponentProps<typeof motion.div> & {
  /** Also lift 1px on hover (rows, tiles). */
  lift?: boolean;
};

/**
 * Wraps any clickable region with the tactile press state. Buttons get this
 * built in; use `Pressable` for tiles, rows, and cells.
 */
export function Pressable({ lift = false, ...props }: PressableProps) {
  return (
    <motion.div
      whileTap={press.whileTap}
      whileHover={lift ? hoverLift.whileHover : undefined}
      transition={press.transition}
      {...props}
    />
  );
}
