import type { PostChipLines } from "@/components/features/calendar/post-chip";
import type { CalendarDay, EventChipData } from "@/entities/calendar-event";
import type { PostChipData } from "@/entities/post";
import type { ElementSize } from "@/lib/use-element-size";
import { spacing, typeScale } from "@/styles/tokens";

/**
 * What a calendar cell can hold, kept clear of the grid so the planning stays
 * a pure function of a measured width and row height.
 */

/**
 * How a chip is drawn: a card with the name, label, excerpt, and time; a dense
 * card with the name and a two-line excerpt; or one truncated line.
 */
export type ChipVariant = "card" | "dense" | "line";

/** The chip variants a cell draws its events and posts with. */
export interface ChipVariants {
  post: ChipVariant;
  event: ChipVariant;
}

export const CARDS: ChipVariants = { post: "card", event: "card" };
export const DENSE: ChipVariants = { post: "dense", event: "dense" };
export const LINES: ChipVariants = { post: "line", event: "line" };

/** Cells narrower than this show line chips: a card's text would wrap to a word a line. */
const LINE_CELL_WIDTH = 96;

/** The excerpt a full card shows, and the most posts a cell lists. */
export const FULL_LINES: PostChipLines = 3;

/**
 * How much of the post each variant shows, given the room a full card has:
 * the dense card keeps two lines, the line chip one.
 */
export function linesFor(variant: ChipVariant): PostChipLines {
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
export function cellWidthOf(size: ElementSize | undefined): number | undefined {
  return size === undefined ? undefined : (size.width - 6) / 7;
}

/**
 * The chips for a row that grows with its content: full cards, unless the
 * cells are too narrow for a card's text, then lines.
 */
export function variantsForWidth(cellWidth: number | undefined): ChipVariants {
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
export function variantsForRow(
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

export interface CellPlan {
  events: readonly EventChipData[];
  posts: readonly PostChipData[];
  hidden: number;
}

/**
 * What a cell that grows with its content shows: every event, then the first
 * `chipLimit` posts, the rest as "+N more".
 */
export function planCell(day: CalendarDay, chipLimit: number): CellPlan {
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
export function planFittedCell(
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

/** The height of the rows a fitted month shares between its weeks. */
export function rowHeightOf(
  size: ElementSize | undefined,
  rows: number,
): number | undefined {
  return size !== undefined && rows > 0
    ? (size.height - (rows - 1)) / rows
    : undefined;
}
