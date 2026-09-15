"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { AddPostButton } from "@/components/features/calendar/add-post-button";
import { WEEKDAYS } from "@/components/features/calendar/calendar-copy";
import { CalendarDayNumber } from "@/components/features/calendar/calendar-day-number";
import {
  EventChip,
  EventChipDense,
  EventChipLine,
} from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipBaseProps,
  type PostChipData,
  PostChipDense,
  PostChipLine,
  type PostChipLines,
  type PostOpenOptions,
} from "@/components/features/calendar/post-chip";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import type { CalendarDay, EventChipData } from "@/entities/calendar-event";
import {
  type CellPlan,
  type ChipVariant,
  type ChipVariants,
  cellWidthOf,
  DENSE,
  linesFor,
  planCell,
  planFittedCell,
  rowHeightOf,
  variantsForRow,
  variantsForWidth,
} from "@/lib/calendar-layout";
import { formatDayShort } from "@/lib/format";
import { useElementSize } from "@/lib/use-element-size";
import { fade, stagger } from "@/styles/motion";

interface CalendarGridBaseProps {
  /** Rows of seven days, starting Monday. */
  days: readonly CalendarDay[];
  selectedPostId?: string;
  onOpenPost?: (post: PostChipData, options?: PostOpenOptions) => void;
  onOpenEvent?: (event: EventChipData) => void;
  className?: string;
}

/*
 * The parts. Every calendar below is a seven-column grid: cells separated by
 * hairlines inside one rounded frame, today a filled number rather than a
 * box. Each variant assembles these into its own tree.
 */

/** The weekday headings across the top, initials where the frame is narrow. */
function CalendarWeekdays() {
  return (
    <div role="row" className="grid grid-cols-7">
      {WEEKDAYS.map((weekday) => (
        <span
          key={weekday}
          role="columnheader"
          aria-label={weekday}
          className="min-w-0 truncate px-xxs py-xs text-center type-micro text-imagine-foreground-muted"
        >
          <span aria-hidden="true" className="@min-[22rem]/cal:hidden">
            {weekday.slice(0, 1)}
          </span>
          <span aria-hidden="true" className="hidden @min-[22rem]/cal:inline">
            {weekday}
          </span>
        </span>
      ))}
    </div>
  );
}

/** Which calendar below is being drawn; feeds the morph's re-measure. */
type CalendarVariant = "strip" | "preview" | "month" | "month-fit";

/**
 * The rounded frame, with the weekday row along the top. Carries the shared
 * layout id when it morphs to or from the composer preview; the `variant`
 * names which calendar this is, so the morph re-measures when it changes.
 */
function CalendarFrame({
  variant,
  chips,
  layoutId,
  className,
  children,
}: {
  variant: CalendarVariant;
  /** The post chip the cells are drawing, for anything that styles by it. */
  chips: ChipVariant;
  layoutId?: string;
  className?: string;
  children: ReactNode;
}) {
  const layoutLocked = useLayoutLocked();
  return (
    <motion.div
      {...(layoutId === undefined || layoutLocked
        ? {}
        : { layoutId, layoutDependency: variant })}
      data-slot="calendar-grid"
      data-variant={variant}
      data-chips={chips}
      role="grid"
      className={cn(
        "@container/cal flex w-full min-w-0 flex-col overflow-hidden rounded-panel bg-imagine-surface-raised shadow-raised",
        className,
      )}
    >
      <CalendarWeekdays />
      {children}
    </motion.div>
  );
}

/** The rows of cells. Takes a ref so a calendar can measure its cells. */
function CalendarRows({
  ref,
  className,
  children,
}: {
  ref?: (node: HTMLElement | null) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={ref}
      role="rowgroup"
      className={cn(
        "grid min-w-0 grid-cols-7 gap-px bg-imagine-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * One day: the day number, then whatever the calendar puts in it. The cell is
 * the `chip` container, so chips slim down in a narrow one. Fades in on a
 * diagonal wave by row + column rather than by index, so a six-week month
 * sweeps in over about half a second instead of nearly a second.
 */
function CalendarCell({
  day,
  index,
  className,
  onSelectDay,
  onCreatePost,
  children,
}: {
  day: CalendarDay;
  /** Position in the grid, for the entrance wave. */
  index: number;
  className?: string;
  onSelectDay?: (day: CalendarDay) => void;
  /** Shows the plus a cell reveals on hover. */
  onCreatePost?: (date: string) => void;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const wave = Math.floor(index / 7) + (index % 7);
  return (
    <motion.div
      role="gridcell"
      aria-selected={day.isToday ? true : undefined}
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...fade.slow, delay: wave * stagger.calendar }}
      tabIndex={onSelectDay ? 0 : undefined}
      onClick={
        onSelectDay
          ? () => {
              onSelectDay(day);
            }
          : undefined
      }
      onKeyDown={
        onSelectDay
          ? (event) => {
              // Only the cell's own keys: a chip or the plus inside it
              // answers Enter and Space itself.
              if (event.target !== event.currentTarget) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              onSelectDay(day);
            }
          : undefined
      }
      className={cn(
        "group/cell @container/chip relative flex flex-col gap-xs bg-imagine-surface p-xs",
        day.isOutside && "bg-imagine-surface/60",
        onSelectDay &&
          "cursor-pointer transition-colors outline-none hover:bg-imagine-surface-raised/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset",
        className,
      )}
    >
      {onCreatePost === undefined ? null : (
        <AddPostButton
          when={formatDayShort(day.date)}
          onClick={() => {
            onCreatePost(day.date);
          }}
        />
      )}
      <CalendarDayNumber day={day} />
      {children}
    </motion.div>
  );
}

/** The event chips, by the variant a cell has measured room for. */
const EVENT_CHIP: Record<ChipVariant, typeof EventChip> = {
  card: EventChip,
  dense: EventChipDense,
  line: EventChipLine,
};

/**
 * The post chip for the variant a cell has measured room for. The line chip
 * shows one line whatever the excerpt, so it is given none.
 */
function CellPostChip({
  variant,
  lines,
  ...props
}: PostChipBaseProps & { variant: ChipVariant; lines: PostChipLines }) {
  switch (variant) {
    case "card":
      return <PostChip lines={lines} {...props} />;
    case "dense":
      return <PostChipDense lines={lines} {...props} />;
    case "line":
      return <PostChipLine {...props} />;
  }
}

/**
 * A cell's chips: its events, then its posts, then "+N more" for whatever the
 * plan left out. Which chip is drawn follows the room the cell has measured,
 * not a choice its caller makes.
 */
function CalendarCellChips({
  plan,
  variants,
  lines,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
}: {
  plan: CellPlan;
  variants: ChipVariants;
  lines: PostChipLines;
  selectedPostId?: string;
  onOpenPost?: (post: PostChipData, options?: PostOpenOptions) => void;
  onOpenEvent?: (event: EventChipData) => void;
}) {
  const Event = EVENT_CHIP[variants.event];
  return (
    <>
      {plan.events.map((event) => (
        <Event key={event.id} event={event} onOpen={onOpenEvent} />
      ))}
      {plan.posts.map((post) => (
        <CellPostChip
          key={post.id}
          variant={variants.post}
          post={post}
          lines={lines}
          selected={post.id === selectedPostId}
          onOpen={onOpenPost}
        />
      ))}
      {plan.hidden > 0 ? (
        <span className="px-xs type-caption text-imagine-foreground-muted">
          +{plan.hidden} more
        </span>
      ) : null}
    </>
  );
}

/*
 * The calendars. The frame sits in a padded, sideways-scrolling gutter so its
 * drop shadow is not clipped: any overflow on the frame (or a parent) clips
 * both axes, which is why the gutter lives here rather than on the page.
 */

/**
 * The landing's two-week strip. It sits under the timeline at its natural
 * height: a cell's floor is only what the day number and one full chip need,
 * and a busier day grows its row. Each day shows one post, the rest as
 * "+N more"; the chips slim to a line before the cells get narrower than a
 * word.
 */
export function CalendarStrip({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  className,
}: CalendarGridBaseProps) {
  const [rowsRef, size] = useElementSize();
  const variants = variantsForWidth(cellWidthOf(size));
  const lines = linesFor(variants.post);

  return (
    <div className={cn("min-w-0 overflow-x-auto p-m", className)}>
      <CalendarFrame
        variant="strip"
        chips={variants.post}
        className="md:min-w-[36rem]"
      >
        <CalendarRows ref={rowsRef}>
          {days.map((day, index) => (
            <CalendarCell
              key={day.date}
              day={day}
              index={index}
              className="min-h-32"
            >
              <CalendarCellChips
                plan={planCell(day, 1)}
                variants={variants}
                lines={lines}
                selectedPostId={selectedPostId}
                onOpenPost={onOpenPost}
                onOpenEvent={onOpenEvent}
              />
            </CalendarCell>
          ))}
        </CalendarRows>
      </CalendarFrame>
    </div>
  );
}

/**
 * The composer's preview: short cells, too short for the time and profile
 * lines, so every chip is the dense card whatever the cell's size, showing
 * enough to know which post it is. No gutter: the composer frames it. Carries
 * the shared layout id so expanding it morphs into the calendar page.
 */
export function CalendarPreview({
  days,
  layoutId,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  className,
}: CalendarGridBaseProps & {
  /** Shared layout id with the calendar page's month. */
  layoutId?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <CalendarFrame variant="preview" chips="dense" layoutId={layoutId}>
        <CalendarRows>
          {days.map((day, index) => (
            <CalendarCell
              key={day.date}
              day={day}
              index={index}
              className="min-h-20"
            >
              <CalendarCellChips
                plan={planCell(day, 1)}
                variants={DENSE}
                lines={2}
                selectedPostId={selectedPostId}
                onOpenPost={onOpenPost}
                onOpenEvent={onOpenEvent}
              />
            </CalendarCell>
          ))}
        </CalendarRows>
      </CalendarFrame>
    </div>
  );
}

/**
 * A month at its natural height, the way the centered landing shows the
 * weeks ahead: tall cells with full cards, three posts before "+N more", and
 * the page scrolls to reach the rest. The chips slim to a line before the
 * cells get narrower than a word.
 */
export function CalendarMonth({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onSelectDay,
  className,
}: CalendarGridBaseProps & {
  onSelectDay?: (day: CalendarDay) => void;
}) {
  const [rowsRef, size] = useElementSize();
  const variants = variantsForWidth(cellWidthOf(size));
  const lines = linesFor(variants.post);

  return (
    <div className={cn("min-w-0 overflow-x-auto p-m", className)}>
      <CalendarFrame
        variant="month"
        chips={variants.post}
        className="md:min-w-[36rem]"
      >
        <CalendarRows ref={rowsRef}>
          {days.map((day, index) => (
            <CalendarCell
              key={day.date}
              day={day}
              index={index}
              className="min-h-40"
              onSelectDay={onSelectDay}
            >
              <CalendarCellChips
                plan={planCell(day, 3)}
                variants={variants}
                lines={lines}
                selectedPostId={selectedPostId}
                onOpenPost={onOpenPost}
                onOpenEvent={onOpenEvent}
              />
            </CalendarCell>
          ))}
        </CalendarRows>
      </CalendarFrame>
    </div>
  );
}

/**
 * The calendar page's month. It is given its height and makes the month fit
 * it: rows share the height, and each cell shows as many chips as its row has
 * room for, the rest as "+N more". Chips slim down as the rows do, from a
 * card with an excerpt to a single line, so a laptop sees the whole month at
 * once and a large monitor sees more of each post. A cell's floor is the day
 * number and one line chip; below that the rows scroll inside the frame
 * rather than losing the chips. Carries the shared layout id, so the page
 * arrives by morphing out of the composer preview.
 */
export function CalendarMonthFit({
  days,
  layoutId,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
  className,
}: CalendarGridBaseProps & {
  /** Shared layout id with the composer preview. */
  layoutId?: string;
  /** Shows the plus a cell reveals on hover. */
  onCreatePost?: (date: string) => void;
}) {
  const [rowsRef, size] = useElementSize();
  const rowHeight = rowHeightOf(size, Math.ceil(days.length / 7));
  const variants = variantsForRow(cellWidthOf(size), rowHeight);
  const lines = linesFor(variants.post);

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto p-m",
        className,
      )}
    >
      <CalendarFrame
        variant="month-fit"
        chips={variants.post}
        layoutId={layoutId}
        className="min-h-0 flex-1 md:min-w-[36rem]"
      >
        {/* A month of full chips can run past the page: the rows scroll
            inside the frame rather than the frame growing off the screen. */}
        <CalendarRows
          ref={rowsRef}
          className="min-h-0 flex-1 auto-rows-fr overflow-y-auto"
        >
          {days.map((day, index) => (
            <CalendarCell
              key={day.date}
              day={day}
              index={index}
              // A fitted cell clips rather than pushes its row taller; the
              // plan keeps its chips inside, this is the backstop.
              className="min-h-14 overflow-hidden"
              onCreatePost={onCreatePost}
            >
              <CalendarCellChips
                plan={planFittedCell(day, variants, lines, rowHeight)}
                variants={variants}
                lines={lines}
                selectedPostId={selectedPostId}
                onOpenPost={onOpenPost}
                onOpenEvent={onOpenEvent}
              />
            </CalendarCell>
          ))}
        </CalendarRows>
      </CalendarFrame>
    </div>
  );
}
