import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import { formatDayMonth, formatDayShort, formatMonthYear } from "@/lib/format";

/**
 * The date math behind the calendar, kept clear of the mock so the page can
 * change view, step through months, and search in the browser. The selectors
 * hand over the chips; everything here is a pure function of a date key.
 *
 * A date key is an ISO date without the time, "2026-09-08". Days are read in
 * UTC, like the rest of the formatting, and weeks start on Monday.
 */

export type CalendarView = "day" | "week" | "month";

/** Chips keyed by date. A plain object, so it crosses to the client as props. */
export type PostsByDay = Readonly<Record<string, readonly PostChipData[]>>;

export interface CalendarRange {
  /** "Tue, 8 Sep", "8 to 14 Sep", or "September 2026". */
  rangeLabel: string;
  days: readonly CalendarDay[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parse(key: string): number {
  return Date.parse(`${key}T00:00:00.000Z`);
}

function toKey(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

export function addDays(key: string, days: number): string {
  return toKey(parse(key) + days * DAY_MS);
}

/** The Monday of that week, so every grid starts where the week starts. */
export function weekStart(key: string): string {
  return addDays(key, -((new Date(parse(key)).getUTCDay() + 6) % 7));
}

/** Title or profile, case insensitive. Enough for thirty three posts. */
function matches(chip: PostChipData, query: string): boolean {
  return (
    chip.title.toLowerCase().includes(query) ||
    chip.profile.toLowerCase().includes(query)
  );
}

export interface PostHit {
  /** The day the post sits on, as a date key. */
  date: string;
  post: PostChipData;
}

/** Every post matching the query, whatever the range on screen, by date. */
export function searchPosts(posts: PostsByDay, query: string): PostHit[] {
  const needle = query.trim().toLowerCase();
  if (needle === "") return [];
  return Object.keys(posts)
    .toSorted()
    .flatMap((date) =>
      (posts[date] ?? []).flatMap((post) =>
        matches(post, needle) ? [{ date, post }] : [],
      ),
    );
}

interface BuildOptions {
  /** Month index the cells belong to, so the ones either side read as outside. */
  month?: number;
  /** Chips that do not match are left out of their day. */
  query?: string;
}

/** `count` cells from `start`, each carrying the chips that survive the query. */
export function buildDays(
  start: string,
  count: number,
  posts: PostsByDay,
  today: string,
  { month, query = "" }: BuildOptions = {},
): readonly CalendarDay[] {
  const needle = query.trim().toLowerCase();
  const days: CalendarDay[] = [];

  for (let cell = 0; cell < count; cell += 1) {
    const key = addDays(start, cell);
    const date = new Date(parse(key));
    const chips = posts[key] ?? [];

    days.push({
      date: key,
      dayNumber: date.getUTCDate(),
      isToday: key === today,
      ...(month === undefined
        ? {}
        : { isOutside: date.getUTCMonth() !== month }),
      posts:
        needle === "" ? chips : chips.filter((chip) => matches(chip, needle)),
    });
  }

  return days;
}

/** "8 to 14 Sep", or "29 Sep to 5 Oct" when the week crosses a month. */
function weekLabel(start: string, end: string): string {
  const from =
    start.slice(0, 7) === end.slice(0, 7)
      ? String(new Date(parse(start)).getUTCDate())
      : formatDayMonth(start);
  return `${from} to ${formatDayMonth(end)}`;
}

/** The cells and the label for one view, around `anchor`. */
export function buildCalendarRange(
  view: CalendarView,
  anchor: string,
  posts: PostsByDay,
  today: string,
  query = "",
): CalendarRange {
  if (view === "day") {
    return {
      rangeLabel: formatDayShort(anchor),
      days: buildDays(anchor, 1, posts, today, { query }),
    };
  }

  if (view === "week") {
    const start = weekStart(anchor);
    return {
      rangeLabel: weekLabel(start, addDays(start, 6)),
      days: buildDays(start, 7, posts, today, { query }),
    };
  }

  // Whole Monday weeks, so the month never has a ragged first row.
  const first = `${anchor.slice(0, 7)}-01`;
  const firstDate = new Date(parse(first));
  const month = firstDate.getUTCMonth();
  const mondayOffset = (firstDate.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(
    Date.UTC(firstDate.getUTCFullYear(), month + 1, 0),
  ).getUTCDate();

  return {
    rangeLabel: formatMonthYear(first),
    days: buildDays(
      addDays(first, -mondayOffset),
      Math.ceil((mondayOffset + daysInMonth) / 7) * 7,
      posts,
      today,
      { month, query },
    ),
  };
}

/** One step of whatever the view shows. */
export function shiftAnchor(
  view: CalendarView,
  anchor: string,
  step: 1 | -1,
): string {
  if (view === "day") return addDays(anchor, step);
  if (view === "week") return addDays(anchor, step * 7);
  // Off the first, so stepping out of a 31 day month cannot skip one.
  const date = new Date(parse(anchor));
  return toKey(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + step, 1));
}

/** How many chips the range holds, for the search count. */
export function countPosts(days: readonly CalendarDay[]): number {
  let total = 0;
  for (const day of days) total += day.posts.length;
  return total;
}
