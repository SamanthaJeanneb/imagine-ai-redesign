"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { pressRow } from "@/styles/motion";

export interface UpNextItem {
  id: string;
  /** "Tue 9:00". */
  when: string;
  title: string;
  profileName: string;
}

interface UpNextListProps {
  items: readonly UpNextItem[];
  onOpen?: (item: UpNextItem) => void;
  onViewAll?: () => void;
  className?: string;
}

/** The right rail's "Up next": time column, title, profile. */
export function UpNextList({
  items,
  onOpen,
  onViewAll,
  className,
}: UpNextListProps) {
  return (
    <div data-slot="up-next" className={cn("flex flex-col gap-m", className)}>
      <span className="type-heading">Up next</span>
      {items.length === 0 ? (
        <p className="type-small text-imagine-foreground-muted">
          Nothing scheduled. Ask the agent to draft something.
        </p>
      ) : (
        <Stagger kind="list" className="flex flex-col">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <motion.button
                type="button"
                onClick={() => onOpen?.(item)}
                whileTap={pressRow.whileTap}
                transition={pressRow.transition}
                className="group/row -mx-s flex w-[calc(100%+var(--spacing-l))] items-start gap-m rounded-control px-s py-s text-left transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <span className="w-14 shrink-0 pt-px type-small text-imagine-foreground-muted tabular-nums">
                  {item.when}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate type-body">{item.title}</span>
                  <span className="truncate type-small text-imagine-foreground-muted">
                    {item.profileName}
                  </span>
                </span>
              </motion.button>
            </StaggerItem>
          ))}
        </Stagger>
      )}
      {onViewAll ? (
        <Button
          variant="link"
          size="sm"
          className="self-start px-0 text-imagine-foreground-muted"
          onClick={onViewAll}
        >
          Open calendar
        </Button>
      ) : null}
    </div>
  );
}
