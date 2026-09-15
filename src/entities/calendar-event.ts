/**
 * A calendar event as the app has it: a slot from a connected calendar
 * (Google, for now). Not a post. The agent drafts about these; they do not
 * go out on LinkedIn themselves.
 */
import type { PostChipData } from "@/entities/post";
import type { CalendarEventRow } from "@/entities/rows";

export const CALENDAR_EVENT_SOURCES = ["google"] as const;

export type CalendarEventSource = (typeof CALENDAR_EVENT_SOURCES)[number];

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string | null;
  notes: string | null;
  calendarName: string;
  source: CalendarEventSource;
}

export interface EventChipData {
  id: string;
  title: string;
  /** "9:00" or "All day". */
  time: string;
  /** "10:30" when the event has an end on the same day. */
  endTime?: string;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendarName: string;
  source: "google";
  /** "Tue, 8 Sep at 9:00–10:00". */
  whenLabel: string;
}

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

export interface UpNextItem {
  id: string;
  /** "Tue 9:00". */
  when: string;
  title: string;
  profileName: string;
}

export function transformCalendarEventRow(
  row: CalendarEventRow,
): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    location: row.location,
    notes: row.notes,
    calendarName: row.calendar_name,
    source:
      CALENDAR_EVENT_SOURCES.find((source) => source === row.source) ??
      "google",
  };
}
