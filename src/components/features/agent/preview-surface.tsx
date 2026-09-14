"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { fade, spring } from "@/styles/motion";

interface PreviewSurfaceProps {
  open: boolean;
  /** Label for the expand action, e.g. "Open calendar". */
  expandLabel: string;
  onExpand?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * The calendar or analytics preview that grows out of the composer frame.
 * The clip springs open on height; the content fades in a beat later; the
 * expand action sits under the preview, trailing, so it never covers a cell.
 * The children carry the shared `layoutId`, so what morphs into the page is
 * the grid or the chart itself, not this frame.
 */
export function PreviewSurface({
  open,
  expandLabel,
  onExpand,
  children,
  className,
}: PreviewSurfaceProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="preview"
          initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={
            reduceMotion ? { opacity: 1 } : { height: "auto", opacity: 1 }
          }
          exit={
            reduceMotion
              ? { opacity: 0, transition: fade.fast }
              : { height: 0, opacity: 0, transition: fade.base }
          }
          transition={spring.soft}
          className="overflow-hidden"
        >
          <div
            data-slot="preview-surface"
            className={cn("m-m flex flex-col gap-s", className)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...fade.base, delay: 0.1 }}
            >
              {children}
            </motion.div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="link"
                onClick={onExpand}
                className="px-0 text-imagine-secondary hover:text-imagine-secondary-strong"
              >
                {expandLabel}
              </Button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
