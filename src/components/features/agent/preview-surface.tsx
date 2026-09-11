"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
 * expand affordance sits in the top-right corner like the wireframe. The
 * children carry the shared `layoutId`, so what morphs into the page is the
 * grid or the chart itself, not this frame.
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
            className={cn("relative m-m", className)}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...fade.base, delay: 0.1 }}
            >
              {children}
            </motion.div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={expandLabel}
                  onClick={onExpand}
                  className="absolute top-xs right-xs z-10 bg-imagine-surface/80 text-imagine-foreground-muted backdrop-blur-sm hover:text-imagine-foreground"
                >
                  <Icon name="up-right-from-square" size="s" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">{expandLabel}</TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
