"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, spring, stagger } from "@/styles/motion";

export interface ScheduledChip {
  intent: string;
  label: string;
}

interface ScheduledGraphicProps {
  /** Day of month shown on the calendar tile. */
  dayNumber: number;
  /** "Tue, 9 Sep at 9:00". */
  whenLabel: string;
  /** Short month for the tile's band, e.g. "Sep". */
  monthLabel: string;
  /** Who the post goes out from. */
  profileName: string;
  /** 0 = Monday. Which tile in the week strip is the post. */
  weekdayIndex: number;
  /** Other posts already on the week, by weekday index. */
  occupied?: readonly number[];
  chips?: readonly ScheduledChip[];
  onChip?: (chip: ScheduledChip) => void;
  className?: string;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

/**
 * The confirmation graphic the agent replies with once a post is scheduled:
 * a calendar tile, the week strip with the new post lit up, and quick actions.
 */
export function ScheduledGraphic({
  dayNumber,
  monthLabel,
  whenLabel,
  profileName,
  weekdayIndex,
  occupied = [],
  chips = [],
  onChip,
  className,
}: ScheduledGraphicProps) {
  return (
    <div className={cn("flex w-full max-w-md flex-col gap-s", className)}>
      <motion.div
        data-slot="scheduled-graphic"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.base}
        className="flex flex-col gap-l rounded-panel bg-imagine-surface-raised p-l"
      >
        <div className="flex items-center gap-m">
          <span className="flex size-11 shrink-0 flex-col overflow-hidden rounded-control bg-imagine-surface shadow-control">
            <span className="flex h-3.5 items-center justify-center bg-imagine-secondary type-micro leading-none text-imagine-secondary-foreground">
              {monthLabel}
            </span>
            <span className="flex flex-1 items-center justify-center type-heading leading-none font-semibold tabular-nums">
              {dayNumber}
            </span>
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="type-body font-semibold">Scheduled</span>
            <span className="truncate type-small text-imagine-foreground-muted">
              {whenLabel} from {profileName}
            </span>
          </div>
        </div>

        <ol className="grid grid-cols-7 gap-xs" aria-label="This week">
          {WEEKDAYS.map((letter, index) => {
            const isTarget = index === weekdayIndex;
            const hasPost = occupied.includes(index);
            return (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...fade.base, delay: index * stagger.grid }}
                aria-current={isTarget ? "date" : undefined}
                className="flex flex-col items-center gap-xs"
              >
                <span className="type-micro text-imagine-foreground-faint">
                  {letter}
                </span>
                <motion.span
                  layout
                  transition={spring.snappy}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-control",
                    isTarget
                      ? "bg-imagine-primary text-imagine-primary-foreground shadow-control inset-shadow-highlight"
                      : "bg-imagine-surface shadow-control",
                  )}
                >
                  {isTarget ? (
                    <Icon name="check" size="s" active />
                  ) : hasPost ? (
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-imagine-foreground-faint"
                    />
                  ) : null}
                </motion.span>
              </motion.li>
            );
          })}
        </ol>
      </motion.div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-xs">
          {chips.map((chip) => (
            <Button
              key={chip.intent}
              size="sm"
              variant="soft"
              onClick={() => {
                onChip?.(chip);
              }}
            >
              {chip.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
