"use client";

// Imagine: the "add one more" affordance. A dashed outline where the next item
// would sit, so the empty slot itself is the button. `DashedActionRow` sits in
// a list at control height ("New folder" at the foot of a tree);
// `DashedActionTile` matches a card as the last tile of a grid.

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
}

function DashedActionBase({
  icon = "plus",
  children,
  className,
  ...props
}: DashedActionProps) {
  return (
    <motion.button
      type="button"
      data-slot="dashed-action"
      whileTap={pressRow.whileTap}
      transition={pressRow.transition}
      className={cn(
        "flex w-full items-center gap-s border border-dashed border-imagine-foreground-faint/60 text-left type-small font-medium text-imagine-foreground-muted transition-colors outline-none select-none hover:border-imagine-foreground-muted hover:bg-imagine-foreground/4 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
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

export function DashedActionRow({ className, ...props }: DashedActionProps) {
  return (
    <DashedActionBase
      data-shape="row"
      className={cn("h-control-sm rounded-control px-s", className)}
      {...props}
    />
  );
}

export function DashedActionTile({ className, ...props }: DashedActionProps) {
  return (
    <DashedActionBase
      data-shape="tile"
      className={cn("h-14 rounded-panel px-m", className)}
      {...props}
    />
  );
}
