"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

interface PreviewSurfaceProps {
  open: boolean;
  /** Visible label for the expand action, e.g. "Open calendar". */
  expandLabel: string;
  onExpand?: () => void;
  /** Shared layout id with the full page's grid or chart block. */
  layoutId?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The calendar or analytics preview that grows out of the composer frame.
 * Opening animates height with `spring.soft`; the expand affordance sits in
 * the top-right corner like the wireframe.
 */
export function PreviewSurface({
  open,
  expandLabel,
  onExpand,
  layoutId,
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
          exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={spring.soft}
          className="overflow-hidden"
        >
          <motion.div
            layoutId={layoutId}
            data-slot="preview-surface"
            className={cn(
              "mx-xs mb-xs flex flex-col gap-xs border-b border-imagine-border/70 px-xs pt-xs pb-xs",
              className,
            )}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...fade.base, delay: 0.1 }}
            >
              {children}
            </motion.div>
            <Button
              size="xs"
              variant="ghost"
              onClick={onExpand}
              className="self-end text-imagine-foreground-muted"
            >
              {expandLabel}
              <Icon
                name="up-right-from-square"
                size="s"
                data-icon="inline-end"
              />
            </Button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
