"use client";

import { motion, useReducedMotion } from "motion/react";
import { createContext, useContext, useMemo } from "react";

import { stagger, staggerVariants } from "@/styles/motion";

type StaggerKind = keyof typeof stagger;

const StaggerContext = createContext(staggerVariants(stagger.list));

interface StaggerProps extends React.ComponentProps<typeof motion.div> {
  /** `list` 40ms per item, `grid` 20ms. */
  kind?: StaggerKind;
}

/**
 * Staggers `StaggerItem` children on first mount only. Reduced motion renders
 * everything at once.
 */
export function Stagger({ kind = "list", children, ...props }: StaggerProps) {
  const reduceMotion = useReducedMotion();
  const variants = useMemo(
    () => staggerVariants(reduceMotion ? 0 : stagger[kind]),
    [kind, reduceMotion],
  );

  return (
    <StaggerContext value={variants}>
      <motion.div
        variants={variants.container}
        initial="hidden"
        animate="show"
        {...props}
      >
        {children}
      </motion.div>
    </StaggerContext>
  );
}

export function StaggerItem(props: React.ComponentProps<typeof motion.div>) {
  const variants = useContext(StaggerContext);
  return <motion.div variants={variants.item} {...props} />;
}
