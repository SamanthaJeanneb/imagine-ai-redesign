/**
 * A calendar event as the app has it: a slot from a connected calendar
 * (Google, for now). Not a post. The agent drafts about these; they do not
 * go out on LinkedIn themselves.
 */
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
