"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { useOptionalChat } from "@/components/features/agent/chat-provider";
import { fade } from "@/styles/motion";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Fade + 4px slide on route change. Reduced motion drops the slide.
 *
 * When the page is arriving because a composer preview was expanded into it,
 * the entrance is skipped: the block that morphs in carries the motion, and a
 * fade over the top of it would dim the morph. Pages fade their other content
 * in themselves.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const reduceMotion = useReducedMotion();
  const chat = useOptionalChat();
  // Read once, on mount: the handoff is for this arrival only.
  const [handoff] = useState(() => chat?.handoff ?? null);
  const landed = chat?.landed;

  useEffect(() => {
    if (handoff !== null) landed?.();
  }, [handoff, landed]);

  return (
    <motion.div
      className={className}
      initial={
        handoff !== null ? false : { opacity: 0, y: reduceMotion ? 0 : 4 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
    >
      {children}
    </motion.div>
  );
}
