"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { AddPostButton } from "@/components/features/calendar/add-post-button";
import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import {
  EventChip,
  type EventChipData,
  EventChipDense,
} from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipData,
  PostChipDense,
  type PostOpenOptions,
} from "@/components/features/calendar/post-chip";
import {
  formatDayShort,
  formatWeekdayLong,
  formatWeekdayShort,
} from "@/lib/format";
import { fade, stagger } from "@/styles/motion";

interface CalendarTimeGridBaseProps {
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

/*
 * The columns every row of a grid shares: the hour gutter, then a column per
 * day. A week keeps a floor under its seven, so a narrow page scrolls
 * sideways rather than squeezing a column narrower than a word.
 */
const DAY_COLUMNS = "grid-cols-[var(--spacing-xxxl)_minmax(0,1fr)]";
const WEEK_COLUMNS =
  "min-w-[44rem] grid-cols-[var(--spacing-xxxl)_repeat(7,minmax(0,1fr))]";

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

/** The day's events with no time of their own, which sit above the hours. */
function allDayEventsOf(day: CalendarDay): readonly EventChipData[] {
  return (day.events ?? []).filter((event) => event.allDay);
}

/** The timed events starting in this hour. */
function eventsInHour(
  day: CalendarDay,
  hour: number,
): readonly EventChipData[] {
  return (day.events ?? []).filter(
    (event) => !event.allDay && toHour(event.time) === hour,
  );
}

/** The posts going out in this hour. */
function postsInHour(day: CalendarDay, hour: number): readonly PostChipData[] {
  return day.posts.filter((post) => toHour(post.time) === hour);
}

/*
 * The parts. Both grids below are the same frame — hours down the side, a
 * column per day, each post sitting in the hour it goes out — and differ only
 * in how wide a column is and so how much of a post fits in one. Unlike the
 * month grid a post keeps its place in the day here, which is the point of
 * looking at one week. Each variant assembles these into its own tree.
 */

/**
 * The padded, sideways-scrolling gutter and the rounded frame inside it, so
 * the frame's drop shadow is not clipped. The frame takes the height it is
 * given and its rows share it, rather than each row taking a minimum.
 */
function CalendarTimeGridFrame({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto p-m",
        className,
      )}
    >
      <motion.div
        data-slot="calendar-time-grid"
        role="grid"
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fade.slow}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-panel bg-imagine-border shadow-raised"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Heading row: the gutter has nothing to say. */
function CalendarTimeGridHead({
  columns,
  children,
}: {
  columns: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid shrink-0 gap-px", columns)}>
      <span aria-hidden="true" className="bg-imagine-surface-raised" />
      {children}
    </div>
  );
}

/** A day's heading: its weekday, then the day number, filled when it is today. */
function CalendarTimeGridHeading({
  day,
  children,
}: {
  day: CalendarDay;
  /** The weekday's name, spelled out as far as the column allows. */
  children: ReactNode;
}) {
  return (
    <span
      role="columnheader"
      className="flex min-w-0 items-center justify-center gap-xs overflow-hidden bg-imagine-surface-raised px-xs py-xs"
    >
      <span className="type-micro text-imagine-foreground-muted">
        {children}
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
  );
}

/** The row above the hours, for events that take the whole day. */
function CalendarAllDayRow({
  columns,
  children,
}: {
  columns: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("grid shrink-0 gap-px", columns)}>
      <span className="bg-imagine-surface-raised pt-xs pr-xs text-right type-micro text-imagine-foreground-muted">
        All day
      </span>
      {children}
    </div>
  );
}

/** One day's all-day cell. */
function CalendarAllDayCell({ children }: { children: ReactNode }) {
  return (
    <div
      role="gridcell"
      className="@container/chip flex min-h-10 flex-col gap-xs bg-imagine-surface p-xs"
    >
      {children}
    </div>
  );
}

/** The hours, scrolling inside the frame when the rows cannot all fit. */
function CalendarHours({
  columns,
  children,
}: {
  columns: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid min-h-0 flex-1 auto-rows-fr gap-px overflow-y-auto bg-imagine-border",
        columns,
      )}
    >
      {children}
    </div>
  );
}

/** One hour across the grid: its label in the gutter, then a cell per day. */
function CalendarHourRow({
  hour,
  children,
}: {
  hour: number;
  children: ReactNode;
}) {
  return (
    <div className="contents">
      <span className="bg-imagine-surface-raised pt-xs pr-xs text-right type-micro text-imagine-foreground-muted tabular-nums">
        {hour}:00
      </span>
      {children}
    </div>
  );
}

/**
 * One day's hour: whatever starts in it, over the plus the cell reveals on
 * hover. The cell is the `chip` container, so chips slim down in a narrow one.
 */
function CalendarHourCell({
  day,
  hour,
  onCreatePost,
  children,
}: {
  day: CalendarDay;
  hour: number;
  onCreatePost: ((date: string, time: string) => void) | undefined;
  children: ReactNode;
}) {
  return (
    <div
      role="gridcell"
      className="group/cell @container/chip relative flex min-h-12 flex-col gap-xs overflow-hidden bg-imagine-surface p-xs"
    >
      {onCreatePost === undefined ? null : (
        <AddPostButton
          when={`${formatDayShort(day.date)} at ${String(hour)}:00`}
          onClick={() => {
            onCreatePost(day.date, `${String(hour).padStart(2, "0")}:00`);
          }}
        />
      )}
      {children}
    </div>
  );
}

/**
 * A chip's entrance. The delay follows the column, so a week fades in from
 * the left rather than all at once.
 */
function CalendarTimeGridEntry({
  dayIndex,
  children,
}: {
  /** Position across the grid, for the entrance wave. */
  dayIndex: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...fade.slow, delay: dayIndex * stagger.calendar }}
    >
      {children}
    </motion.div>
  );
}

/*
 * The grids. A day and a week want the same rows and the same hours; what
 * differs is the width of a column, and so how much of a post fits in one.
 */

/**
 * One day, in a single column. The column has the width for a paragraph, so
 * the weekday is spelled out and every chip is a full card.
 */
export function CalendarDayGrid({
  day,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
  className,
}: CalendarTimeGridBaseProps & { day: CalendarDay }) {
  const hours = hoursFor([day]);
  const allDayEvents = allDayEventsOf(day);

  return (
    <CalendarTimeGridFrame className={className}>
      <CalendarTimeGridHead columns={DAY_COLUMNS}>
        <CalendarTimeGridHeading day={day}>
          {formatWeekdayLong(day.date)}
        </CalendarTimeGridHeading>
      </CalendarTimeGridHead>

      {allDayEvents.length === 0 ? null : (
        <CalendarAllDayRow columns={DAY_COLUMNS}>
          <CalendarAllDayCell>
            {allDayEvents.map((event) => (
              <CalendarTimeGridEntry key={event.id} dayIndex={0}>
                <EventChip event={event} onOpen={onOpenEvent} />
              </CalendarTimeGridEntry>
            ))}
          </CalendarAllDayCell>
        </CalendarAllDayRow>
      )}

      <CalendarHours columns={DAY_COLUMNS}>
        {hours.map((hour) => (
          <CalendarHourRow key={hour} hour={hour}>
            <CalendarHourCell day={day} hour={hour} onCreatePost={onCreatePost}>
              {eventsInHour(day, hour).map((event) => (
                <CalendarTimeGridEntry key={event.id} dayIndex={0}>
                  <EventChip event={event} onOpen={onOpenEvent} />
                </CalendarTimeGridEntry>
              ))}
              {postsInHour(day, hour).map((post) => (
                <CalendarTimeGridEntry key={post.id} dayIndex={0}>
                  <PostChip
                    post={post}
                    lines={4}
                    selected={post.id === selectedPostId}
                    onOpen={onOpenPost}
                  />
                </CalendarTimeGridEntry>
              ))}
            </CalendarHourCell>
          </CalendarHourRow>
        ))}
      </CalendarHours>
    </CalendarTimeGridFrame>
  );
}

/**
 * A Monday week, seven columns of it. A column has room for a couple of lines
 * rather than a paragraph, so the weekdays go short and the chips go dense.
 */
export function CalendarWeekGrid({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
  className,
}: CalendarTimeGridBaseProps & {
  /** A Monday week of days. */
  days: readonly CalendarDay[];
}) {
  const hours = hoursFor(days);
  const hasAllDay = days.some((day) => allDayEventsOf(day).length > 0);

  return (
    <CalendarTimeGridFrame className={className}>
      <CalendarTimeGridHead columns={WEEK_COLUMNS}>
        {days.map((day) => (
          <CalendarTimeGridHeading key={day.date} day={day}>
            {formatWeekdayShort(day.date)}
          </CalendarTimeGridHeading>
        ))}
      </CalendarTimeGridHead>

      {hasAllDay ? (
        <CalendarAllDayRow columns={WEEK_COLUMNS}>
          {days.map((day, dayIndex) => (
            <CalendarAllDayCell key={day.date}>
              {allDayEventsOf(day).map((event) => (
                <CalendarTimeGridEntry key={event.id} dayIndex={dayIndex}>
                  <EventChipDense event={event} onOpen={onOpenEvent} />
                </CalendarTimeGridEntry>
              ))}
            </CalendarAllDayCell>
          ))}
        </CalendarAllDayRow>
      ) : null}

      <CalendarHours columns={WEEK_COLUMNS}>
        {hours.map((hour) => (
          <CalendarHourRow key={hour} hour={hour}>
            {days.map((day, dayIndex) => (
              <CalendarHourCell
                key={day.date}
                day={day}
                hour={hour}
                onCreatePost={onCreatePost}
              >
                {eventsInHour(day, hour).map((event) => (
                  <CalendarTimeGridEntry key={event.id} dayIndex={dayIndex}>
                    <EventChipDense event={event} onOpen={onOpenEvent} />
                  </CalendarTimeGridEntry>
                ))}
                {postsInHour(day, hour).map((post) => (
                  <CalendarTimeGridEntry key={post.id} dayIndex={dayIndex}>
                    <PostChipDense
                      post={post}
                      lines={2}
                      selected={post.id === selectedPostId}
                      onOpen={onOpenPost}
                    />
                  </CalendarTimeGridEntry>
                ))}
              </CalendarHourCell>
            ))}
          </CalendarHourRow>
        ))}
      </CalendarHours>
    </CalendarTimeGridFrame>
  );
}
