import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { EventChipData } from "@/components/features/calendar/event-chip";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { UpNextItem } from "@/components/features/calendar/up-next-list";
import { transformCalendarEventRow } from "@/entities/calendar-event";
import {
  buildCalendarRange,
  buildDays,
  type EventsByDay,
  type PostsByDay,
  weekStart,
} from "@/lib/calendar";
import {
  formatDayShort,
  formatDayTime,
  formatTime,
  formatTimeRange,
  toDateKey,
  toTitle,
} from "@/lib/format";
import { getDb, getNow } from "@/mocks/db";
import {
  getAssetLibrary,
  indexAssetsByPath,
  indexClients,
  scheduledPosts,
  toPostChip,
} from "@/services/posts";

export interface CalendarMonth {
  /** "2026-09". */
  month: string;
  /** "September 2026". */
  rangeLabel: string;
  /** Whole weeks starting Monday, so the grid never has a ragged first row. */
  days: readonly CalendarDay[];
}

export interface CalendarPosts {
  /** Every post with a slot, keyed by the day it lands on. */
  postsByDay: PostsByDay;
  /** Connected-calendar events, keyed the same way. */
  eventsByDay: EventsByDay;
  /** The mock's fixed clock, as a date key. */
  today: string;
  /** Assets the editor can attach to a post. */
  mediaLibrary: readonly AssetTileData[];
}

/** Chips keyed by date. Drafts have no day, so they never land in here. */
function chipsByDay(): PostsByDay {
  const clients = indexClients();
  const assets = indexAssetsByPath();
  const byDay: Record<string, readonly PostChipData[]> = {};

  for (const post of scheduledPosts()) {
    const client = clients.get(post.clientId);
    if (post.scheduledAt === null || client === undefined) continue;
    const key = post.scheduledAt.slice(0, 10);
    byDay[key] = [...(byDay[key] ?? []), toPostChip(post, client, assets)];
  }

  return byDay;
}

function toEventChip(
  event: ReturnType<typeof transformCalendarEventRow>,
): EventChipData {
  return {
    id: event.id,
    title: event.title,
    time: event.allDay ? "All day" : formatTime(event.startsAt),
    ...(event.allDay ? {} : { endTime: formatTime(event.endsAt) }),
    allDay: event.allDay,
    ...(event.location === null ? {} : { location: event.location }),
    ...(event.notes === null ? {} : { notes: event.notes }),
    calendarName: event.calendarName,
    source: event.source,
    whenLabel: event.allDay
      ? `${formatDayShort(event.startsAt)} · All day`
      : `${formatDayShort(event.startsAt)} · ${formatTimeRange(event.startsAt, event.endsAt)}`,
  };
}

/** Events keyed by the day they start on. */
function eventsByDay(): EventsByDay {
  const byDay: Record<string, readonly EventChipData[]> = {};

  for (const row of getDb().app.calendar_events) {
    const event = transformCalendarEventRow(row);
    const key = event.startsAt.slice(0, 10);
    byDay[key] = [...(byDay[key] ?? []), toEventChip(event)];
  }

  return byDay;
}

/**
 * The calendar page. It hands over the chips rather than a grid, because the
 * view, the month, and the search all change in the browser: `lib/calendar`
 * builds the cells from these.
 */
export function getCalendarPosts(): CalendarPosts {
  return {
    postsByDay: chipsByDay(),
    eventsByDay: eventsByDay(),
    today: toDateKey(getNow()),
    mediaLibrary: getAssetLibrary(),
  };
}

/** One month of cells. The landing shows this; the page builds its own. */
export function getCalendarMonth(month?: string): CalendarMonth {
  const today = toDateKey(getNow());
  const anchor = month === undefined ? today : `${month}-01`;
  const range = buildCalendarRange(
    "month",
    anchor,
    chipsByDay(),
    today,
    "",
    eventsByDay(),
  );

  return {
    month: anchor.slice(0, 7),
    rangeLabel: range.rangeLabel,
    days: range.days,
  };
}

/**
 * The landing's compact strip: whole weeks from the Monday of this week, so
 * "next two weeks" always starts where the calendar page starts.
 */
export function getUpcomingWeeks(weeks = 2): readonly CalendarDay[] {
  const today = toDateKey(getNow());
  return buildDays(weekStart(today), weeks * 7, chipsByDay(), today, {
    events: eventsByDay(),
  });
}

/** The right rail: what goes out next, soonest first. */
export function getUpNext(limit = 3): readonly UpNextItem[] {
  const clients = indexClients();
  const nowIso = getNow().toISOString();

  return scheduledPosts()
    .filter(
      (post) =>
        post.status === "scheduled" &&
        post.scheduledAt !== null &&
        post.scheduledAt > nowIso,
    )
    .slice(0, limit)
    .map((post) => ({
      id: post.id,
      when: formatDayTime(post.scheduledAt ?? ""),
      // Two lines in the rail, so the row can say what the post is about.
      title: toTitle(post.content, 120),
      profileName: clients.get(post.clientId)?.name ?? "Unknown profile",
    }));
}
