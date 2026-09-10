/**
 * Presentation formatting for mock data. Everything reads dates in UTC so the
 * same JSON renders identically in a test, on a server, and in a browser.
 */

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAYS_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function monthShort(date: Date): string {
  return MONTHS_SHORT[date.getUTCMonth()] ?? "";
}

function weekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[date.getUTCDay()] ?? "";
}

/** "12.4k". Thousands only; nothing in the mock reaches a million. */
export function formatCompact(value: number): string {
  if (value < 1000) return String(Math.round(value));
  const thousands = value / 1000;
  const text =
    thousands < 10 ? thousands.toFixed(1) : String(Math.round(thousands));
  return `${text.endsWith(".0") ? text.slice(0, -2) : text}k`;
}

/** "+12%", "-4%", "0%". */
export function formatPercentDelta(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "0%" : "+100%";
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${String(change)}%`;
}

export function deltaDirection(
  current: number,
  previous: number,
): "up" | "down" | "flat" {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

/** "9:00–10:30", or "All day". */
export function formatTimeRange(
  start: string,
  end: string,
  allDay = false,
): string {
  if (allDay) return "All day";
  return `${formatTime(start)}–${formatTime(end)}`;
}

/** "9:00". */
export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCHours())}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

/** "Tuesday". */
export function formatWeekdayLong(iso: string): string {
  return WEEKDAYS_LONG[new Date(iso).getUTCDay()] ?? "";
}

/** "Tue". */
export function formatWeekdayShort(iso: string): string {
  return weekdayShort(new Date(iso));
}

/** "Mon, 7 Sep". */
export function formatDayShort(iso: string): string {
  return `${formatWeekdayShort(iso)}, ${formatDayMonth(iso)}`;
}

/** "Tue 9:00". */
export function formatDayTime(iso: string): string {
  const date = new Date(iso);
  return `${weekdayShort(date)} ${formatTime(iso)}`;
}

/** "3 Sep". */
export function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getUTCDate())} ${monthShort(date)}`;
}

/** "Sep". */
export function formatMonthShort(iso: string): string {
  return monthShort(new Date(iso));
}

/** "Tue, 8 Sep at 9:00". */
export function formatWhen(iso: string): string {
  const date = new Date(iso);
  return `${weekdayShort(date)}, ${formatDayMonth(iso)} at ${formatTime(iso)}`;
}

/** "Monday, 7 September". */
export function formatFullDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getUTCDay()] ?? ""}, ${String(date.getUTCDate())} ${MONTHS_LONG[date.getUTCMonth()] ?? ""}`;
}

/** 0 for Monday, so a week starts where the calendar starts. */
export function weekdayIndex(iso: string): number {
  return (new Date(iso).getUTCDay() + 6) % 7;
}

/** "September 2026". */
export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  return `${MONTHS_LONG[date.getUTCMonth()] ?? ""} ${String(date.getUTCFullYear())}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "12m ago", "2h ago", "Yesterday", then falls back to "3 Sep". */
export function formatRelative(iso: string, now: Date): string {
  const elapsed = now.getTime() - new Date(iso).getTime();
  if (elapsed < MINUTE) return "Just now";
  if (elapsed < HOUR) return `${String(Math.floor(elapsed / MINUTE))}m ago`;
  if (elapsed < DAY) return `${String(Math.floor(elapsed / HOUR))}h ago`;
  if (elapsed < 2 * DAY) return "Yesterday";
  return formatDayMonth(iso);
}

/** The ISO date, without the time. Used as a calendar day key. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** First line of a post body, trimmed to fit a chip or a row. */
export function toTitle(content: string, max = 72): string {
  const firstLine = content.split("\n", 1)[0]?.trim() ?? "";
  const withoutPrefix = firstLine.replace(/^draft:\s*/i, "");
  if (withoutPrefix.length <= max) return withoutPrefix;
  return `${withoutPrefix.slice(0, max - 1).trimEnd()}…`;
}
