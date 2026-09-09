"use client";

// Imagine: the "add one more" affordance. A dashed outline where the next item
// would sit, so the empty slot itself is the button. Used at the foot of a
// tree ("New folder") and as the last tile of a grid.

import { cn } from "cn";
import { motion } from "motion/react";

import { type MotionCompatibleProps } from "@/components/motion/types";
import { Icon, type IconName } from "@/components/ui/icon";
import { pressRow } from "@/styles/motion";

interface DashedActionProps extends Omit<
  MotionCompatibleProps<"button">,
  "children"
> {
  icon?: IconName;
  children: React.ReactNode;
  /** `row` sits in a list at control height; `tile` matches a card in a grid. */
  shape?: "row" | "tile";
}

export function DashedAction({
  icon = "plus",
  children,
  shape = "row",
  className,
  ...props
}: DashedActionProps) {
  return (
    <motion.button
      type="button"
      data-slot="dashed-action"
      data-shape={shape}
      whileTap={pressRow.whileTap}
      transition={pressRow.transition}
      className={cn(
        "flex w-full items-center gap-s border border-dashed border-imagine-foreground-faint/60 text-left type-small font-medium text-imagine-foreground-muted transition-colors outline-none select-none hover:border-imagine-foreground-muted hover:bg-imagine-foreground/4 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        shape === "row"
          ? "h-control-sm rounded-control px-s"
          : "h-14 rounded-panel px-m",
        className,
      )}
      {...props}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon name={icon} size="s" />
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </motion.button>
  );
}
