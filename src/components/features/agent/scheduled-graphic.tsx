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
  /** Short month for the tile's band, e.g. "Sep". */
  monthLabel: string;
  /** "Tue, 9 Sep at 9:00". */
  whenLabel: string;
  /** Just the time, shown under the lit day, e.g. "9:00". */
  timeLabel: string;
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

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * The confirmation graphic the agent replies with once a post is scheduled:
 * a calendar tile, the week with the new day lit in the accent gradient, and
 * quick actions. Day numbers are derived from the scheduled day so the strip
 * reads as the real week.
 */
export function ScheduledGraphic({
  dayNumber,
  monthLabel,
  whenLabel,
  timeLabel,
  profileName,
  weekdayIndex,
  occupied = [],
  chips = [],
  onChip,
  className,
}: ScheduledGraphicProps) {
  const weekStart = dayNumber - weekdayIndex;

  return (
    <div className={cn("flex w-full max-w-md flex-col gap-s", className)}>
      <motion.div
        data-slot="scheduled-graphic"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.base}
        className="flex flex-col gap-l rounded-panel bg-imagine-surface p-l shadow-raised"
      >
        <div className="flex items-center gap-m">
          <span className="flex size-11 shrink-0 flex-col overflow-hidden rounded-control bg-imagine-surface shadow-control">
            <span className="flex h-3.5 items-center justify-center accent-gradient type-micro leading-none text-imagine-secondary-foreground">
              {monthLabel}
            </span>
            <span className="flex flex-1 items-center justify-center type-heading leading-none font-semibold tabular-nums">
              {dayNumber}
            </span>
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-xxs">
            <span className="flex items-center gap-xs type-body font-semibold">
              Scheduled
              <Icon
                name="circle-check"
                size="s"
                active
                className="text-success"
              />
            </span>
            <span className="truncate type-small text-imagine-foreground-muted">
              {whenLabel} from {profileName}
            </span>
          </div>
        </div>

        <ol className="grid grid-cols-7 gap-xs" aria-label="This week">
          {WEEKDAYS.map((label, index) => {
            const isTarget = index === weekdayIndex;
            const hasPost = occupied.includes(index);
            const number = weekStart + index;
            return (
              <motion.li
                key={label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...fade.base, delay: index * stagger.grid }}
                aria-current={isTarget ? "date" : undefined}
                className="relative"
              >
                <motion.span
                  layout
                  transition={spring.snappy}
                  className={cn(
                    "flex h-14 w-full flex-col items-center justify-center gap-xxs rounded-control transition-colors",
                    isTarget
                      ? "accent-gradient text-imagine-secondary-foreground shadow-control ring-4 inset-shadow-highlight ring-imagine-secondary-soft"
                      : "text-imagine-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "type-micro leading-none",
                      isTarget
                        ? "text-imagine-secondary-foreground/80"
                        : "text-imagine-foreground-faint",
                    )}
                  >
                    {label}
                  </span>
                  <span className="type-body leading-none font-semibold tabular-nums">
                    {number > 0 ? number : ""}
                  </span>
                  <span className="flex h-2 items-center">
                    {isTarget ? (
                      <span className="type-micro leading-none tracking-normal text-imagine-secondary-foreground/90 normal-case">
                        {timeLabel}
                      </span>
                    ) : hasPost ? (
                      <span
                        aria-hidden="true"
                        className="size-1 rounded-full bg-imagine-foreground-faint"
                      />
                    ) : null}
                  </span>
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
