"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import {
  type CalendarDay,
  CalendarGrid,
} from "@/components/features/calendar/calendar-grid";
import { CalendarTimeGrid } from "@/components/features/calendar/calendar-time-grid";
import { CalendarToolbar } from "@/components/features/calendar/calendar-toolbar";
import {
  EventChip,
  type EventChipData,
} from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipData,
  type PostChipStatus,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import { Icon, type IconName } from "@/components/ui/icon";
import type { SearchBoxResult } from "@/components/ui/search-box";
import {
  buildCalendarRange,
  type CalendarView,
  countPosts,
  type EventsByDay,
  type PostsByDay,
  searchEvents,
  searchPosts,
  shiftAnchor,
} from "@/lib/calendar";
import { formatDayShort, formatWeekdayLong } from "@/lib/format";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { fade } from "@/styles/motion";
import { cn } from "cn";

interface CalendarPageProps {
  postsByDay: PostsByDay;
  eventsByDay?: EventsByDay;
  /** The mock's fixed clock, as a date key. Where "Today" goes back to. */
  today: string;
}

const POST_SEARCH_ICON = {
  draft: "pen",
  in_review: "eye",
  scheduled: "clock",
  published: "circle-check",
  failed: "triangle-exclamation",
} as const satisfies Record<PostChipStatus, IconName>;

const STATUS_KEY: readonly { status: PostChipStatus; label: string }[] = [
  { status: "scheduled", label: "Scheduled" },
  { status: "in_review", label: "In review" },
  { status: "published", label: "Published" },
  { status: "draft", label: "Draft" },
  { status: "failed", label: "Failed" },
];

/**
 * A month as a list: only days that have something, plus today. Used when
 * seven columns would be thinner than a chip.
 */
function MonthAgenda({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
}: {
  days: readonly CalendarDay[];
  selectedPostId?: string;
  onOpenPost: (post: PostChipData) => void;
  onOpenEvent: (event: EventChipData) => void;
}) {
  const shown = days.filter(
    (day) =>
      !day.isOutside &&
      (day.isToday === true ||
        day.posts.length > 0 ||
        (day.events?.length ?? 0) > 0),
  );

  if (shown.length === 0) {
    return (
      <p className="type-small text-imagine-foreground-muted">
        Nothing scheduled. Ask the agent to draft something.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-l overflow-y-auto">
      {shown.map((day) => {
        const events = day.events ?? [];
        return (
          <section key={day.date} className="flex flex-col gap-xs">
            <div className="flex items-center gap-s">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full type-small tabular-nums",
                  day.isToday
                    ? "bg-imagine-primary font-semibold text-imagine-primary-foreground"
                    : "text-imagine-foreground-muted",
                )}
              >
                {day.dayNumber}
              </span>
              <span className="type-small font-medium">
                {formatWeekdayLong(day.date)}
              </span>
            </div>
            <div className="flex flex-col gap-xs pl-8">
              {events.map((event) => (
                <EventChip key={event.id} event={event} onOpen={onOpenEvent} />
              ))}
              {day.posts.map((post) => (
                <PostChip
                  key={post.id}
                  post={post}
                  selected={post.id === selectedPostId}
                  onOpen={onOpenPost}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Color is status, so the page says which color is which. */
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-l gap-y-xs">
      {STATUS_KEY.map((item) => (
        <span
          key={item.status}
          style={postChipStyle(item.status)}
          className="flex items-center gap-xs type-small text-imagine-foreground-muted"
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-full bg-[var(--chip-color)]"
          />
          {item.label}
        </span>
      ))}
      <span aria-hidden="true" className="h-4 w-px bg-imagine-border" />
      <span className="flex items-center gap-xs type-small text-imagine-foreground-muted">
        <Icon name="calendar" size="s" />
        Event
      </span>
    </div>
  );
}

/**
 * What the range has to say for itself: how the search landed, or that there
 * is nothing here and who can fix that. Silent when the range simply has
 * posts in it, since the grid already shows them.
 */
function noteFor(query: string, shown: number, total: number): string | null {
  if (query !== "") {
    if (shown === 0) return `Nothing here matches "${query}"`;
    return `${String(shown)} of ${String(total)} match "${query}"`;
  }
  if (shown === 0)
    return "Nothing scheduled. Ask the agent to draft something.";
  return null;
}

/**
 * The calendar page: the range stepper, the three views, and search over the
 * range on screen. The grid carries the composer preview's layout id, so
 * expanding the preview morphs it into place, and selecting a post attaches it
 * to the chat in the column beside it.
 */
export function CalendarPage({
  postsByDay,
  eventsByDay = {},
  today,
}: CalendarPageProps) {
  const chat = useChat();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(today);
  const [search, setSearch] = useState("");
  const selected = chat.attached
    .flatMap((item) => (item.kind === "post" ? [item.post.id] : []))
    .at(-1);

  /** Selecting a post attaches it to the chat, so the next message is about it. */
  function attach(post: PostChipData) {
    chat.toggleAttached({ kind: "post", post });
  }

  /** An event fills the composer so the next message can be a post about it. */
  function draftFromEvent(event: EventChipData) {
    const where = event.location === undefined ? "" : ` at ${event.location}`;
    chat.setDraft(
      `Write a LinkedIn post about ${event.title}${where} (${event.whenLabel}).`,
    );
  }

  const range = buildCalendarRange(
    view,
    anchor,
    postsByDay,
    today,
    search,
    eventsByDay,
  );
  const query = search.trim();
  // The dropdown searches every post and event, not just the range on screen.
  const hits = searchPosts(postsByDay, query);
  const eventHits = searchEvents(eventsByDay, query);
  const searchResults: SearchBoxResult[] = [
    ...hits.map(({ date, post }) => ({
      id: post.id,
      icon: POST_SEARCH_ICON[post.status],
      title: post.title,
      detail: `${formatDayShort(date)} · ${post.time} · ${post.profile}`,
    })),
    ...eventHits.map(({ date, event }) => ({
      id: event.id,
      icon: "calendar" as const,
      title: event.title,
      detail: `${formatDayShort(date)} · ${event.time} · ${event.calendarName}`,
    })),
  ];
  /** Go to the hit's day and open it, as if its chip had been clicked. */
  function openHit(id: string) {
    const postHit = hits.find((entry) => entry.post.id === id);
    if (postHit !== undefined) {
      setSearch("");
      setAnchor(postHit.date);
      if (selected !== postHit.post.id) attach(postHit.post);
      return;
    }
    const eventHit = eventHits.find((entry) => entry.event.id === id);
    if (eventHit === undefined) return;
    setSearch("");
    setAnchor(eventHit.date);
    draftFromEvent(eventHit.event);
  }
  const shown = countPosts(range.days);
  const note = noteFor(
    query,
    shown,
    // What the range holds without the search, so a count has something to
    // measure against.
    query === ""
      ? shown
      : countPosts(
          buildCalendarRange(view, anchor, postsByDay, today, "", eventsByDay)
            .days,
        ),
  );

  return (
    <div className="@container/page flex min-h-0 flex-1 flex-col gap-xl">
      <CalendarToolbar
        rangeLabel={range.rangeLabel}
        view={view}
        onViewChange={setView}
        onPrevious={() => {
          setAnchor(shiftAnchor(view, anchor, -1));
        }}
        onNext={() => {
          setAnchor(shiftAnchor(view, anchor, 1));
        }}
        onToday={() => {
          setAnchor(today);
        }}
        search={search}
        onSearchChange={setSearch}
        searchResults={searchResults}
        onSearchSelect={openHit}
      />

      {isMobile && (view === "month" || view === "week") ? (
        <MonthAgenda
          days={range.days}
          onOpenPost={attach}
          onOpenEvent={draftFromEvent}
          {...(selected === undefined ? {} : { selectedPostId: selected })}
        />
      ) : view === "month" ? (
        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto">
          {/* The month takes the height between the toolbar and the legend
              and fits itself to it: every week visible, chips sized to the
              rows. Only a cell narrower than a word's worth scrolls sideways. */}
          <CalendarGrid
            days={range.days}
            fit
            // The page arrives by morphing out of the composer preview, which
            // opens on the month.
            layoutId={PREVIEW_LAYOUT_ID.calendar}
            onOpenPost={attach}
            onOpenEvent={draftFromEvent}
            {...(selected === undefined ? {} : { selectedPostId: selected })}
            className="h-full min-w-[36rem]"
          />
        </div>
      ) : (
        <div className="min-h-0 min-w-0 flex-1 overflow-x-auto">
          <CalendarTimeGrid
            days={range.days}
            onOpenPost={attach}
            onOpenEvent={draftFromEvent}
            {...(selected === undefined ? {} : { selectedPostId: selected })}
          />
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-s sm:flex-row sm:items-center sm:justify-between sm:gap-l">
        <Legend />
        <AnimatePresence initial={false} mode="popLayout">
          {note === null ? null : (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={fade.base}
              className="type-small text-imagine-foreground-muted"
            >
              {note}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
