"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import {
  EventChip,
  type EventChipData,
} from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipData,
  type PostChipLines,
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
  events?: readonly EventChipData[];
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
  onOpenEvent?: (event: EventChipData) => void;
  onSelectDay?: (day: CalendarDay) => void;
  /** Shared layout id with the composer preview. */
  layoutId?: string;
  className?: string;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// The strip sits under the timeline and fills what is left, so its floor is
// only what the day number and one full chip need.
const CELL_HEIGHT: Record<CalendarDensity, string> = {
  strip: "min-h-32",
  preview: "min-h-20",
  page: "min-h-40",
};

const DEFAULT_MAX_CHIPS: Record<CalendarDensity, number> = {
  strip: 1,
  preview: 1,
  page: 3,
};

// How much of each post a cell shows. The page and the strip have the room
// for a real excerpt; the preview shows enough to know which post it is.
const CHIP_LINES: Record<CalendarDensity, PostChipLines> = {
  strip: 3,
  preview: 2,
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
  onOpenEvent,
  onSelectDay,
  layoutId,
  className,
}: CalendarGridProps) {
  const reduceMotion = useReducedMotion();
  // Preview cells are too short for the time and profile line. The landing
  // strip and the calendar page both have room for the full chip.
  const dense = density === "preview";
  const chipLimit = maxChips ?? DEFAULT_MAX_CHIPS[density];

  return (
    <motion.div
      layoutId={layoutId}
      data-slot="calendar-grid"
      data-density={density}
      role="grid"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-panel bg-imagine-surface-raised shadow-raised",
        fill && "min-h-0",
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
          // A month of full chips can run past the page: the rows scroll
          // inside the frame rather than the frame growing off the screen.
          fill && "min-h-0 flex-1 auto-rows-fr overflow-y-auto",
        )}
      >
        {days.map((day, index) => {
          const events = day.events ?? [];
          const overflow = day.posts.length - chipLimit;
          // Stagger diagonally by row + column rather than by index, so a
          // six-week month sweeps in over about half a second instead of
          // nearly a second.
          const wave = Math.floor(index / 7) + (index % 7);
          return (
            <motion.div
              key={day.date}
              role="gridcell"
              aria-selected={day.isToday ? true : undefined}
              initial={reduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...fade.slow, delay: wave * stagger.calendar }}
              onClick={
                onSelectDay
                  ? () => {
                      onSelectDay(day);
                    }
                  : undefined
              }
              className={cn(
                // The `chip` container: chips slim down in a narrow cell.
                "@container/chip flex flex-col gap-xs bg-imagine-surface p-xs",
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
              {events.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  dense={dense}
                  onOpen={onOpenEvent}
                />
              ))}
              {day.posts.slice(0, chipLimit).map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  dense={dense}
                  lines={CHIP_LINES[density]}
                  selected={post.id === selectedPostId}
                  onOpen={onOpenPost}
                />
              ))}
              {overflow > 0 ? (
                <span className="px-xs type-caption text-imagine-foreground-muted">
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
