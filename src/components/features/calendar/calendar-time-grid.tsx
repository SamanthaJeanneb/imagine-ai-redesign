"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { AddPostButton } from "@/components/features/calendar/add-post-button";
import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import {
  EventChip,
  type EventChipData,
} from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipData,
  type PostOpenOptions,
} from "@/components/features/calendar/post-chip";
import {
  formatDayShort,
  formatWeekdayLong,
  formatWeekdayShort,
} from "@/lib/format";
import { fade, stagger } from "@/styles/motion";

interface CalendarTimeGridProps {
  /** One day, or a Monday week of them. */
  days: readonly CalendarDay[];
  selectedPostId?: string;
  onOpenPost?: (post: PostChipData, options?: PostOpenOptions) => void;
  onOpenEvent?: (event: EventChipData) => void;
  /** Shows the plus an hour cell reveals on hover. */
  onCreatePost?: (date: string, time: string) => void;
  className?: string;
}

/** The working day the grid always shows, whatever is scheduled. */
const FIRST_HOUR = 9;
const LAST_HOUR = 18;

/** "9:00" to 9. Chips carry their time as text, which is all a row needs. */
function toHour(time: string): number | null {
  const hour = Number(time.split(":", 1)[0]);
  return Number.isNaN(hour) ? null : hour;
}

/** The working day, widened to hold anything scheduled outside it. */
function hoursFor(days: readonly CalendarDay[]): readonly number[] {
  let first = FIRST_HOUR;
  let last = LAST_HOUR;

  for (const day of days) {
    for (const post of day.posts) {
      const hour = toHour(post.time);
      if (hour === null) continue;
      if (hour < first) first = hour;
      if (hour > last) last = hour;
    }
    for (const event of day.events ?? []) {
      if (event.allDay) continue;
      const hour = toHour(event.time);
      if (hour === null) continue;
      if (hour < first) first = hour;
      if (hour > last) last = hour;
    }
  }

  const hours: number[] = [];
  for (let hour = first; hour <= last; hour += 1) hours.push(hour);
  return hours;
}

/**
 * The day and week views: hours down the side, days across the top, each post
 * sitting in the hour it goes out. Unlike the month grid a post keeps its
 * place in the day here, which is the point of looking at one week.
 */
export function CalendarTimeGrid({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
  className,
}: CalendarTimeGridProps) {
  const reduceMotion = useReducedMotion();
  const hours = hoursFor(days);
  const single = days.length === 1;
  const hasAllDay = days.some((day) =>
    (day.events ?? []).some((event) => event.allDay),
  );

  return (
    <motion.div
      data-slot="calendar-time-grid"
      role="grid"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.slow}
      className={cn(
        "grid min-w-0 overflow-hidden rounded-panel bg-imagine-border shadow-raised",
        // The hour gutter, then a column per day.
        single
          ? "grid-cols-[var(--spacing-xxxl)_minmax(0,1fr)]"
          : "min-w-[44rem] grid-cols-[var(--spacing-xxxl)_repeat(7,minmax(0,1fr))]",
        "gap-px",
        className,
      )}
    >
      {/* Heading row: the gutter has nothing to say. */}
      <span aria-hidden="true" className="bg-imagine-surface-raised" />
      {days.map((day) => (
        <span
          key={day.date}
          role="columnheader"
          className="flex min-w-0 items-center justify-center gap-xs overflow-hidden bg-imagine-surface-raised px-xs py-xs"
        >
          <span className="type-micro text-imagine-foreground-muted">
            {single
              ? formatWeekdayLong(day.date)
              : formatWeekdayShort(day.date)}
          </span>
          <span
            className={cn(
              "flex size-5 items-center justify-center rounded-full type-small tabular-nums",
              day.isToday
                ? "bg-imagine-primary font-semibold text-imagine-primary-foreground"
                : "text-imagine-foreground-muted",
            )}
          >
            {day.dayNumber}
          </span>
        </span>
      ))}

      {hasAllDay ? (
        <div className="col-span-full grid grid-cols-subgrid">
          <span className="bg-imagine-surface-raised pt-xs pr-xs text-right type-micro text-imagine-foreground-muted">
            All day
          </span>
          {days.map((day, dayIndex) => (
            <div
              key={day.date}
              role="gridcell"
              className="@container/chip flex min-h-10 flex-col gap-xs bg-imagine-surface p-xs"
            >
              {(day.events ?? [])
                .filter((event) => event.allDay)
                .map((event) => (
                  <motion.div
                    key={event.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...fade.slow,
                      delay: dayIndex * stagger.calendar,
                    }}
                  >
                    <EventChip
                      event={event}
                      dense={!single}
                      onOpen={onOpenEvent}
                    />
                  </motion.div>
                ))}
            </div>
          ))}
        </div>
      ) : null}

      {hours.map((hour) => (
        <div key={hour} className="col-span-full grid grid-cols-subgrid">
          <span className="bg-imagine-surface-raised pt-xs pr-xs text-right type-micro text-imagine-foreground-muted tabular-nums">
            {hour}:00
          </span>
          {days.map((day, dayIndex) => (
            <div
              key={day.date}
              role="gridcell"
              className="group/cell @container/chip relative flex min-h-12 flex-col gap-xs bg-imagine-surface p-xs"
            >
              {onCreatePost === undefined ? null : (
                <AddPostButton
                  when={`${formatDayShort(day.date)} at ${String(hour)}:00`}
                  onClick={() => {
                    onCreatePost(
                      day.date,
                      `${String(hour).padStart(2, "0")}:00`,
                    );
                  }}
                />
              )}
              {(day.events ?? [])
                .filter((event) => !event.allDay && toHour(event.time) === hour)
                .map((event) => (
                  <motion.div
                    key={event.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...fade.slow,
                      delay: dayIndex * stagger.calendar,
                    }}
                  >
                    <EventChip
                      event={event}
                      dense={!single}
                      onOpen={onOpenEvent}
                    />
                  </motion.div>
                ))}
              {day.posts
                .filter((post) => toHour(post.time) === hour)
                .map((post) => (
                  <motion.div
                    key={post.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      ...fade.slow,
                      delay: dayIndex * stagger.calendar,
                    }}
                  >
                    <PostChip
                      post={post}
                      dense={!single}
                      // A day has the width for a paragraph; a week's column
                      // has room for a couple of lines.
                      lines={single ? 4 : 2}
                      selected={post.id === selectedPostId}
                      onOpen={onOpenPost}
                    />
                  </motion.div>
                ))}
            </div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
