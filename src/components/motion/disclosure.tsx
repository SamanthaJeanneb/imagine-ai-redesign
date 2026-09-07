"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { spring } from "@/styles/motion";

/**
 * Content that opens and closes under its own header. Height animates from the
 * measured content, so nothing has to declare how tall it is; reduced motion
 * gets the fade only.
 */
export function Disclosure({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="children"
          initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={
            reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }
          }
          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={spring.soft}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
