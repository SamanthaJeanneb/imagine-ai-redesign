"use client";

import { cn } from "cn";
import { type HTMLMotionProps, motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { hoverLift, press } from "@/styles/motion";

/**
 * A chip's colors as `--chip-color` and `--chip-contrast`, for `chip-wash`,
 * `chip-solid`, the rail, and anything else that echoes it.
 */
export function chipStyle(color: string, contrast: string): CSSProperties {
  const style: CSSProperties & {
    "--chip-color": string;
    "--chip-contrast": string;
  } = {
    "--chip-color": color,
    "--chip-contrast": contrast,
  };
  return style;
}

type ChipShellProps = Omit<HTMLMotionProps<"button">, "style"> & {
  /** From `chipStyle`, so the wash, the rail, and the text all agree. */
  style: CSSProperties;
};

/**
 * The button every calendar chip is built on: a flat, pastel-filled cell the
 * way a calendar app draws an event, lifting under the pointer and pressing
 * under a click. The fill, the rail, and what goes inside are the caller's,
 * so a post and an event read apart while sharing the same chrome.
 */
export function ChipShell({ style, className, ...props }: ChipShellProps) {
  return (
    <motion.button
      type="button"
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      style={style}
      className={cn(
        "relative flex w-full min-w-0 overflow-hidden rounded-control px-s pl-m text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        // In a narrow cell (the chat column's composer preview) a chip pulls
        // its padding in. The cell is the `chip` container; see the grids.
        "@max-[6rem]/chip:pl-s",
        className,
      )}
      {...props}
    />
  );
}

/** The solid bar of the chip's own color down its leading edge. */
export function ChipRail() {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-y-0 left-0 w-1 bg-[var(--chip-color)]"
    />
  );
}

/** A chip and the preview hovering it opens. */
export function ChipHoverCard({
  chip,
  label,
  className,
  children,
}: {
  /** The chip itself, which is the card's trigger. */
  chip: ReactNode;
  /** What the card announces, e.g. "Preview of …". */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
      <HoverCardContent aria-label={label} className={className}>
        {children}
      </HoverCardContent>
    </HoverCard>
  );
}
