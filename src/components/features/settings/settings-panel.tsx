"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { fade } from "@/styles/motion";

/**
 * The tab's content, below the tab strip. The settings layout stays mounted
 * across its routes so the tab indicator can slide, which means the workspace
 * page transition does not fire here; this gives each tab the same entrance.
 */
export function SettingsPanel({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
