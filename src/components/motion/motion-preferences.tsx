"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Stands transform and layout animation down for anyone who asked their system
 * to reduce motion. It does not cover animated `width`, `height`, or margins,
 * so anything that reflows its neighbours still has to check `useReducedMotion`
 * itself.
 */
export function MotionPreferences({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
