"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { AddPostButton } from "@/components/features/calendar/add-post-button";
import { WEEKDAYS } from "@/components/features/calendar/calendar-copy";
import { CalendarDayNumber } from "@/components/features/calendar/calendar-day-number";
import {
  EventChip,
  type EventChipData,
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
import { formatDayShort } from "@/lib/format";
import { type ElementSize, useElementSize } from "@/lib/use-element-size";
import { fade, stagger } from "@/styles/motion";
import { spacing, typeScale } from "@/styles/tokens";

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

interface CalendarGridBaseProps {
  /** Rows of seven days, starting Monday. */
  days: readonly CalendarDay[];
  selectedPostId?: string;
  onOpenPost?: (post: PostChipData, options?: PostOpenOptions) => void;
  onOpenEvent?: (event: EventChipData) => void;
  className?: string;
}

/**
 * How a chip is drawn: a card with the name, label, excerpt, and time; a dense
 * card with the name and a two-line excerpt; or one truncated line.
 */
type ChipVariant = "card" | "dense" | "line";

/** The chip variants a cell draws its events and posts with. */
interface ChipVariants {
  post: ChipVariant;
  event: ChipVariant;
}

const CARDS: ChipVariants = { post: "card", event: "card" };
const DENSE: ChipVariants = { post: "dense", event: "dense" };
const LINES: ChipVariants = { post: "line", event: "line" };

/** Cells narrower than this show line chips: a card's text would wrap to a word a line. */
const LINE_CELL_WIDTH = 96;

/** The excerpt a full card shows, and the most posts a cell lists. */
const FULL_LINES: PostChipLines = 3;

/**
 * How much of the post each variant shows, given the room a full card has:
 * the dense card keeps two lines, the line chip one.
 */
function linesFor(variant: ChipVariant): PostChipLines {
  switch (variant) {
    case "card":
      return FULL_LINES;
    case "dense":
      return FULL_LINES > 2 ? 2 : FULL_LINES;
    case "line":
      return 1;
  }
}

/** Hairlines sit between the cells, so take them off before sharing out. */
function cellWidthOf(size: ElementSize | undefined): number | undefined {
  return size === undefined ? undefined : (size.width - 6) / 7;
}

/**
 * The chips for a row that grows with its content: full cards, unless the
 * cells are too narrow for a card's text, then lines.
 */
function variantsForWidth(cellWidth: number | undefined): ChipVariants {
  return cellWidth !== undefined && cellWidth < LINE_CELL_WIDTH ? LINES : CARDS;
}

/*
 * The heights a fitted cell budgets with, from the tokens the chips are built
 * from, so the grid and the chips cannot drift apart. Each chip is padding
 * plus its lines of caption text plus the gaps between them; the selected
 * chip's shadow is inside the margin below.
 */
const LINE = typeScale.caption.lineHeight;
const CHIP_MARGIN = 2;

function postChipHeight(variant: ChipVariant, lines: number): number {
  switch (variant) {
    case "card":
      // Name, label, the excerpt, the time.
      return (
        2 * spacing.xs + (3 + lines) * LINE + 3 * spacing.xxs + CHIP_MARGIN
      );
    case "dense":
      return 2 * spacing.xs + (1 + lines) * LINE + spacing.xxs + CHIP_MARGIN;
    case "line":
      return 2 * spacing.xxs + LINE + CHIP_MARGIN;
  }
}

function eventChipHeight(variant: ChipVariant): number {
  switch (variant) {
    case "card":
      return 2 * spacing.xs + 2 * LINE + spacing.xxs + CHIP_MARGIN;
    case "dense":
      return 2 * spacing.xs + LINE + CHIP_MARGIN;
    case "line":
      return 2 * spacing.xxs + LINE + CHIP_MARGIN;
  }
}

/** The cell's padding and its day number, before any chip. */
const CELL_OVERHEAD = 2 * spacing.xs + 20;
/** Between the day number and each chip. */
const CELL_GAP = spacing.xs;
/** The "+N more" line. */
const MORE_HEIGHT = LINE + CELL_GAP;

/** Richest first. */
const VARIANTS: readonly ChipVariant[] = ["card", "dense", "line"];

/**
 * The chips for a fitted row: the richest post chip a row of this height can
 * hold along with an event, since a working day usually has both; the event
 * gives way first, since it is the quieter of the two. A tall cell keeps the
 * card, a laptop's month gets the dense card, a short row gets lines. Cells
 * too narrow for a card's text get lines whatever their height.
 */
function variantsForRow(
  cellWidth: number | undefined,
  rowHeight: number | undefined,
): ChipVariants {
  if (cellWidth !== undefined && cellWidth < LINE_CELL_WIDTH) return LINES;
  if (rowHeight === undefined) return CARDS;
  const room = rowHeight - CELL_OVERHEAD - 2 * CELL_GAP;
  for (const [index, post] of VARIANTS.entries()) {
    const height = postChipHeight(post, linesFor(post));
    for (const event of VARIANTS.slice(index)) {
      if (height + eventChipHeight(event) <= room) return { post, event };
    }
  }
  return LINES;
}

interface CellPlan {
  events: readonly EventChipData[];
  posts: readonly PostChipData[];
  hidden: number;
}

/**
 * What a cell that grows with its content shows: every event, then the first
 * `chipLimit` posts, the rest as "+N more".
 */
function planCell(day: CalendarDay, chipLimit: number): CellPlan {
  const events = day.events ?? [];
  const shown = day.posts.slice(0, chipLimit);
  return { events, posts: shown, hidden: day.posts.length - shown.length };
}

/**
 * What a fitted cell shows: its events, then its posts, in order, until the
 * row runs out of room, keeping a line back for "+N more" when anything is
 * left over. Before the row has been measured, the cell plans as if it could
 * grow.
 */
function planFittedCell(
  day: CalendarDay,
  variants: ChipVariants,
  lines: number,
  rowHeight: number | undefined,
): CellPlan {
  if (rowHeight === undefined) return planCell(day, FULL_LINES);
  const events = day.events ?? [];
  const posts = day.posts;

  const heights = [
    ...events.map(() => eventChipHeight(variants.event)),
    ...posts.map(() => postChipHeight(variants.post, lines)),
  ];
  let used = CELL_OVERHEAD;
  let shown = 0;
  for (const [index, height] of heights.entries()) {
    const rest = heights.length - index - 1;
    const need = height + CELL_GAP + (rest > 0 ? MORE_HEIGHT : 0);
    if (used + need > rowHeight) break;
    used += height + CELL_GAP;
    shown += 1;
  }
  const shownPosts = Math.min(FULL_LINES, Math.max(0, shown - events.length));
  return {
    events: events.slice(0, Math.min(shown, events.length)),
    posts: posts.slice(0, shownPosts),
    hidden: heights.length - Math.min(shown, events.length) - shownPosts,
  };
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
  const rows = Math.ceil(days.length / 7);
  const rowHeight =
    size !== undefined && rows > 0
      ? (size.height - (rows - 1)) / rows
      : undefined;
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
