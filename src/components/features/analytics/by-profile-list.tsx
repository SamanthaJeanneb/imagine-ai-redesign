"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProfileMetric } from "@/entities/analytics";
import { pressRow, spring } from "@/styles/motion";
import { initials } from "@/lib/initials";

interface ByProfileListProps {
  items: readonly ProfileMetric[];
  onOpen?: (item: ProfileMetric) => void;
  selectedId?: string;
  className?: string;
}

/**
 * Horizontal comparison across profiles: avatar, name, a square-ended bar in
 * the accent on a hairline track, and the value. Bars grow in from the left.
 */
export function ByProfileList({
  items,
  onOpen,
  selectedId,
  className,
}: ByProfileListProps) {
  const reduceMotion = useReducedMotion();
  let max = 0;
  for (const item of items) if (item.value > max) max = item.value;

  return (
    <div
      data-slot="by-profile"
      className={cn(
        "flex flex-col gap-l border border-imagine-border bg-imagine-surface p-l",
        className,
      )}
    >
      <span className="type-heading">By profile</span>
      <Stagger kind="list" className="flex flex-col gap-m">
        {items.map((item) => {
          const ratio = max > 0 ? item.value / max : 0;
          return (
            <StaggerItem key={item.id}>
              <motion.button
                type="button"
                onClick={() => onOpen?.(item)}
                disabled={!onOpen}
                whileTap={onOpen ? pressRow.whileTap : undefined}
                transition={pressRow.transition}
                className={cn(
                  "flex w-full items-center gap-m rounded-control px-xs py-xxs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default",
                  onOpen && "hover:bg-imagine-surface-raised",
                  item.id === selectedId && "bg-imagine-surface-raised",
                )}
              >
                <Avatar
                  size="sm"
                  shape={item.kind === "company" ? "square" : "circle"}
                >
                  {item.avatarUrl ? (
                    <AvatarImage src={item.avatarUrl} alt={item.name} />
                  ) : null}
                  <AvatarFallback>{initials(item.name)}</AvatarFallback>
                </Avatar>
                <span className="w-28 shrink-0 truncate type-small">
                  {item.name}
                </span>
                <span className="h-2 flex-1 overflow-hidden bg-imagine-border/60">
                  <motion.span
                    className="block h-full origin-left bg-imagine-secondary"
                    initial={reduceMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: ratio }}
                    transition={spring.soft}
                  />
                </span>
                <span className="w-12 shrink-0 text-right type-small font-medium tabular-nums">
                  {item.valueLabel}
                </span>
              </motion.button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
