"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { spring } from "@/styles/motion";

export interface ProfileMetric {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Raw number, used to size the bar. */
  value: number;
  /** Already formatted, e.g. "4.1k". */
  valueLabel: string;
}

interface ByProfileListProps {
  title?: string;
  items: readonly ProfileMetric[];
  onOpen?: (item: ProfileMetric) => void;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Horizontal comparison across profiles: avatar, name, a proportional bar in
 * the accent, and the value. Bars grow in from the left.
 */
export function ByProfileList({
  title = "By profile",
  items,
  onOpen,
  className,
}: ByProfileListProps) {
  const reduceMotion = useReducedMotion();
  let max = 0;
  for (const item of items) if (item.value > max) max = item.value;

  return (
    <div
      data-slot="by-profile"
      className={cn(
        "flex flex-col gap-l rounded-panel bg-imagine-surface p-l shadow-raised",
        className,
      )}
    >
      <span className="type-heading">{title}</span>
      <Stagger kind="list" className="flex flex-col gap-m">
        {items.map((item) => {
          const ratio = max > 0 ? item.value / max : 0;
          return (
            <StaggerItem key={item.id}>
              <button
                type="button"
                onClick={() => onOpen?.(item)}
                disabled={!onOpen}
                className="flex w-full items-center gap-m rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-default"
              >
                <Avatar size="sm">
                  {item.avatarUrl ? (
                    <AvatarImage src={item.avatarUrl} alt={item.name} />
                  ) : null}
                  <AvatarFallback>{initials(item.name)}</AvatarFallback>
                </Avatar>
                <span className="w-28 shrink-0 truncate type-small">
                  {item.name}
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-imagine-surface">
                  <motion.span
                    className="block h-full origin-left rounded-full accent-gradient"
                    initial={reduceMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: ratio }}
                    transition={spring.soft}
                  />
                </span>
                <span className="w-12 shrink-0 text-right type-small text-imagine-foreground-muted tabular-nums">
                  {item.valueLabel}
                </span>
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
