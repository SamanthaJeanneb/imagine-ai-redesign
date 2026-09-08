"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import {
  PostChip,
  type PostChipData,
} from "@/components/features/calendar/post-chip";
import { fade, stagger } from "@/styles/motion";

export interface CalendarDay {
  /** ISO date, used as the key. */
  date: string;
  dayNumber: number;
  isToday?: boolean;
  /** Belongs to the previous or next month in a month view. */
  isOutside?: boolean;
  posts: readonly PostChipData[];
}

export type CalendarDensity = "strip" | "preview" | "page";

interface CalendarGridProps {
  /** Rows of seven days, starting Monday. */
  days: readonly CalendarDay[];
  density?: CalendarDensity;
  /** Chips shown before the rest become "+N more". Defaults by density. */
  maxChips?: number;
  /** Rows share the height available instead of taking a minimum. */
  fill?: boolean;
  selectedPostId?: string;
  onOpenPost?: (post: PostChipData) => void;
  onSelectDay?: (day: CalendarDay) => void;
  /** Shared layout id with the composer preview. */
  layoutId?: string;
  className?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const CELL_HEIGHT: Record<CalendarDensity, string> = {
  strip: "min-h-40",
  preview: "min-h-14",
  page: "min-h-32",
};

const DEFAULT_MAX_CHIPS: Record<CalendarDensity, number> = {
  strip: 1,
  preview: 1,
  page: 3,
};

/**
 * A seven-column grid used four ways: the landing's two-week strip, the
 * composer preview, and the calendar page's month. Cells are separated by
 * hairlines inside one rounded frame; today is a filled number, not a box.
 */
export function CalendarGrid({
  days,
  density = "page",
  maxChips,
  fill = density === "strip",
  selectedPostId,
  onOpenPost,
  onSelectDay,
  layoutId,
  className,
}: CalendarGridProps) {
  const reduceMotion = useReducedMotion();
  const dense = density !== "page";
  const chipLimit = maxChips ?? DEFAULT_MAX_CHIPS[density];

  return (
    <motion.div
      layoutId={layoutId}
      data-slot="calendar-grid"
      data-density={density}
      role="grid"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-panel bg-imagine-surface-raised shadow-raised",
        className,
      )}
    >
      <div role="row" className="grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <span
            key={weekday}
            role="columnheader"
            className="px-s py-xs text-center type-micro text-imagine-foreground-muted"
          >
            {weekday}
          </span>
        ))}
      </div>
      <div
        role="rowgroup"
        className={cn(
          "grid grid-cols-7 gap-px bg-imagine-border",
          fill && "flex-1 auto-rows-fr",
        )}
      >
        {days.map((day, index) => {
          const overflow = day.posts.length - chipLimit;
          return (
            <motion.div
              key={day.date}
              role="gridcell"
              aria-selected={day.isToday ? true : undefined}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...fade.base, delay: index * stagger.grid }}
              onClick={
                onSelectDay
                  ? () => {
                      onSelectDay(day);
                    }
                  : undefined
              }
              className={cn(
                "flex flex-col gap-xs bg-imagine-surface p-xs",
                CELL_HEIGHT[density],
                day.isOutside && "bg-imagine-surface/60",
                onSelectDay &&
                  "cursor-pointer transition-colors hover:bg-imagine-surface-raised/50",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full type-small tabular-nums",
                  day.isToday
                    ? "bg-imagine-primary font-semibold text-imagine-primary-foreground"
                    : day.isOutside
                      ? "text-imagine-foreground-faint"
                      : "text-imagine-foreground-muted",
                )}
              >
                {day.dayNumber}
              </span>
              {day.posts.slice(0, chipLimit).map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  dense={dense}
                  selected={post.id === selectedPostId}
                  onOpen={onOpenPost}
                />
              ))}
              {overflow > 0 ? (
                <span className="px-xs type-small text-imagine-foreground-muted">
                  +{overflow} more
                </span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
