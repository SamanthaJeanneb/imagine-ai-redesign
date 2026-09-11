"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { AddPostButton } from "@/components/features/calendar/add-post-button";
import {
  EventChip,
  type EventChipData,
} from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipData,
  type PostChipLines,
  type PostOpenOptions,
} from "@/components/features/calendar/post-chip";
import { formatDayShort } from "@/lib/format";
import { useElementSize } from "@/lib/use-element-size";
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

export type CalendarDensity = "strip" | "preview" | "page";

interface CalendarGridProps {
  /** Rows of seven days, starting Monday. */
  days: readonly CalendarDay[];
  density?: CalendarDensity;
  /** Chips shown before the rest become "+N more". Defaults by density. */
  maxChips?: number;
  /** Rows share the height available instead of taking a minimum. */
  fill?: boolean;
  /**
   * The grid is given its height and makes the month fit it: rows share the
   * height, and each cell shows as many chips as its row has room for, the
   * rest as "+N more". Chips slim down as the rows do, from a card with an
   * excerpt to a single line, so a laptop sees the whole month at once and
   * a large monitor sees more of each post.
   */
  fit?: boolean;
  selectedPostId?: string;
  onOpenPost?: (post: PostChipData, options?: PostOpenOptions) => void;
  onOpenEvent?: (event: EventChipData) => void;
  onSelectDay?: (day: CalendarDay) => void;
  /** Shows the plus a cell reveals on hover. */
  onCreatePost?: (date: string) => void;
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

// A fitted row's floor: the day number and one line chip. Below this the rows
// scroll inside the frame rather than losing the chips.
const FIT_CELL_HEIGHT = "min-h-14";

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
 * How a chip is drawn: a card with the name, label, excerpt, and time; a dense
 * card with the name and a two-line excerpt; or one truncated line.
 */
type ChipVariant = "card" | "dense" | "line";

/** Cells narrower than this show line chips: a card's text would wrap to a word a line. */
const LINE_CELL_WIDTH = 96;

/** How much of the post each variant shows: the dense card keeps two lines. */
function linesFor(
  variant: ChipVariant,
  density: CalendarDensity,
): PostChipLines {
  const lines = CHIP_LINES[density];
  switch (variant) {
    case "card":
      return lines;
    case "dense":
      return lines > 2 ? 2 : lines;
    case "line":
      return 1;
  }
}

/*
 * The heights a fitted cell budgets with, from the tokens the chips are built
 * from, so the grid and the chips cannot drift apart. Each chip is padding
 * plus its lines of caption text plus the gaps between them; a draft's dashed
 * border and the shadow are inside the margin below.
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

interface ChipVariants {
  post: ChipVariant;
  event: ChipVariant;
}

/**
 * The richest post chip a row of this height can hold along with an event,
 * since a working day usually has both; the event gives way first, since it
 * is the quieter of the two. A tall cell keeps the card, a laptop's month
 * gets the dense card, a short row gets lines.
 */
function variantsFor(
  density: CalendarDensity,
  cellWidth: number | undefined,
  rowHeight: number | undefined,
): ChipVariants {
  if (
    density !== "preview" &&
    cellWidth !== undefined &&
    cellWidth < LINE_CELL_WIDTH
  ) {
    return { post: "line", event: "line" };
  }
  if (rowHeight === undefined) {
    const variant = density === "preview" ? "dense" : "card";
    return { post: variant, event: variant };
  }
  const room = rowHeight - CELL_OVERHEAD - 2 * CELL_GAP;
  for (const [index, post] of VARIANTS.entries()) {
    const height = postChipHeight(post, linesFor(post, density));
    for (const event of VARIANTS.slice(index)) {
      if (height + eventChipHeight(event) <= room) return { post, event };
    }
  }
  return { post: "line", event: "line" };
}

interface CellPlan {
  events: readonly EventChipData[];
  posts: readonly PostChipData[];
  hidden: number;
}

/**
 * What a cell shows: its events, then its posts, in order, until the row runs
 * out of room, keeping a line back for "+N more" when anything is left over.
 */
function planCell(
  day: CalendarDay,
  variants: ChipVariants,
  lines: number,
  chipLimit: number,
  rowHeight: number | undefined,
): CellPlan {
  const events = day.events ?? [];
  const posts = day.posts;

  if (rowHeight === undefined) {
    const shown = posts.slice(0, chipLimit);
    return { events, posts: shown, hidden: posts.length - shown.length };
  }

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
  const shownPosts = Math.min(chipLimit, Math.max(0, shown - events.length));
  return {
    events: events.slice(0, Math.min(shown, events.length)),
    posts: posts.slice(0, shownPosts),
    hidden: heights.length - Math.min(shown, events.length) - shownPosts,
  };
}

/**
 * A seven-column grid used four ways: the landing's two-week strip, the
 * composer preview, and the calendar page's month. Cells are separated by
 * hairlines inside one rounded frame; today is a filled number, not a box.
 */
export function CalendarGrid({
  days,
  density = "page",
  maxChips,
  fit = false,
  fill = fit || density === "strip",
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onSelectDay,
  onCreatePost,
  layoutId,
  className,
}: CalendarGridProps) {
  const reduceMotion = useReducedMotion();
  const [rowgroupRef, size] = useElementSize();

  const rows = Math.ceil(days.length / 7);
  // Hairlines sit between the cells, so take them off before sharing out.
  const cellWidth = size === undefined ? undefined : (size.width - 6) / 7;
  const rowHeight =
    fit && size !== undefined && rows > 0
      ? (size.height - (rows - 1)) / rows
      : undefined;

  // Preview cells are too short for the time and profile line, so they get
  // the dense card whatever their size; the strip and the page start from
  // the full card and slim down only as room runs out.
  const variants = variantsFor(density, cellWidth, rowHeight);
  const lines = linesFor(variants.post, density);
  const chipLimit = maxChips ?? DEFAULT_MAX_CHIPS[density];

  return (
    <motion.div
      layoutId={layoutId}
      data-slot="calendar-grid"
      data-density={density}
      data-chips={variants.post}
      role="grid"
      className={cn(
        "@container/cal flex w-full min-w-0 flex-col overflow-hidden rounded-panel bg-imagine-surface-raised shadow-raised",
        fill && "min-h-0",
        className,
      )}
    >
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
      <div
        ref={rowgroupRef}
        role="rowgroup"
        className={cn(
          "grid min-w-0 grid-cols-7 gap-px bg-imagine-border",
          // A month of full chips can run past the page: the rows scroll
          // inside the frame rather than the frame growing off the screen.
          fill && "min-h-0 flex-1 auto-rows-fr overflow-y-auto",
        )}
      >
        {days.map((day, index) => {
          const plan = planCell(day, variants, lines, chipLimit, rowHeight);
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
                "group/cell @container/chip relative flex flex-col gap-xs bg-imagine-surface p-xs",
                // A fitted cell clips rather than pushes its row taller; the
                // plan above keeps its chips inside, this is the backstop.
                fit
                  ? cn(FIT_CELL_HEIGHT, "overflow-hidden")
                  : CELL_HEIGHT[density],
                day.isOutside && "bg-imagine-surface/60",
                onSelectDay &&
                  "cursor-pointer transition-colors hover:bg-imagine-surface-raised/50",
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
              {plan.events.map((event) => (
                <EventChip
                  key={event.id}
                  event={event}
                  dense={variants.event === "dense"}
                  line={variants.event === "line"}
                  onOpen={onOpenEvent}
                />
              ))}
              {plan.posts.map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  dense={variants.post === "dense"}
                  line={variants.post === "line"}
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
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
