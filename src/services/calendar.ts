import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { UpNextItem } from "@/components/features/calendar/up-next-list";
import { formatDayTime, formatMonthYear, toDateKey, toTitle } from "@/lib/format";
import { getNow } from "@/mocks/db";
import {
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

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function parseMonth(month: string | undefined): { year: number; index: number } {
  const now = getNow();
  if (month === undefined) {
    return { year: now.getUTCFullYear(), index: now.getUTCMonth() };
  }
  const [year, monthNumber] = month.split("-");
  return { year: Number(year), index: Number(monthNumber) - 1 };
}

/** Posts land on the day they are scheduled for; drafts have no day. */
export function getCalendarMonth(month?: string): CalendarMonth {
  const { year, index } = parseMonth(month);
  const clients = indexClients();
  const assets = indexAssetsByPath();

  const byDay = new Map<string, CalendarDay["posts"]>();
  for (const post of scheduledPosts()) {
    const client = clients.get(post.clientId);
    if (post.scheduledAt === null || client === undefined) continue;
    const key = post.scheduledAt.slice(0, 10);
    byDay.set(key, [
      ...(byDay.get(key) ?? []),
      toPostChip(post, client, assets),
    ]);
  }

  const firstOfMonth = new Date(Date.UTC(year, index, 1));
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -mondayOffset);
  const daysInMonth = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;
  const todayKey = toDateKey(getNow());

  const days: CalendarDay[] = [];
  for (let cell = 0; cell < cellCount; cell += 1) {
    const date = addDays(gridStart, cell);
    const key = toDateKey(date);
    days.push({
      date: key,
      dayNumber: date.getUTCDate(),
      isToday: key === todayKey,
      isOutside: date.getUTCMonth() !== index,
      posts: byDay.get(key) ?? [],
    });
  }

  return {
    month: `${String(year)}-${String(index + 1).padStart(2, "0")}`,
    rangeLabel: formatMonthYear(firstOfMonth.toISOString()),
    days,
  };
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
      title: toTitle(post.content, 56),
      profileName: clients.get(post.clientId)?.name ?? "Unknown profile",
    }));
}
