"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import { NOTHING_SCHEDULED } from "@/components/features/calendar/calendar-copy";
import { CalendarDayNumber } from "@/components/features/calendar/calendar-day-number";
import { CalendarMonthFit } from "@/components/features/calendar/calendar-grid";
import {
  CalendarDayGrid,
  CalendarWeekGrid,
} from "@/components/features/calendar/calendar-time-grid";
import {
  CalendarRange,
  CalendarRangeLabel,
  CalendarRangeStepper,
  CalendarSearch,
  CalendarToolbar,
  CalendarViewToggle,
} from "@/components/features/calendar/calendar-toolbar";
import { EventChip } from "@/components/features/calendar/event-chip";
import {
  PostChip,
  type PostChipData,
  type PostOpenOptions,
} from "@/components/features/calendar/post-chip";
import { PostEditor } from "@/components/features/calendar/post-editor";
import {
  EditorTabStrip,
  type EditorTab,
} from "@/components/features/files/editor-tab-strip";
import type { IconName } from "@/components/ui/icon";
import type { SearchBoxResult } from "@/components/ui/search-box";
import type { CalendarDay, EventChipData } from "@/entities/calendar-event";
import type { PostChipStatus } from "@/entities/post";
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
import { useCalendarPosts } from "@/lib/use-calendar-posts";
import { MOBILE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import type { NewPostProfile } from "@/services/posts";
import { fade } from "@/styles/motion";

interface CalendarPageProps {
  postsByDay: PostsByDay;
  eventsByDay?: EventsByDay;
  /** The mock's fixed clock, as a date key. Where "Today" goes back to. */
  today: string;
  /** Who a post drafted from an empty slot goes out as. Without it, the
   * calendar has nothing to create posts as, and the plus stays hidden. */
  newPostProfile?: NewPostProfile;
}

const POST_SEARCH_ICON = {
  draft: "pen",
  in_review: "clock-rotate-left",
  scheduled: "clock",
  published: "circle-check",
  failed: "triangle-exclamation",
} as const satisfies Record<PostChipStatus, IconName>;

/** What every view of the range needs to draw it and answer a click. */
interface CalendarViewProps {
  days: readonly CalendarDay[];
  selectedPostId?: string;
  onOpenPost: (post: PostChipData, options?: PostOpenOptions) => void;
  onOpenEvent: (event: EventChipData) => void;
  /** Shows the plus an empty slot reveals on hover. */
  onCreatePost?: (date: string, time?: string) => void;
}

/**
 * A month as a list: only days that have something, plus today. Used when
 * seven columns would be thinner than a chip.
 */
function CalendarMobileAgenda({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
}: CalendarViewProps) {
  const shown = days.filter(
    (day) =>
      !day.isOutside &&
      (day.isToday === true ||
        day.posts.length > 0 ||
        (day.events?.length ?? 0) > 0),
  );

  if (shown.length === 0) {
    return (
      <div className="min-h-0 flex-1 px-l pb-l">
        <p className="type-small text-imagine-foreground-muted">
          {NOTHING_SCHEDULED}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 px-l pb-l">
      <div className="flex min-h-0 flex-1 flex-col gap-l overflow-y-auto">
        {shown.map((day) => {
          const events = day.events ?? [];
          return (
            <section key={day.date} className="flex flex-col gap-xs">
              <div className="flex items-center gap-s">
                <CalendarDayNumber day={day} />
                <span className="type-small font-medium">
                  {formatWeekdayLong(day.date)}
                </span>
              </div>
              <div className="flex flex-col gap-xs pl-8">
                {events.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    onOpen={onOpenEvent}
                  />
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
    </div>
  );
}

/**
 * The month, fitted to the height below the toolbar: every week visible,
 * chips sized to the rows. Only a cell narrower than a word's worth scrolls
 * sideways. The grid carries the composer preview's layout id, since the page
 * arrives by morphing out of the preview, which opens on the month.
 */
function CalendarMonthView({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
}: CalendarViewProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1">
      <CalendarMonthFit
        days={days}
        layoutId={PREVIEW_LAYOUT_ID.calendar}
        onOpenPost={onOpenPost}
        onOpenEvent={onOpenEvent}
        {...(onCreatePost === undefined ? {} : { onCreatePost })}
        {...(selectedPostId === undefined ? {} : { selectedPostId })}
        className="h-full p-0"
      />
    </div>
  );
}

/** The day range is the one day; it takes a column of its own. */
function CalendarDayView({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
}: CalendarViewProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1">
      {days.map((day) => (
        <CalendarDayGrid
          key={day.date}
          day={day}
          onOpenPost={onOpenPost}
          onOpenEvent={onOpenEvent}
          {...(onCreatePost === undefined ? {} : { onCreatePost })}
          {...(selectedPostId === undefined ? {} : { selectedPostId })}
          className="h-full p-0"
        />
      ))}
    </div>
  );
}

/** A Monday week, hour by hour. */
function CalendarWeekView({
  days,
  selectedPostId,
  onOpenPost,
  onOpenEvent,
  onCreatePost,
}: CalendarViewProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1">
      <CalendarWeekGrid
        days={days}
        onOpenPost={onOpenPost}
        onOpenEvent={onOpenEvent}
        {...(onCreatePost === undefined ? {} : { onCreatePost })}
        {...(selectedPostId === undefined ? {} : { selectedPostId })}
        className="h-full p-0"
      />
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
  if (shown === 0) return NOTHING_SCHEDULED;
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
  newPostProfile,
}: CalendarPageProps) {
  const router = useRouter();
  const chat = useChat();
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(today);
  const [search, setSearch] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [activeEditorId, setActiveEditorId] = useState("calendar");
  const [openPostIds, setOpenPostIds] = useState<readonly string[]>([]);
  const posts = useCalendarPosts(postsByDay);

  const selected = chat.attachedPosts.at(-1)?.id;

  /** A calendar post opens for editing and becomes context for the chat. */
  function openPost(post: PostChipData, options?: PostOpenOptions) {
    chat.attach({ kind: "post", post });
    setOpenPostIds((current) =>
      current.includes(post.id) ? current : [...current, post.id],
    );
    // Command-click opens the tab without leaving the calendar.
    if (options?.background === true) return;
    setEditingPostId(post.id);
    setActiveEditorId(post.id);
  }

  /** The plus on an empty slot: a blank draft, opened ready to write. */
  function createPost(date: string, time = "09:00") {
    if (newPostProfile === undefined) return;
    setAnchor(date);
    openPost(posts.draft(newPostProfile, date, time));
  }

  const range = buildCalendarRange(
    view,
    anchor,
    posts.byDay,
    today,
    search,
    eventsByDay,
  );
  const query = search.trim();
  // The dropdown searches every post and event, not just the range on screen.
  const hits = searchPosts(posts.byDay, query);
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
      openPost(postHit.post);
      return;
    }
    const eventHit = eventHits.find((entry) => entry.event.id === id);
    if (eventHit === undefined) return;
    setSearch("");
    setAnchor(eventHit.date);
    chat.draftFromEvent(eventHit.event);
  }
  // `range.total` is what the range holds without the search, so a count has
  // something to measure against.
  const note = noteFor(query, countPosts(range.days), range.total);
  const editorValue =
    editingPostId === null ? undefined : posts.editorValueFor(editingPostId);
  const openEditorValues = openPostIds.flatMap((id) => {
    const value = posts.editorValueFor(id);
    return value === undefined ? [] : [value];
  });

  const viewProps: CalendarViewProps = {
    days: range.days,
    onOpenPost: openPost,
    onOpenEvent: chat.draftFromEvent,
    ...(newPostProfile === undefined ? {} : { onCreatePost: createPost }),
    ...(selected === undefined ? {} : { selectedPostId: selected }),
  };
  // Which calendar is on screen follows the view and the width it has, not a
  // choice a caller makes.
  const calendarView =
    isMobile && (view === "month" || view === "week") ? (
      <CalendarMobileAgenda {...viewProps} />
    ) : view === "month" ? (
      <CalendarMonthView {...viewProps} />
    ) : view === "day" ? (
      <CalendarDayView {...viewProps} />
    ) : (
      <CalendarWeekView {...viewProps} />
    );

  const calendarContent = (
    <div className="@container/page flex min-h-0 flex-1 flex-col gap-s pt-l">
      <div className="flex shrink-0 flex-col gap-s px-l md:px-xl">
        <CalendarToolbar>
          <CalendarRange>
            <CalendarRangeStepper
              onPrevious={() => {
                setAnchor(shiftAnchor(view, anchor, -1));
              }}
              onNext={() => {
                setAnchor(shiftAnchor(view, anchor, 1));
              }}
              onToday={() => {
                setAnchor(today);
              }}
            />
            <CalendarRangeLabel>{range.rangeLabel}</CalendarRangeLabel>
          </CalendarRange>
          <CalendarViewToggle value={view} onValueChange={setView} />
          <CalendarSearch
            value={search}
            onValueChange={setSearch}
            results={searchResults}
            onSelect={openHit}
          />
        </CalendarToolbar>
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

      {calendarView}
    </div>
  );

  const editor =
    editorValue === undefined ? null : (
      <PostEditor
        key={editorValue.post.id}
        value={editorValue}
        onClose={() => {
          setEditingPostId(null);
          setActiveEditorId("calendar");
        }}
        onChange={posts.save}
        onOpenAgent={(value) => {
          posts.save(value);
          chat.startPostChat(value.post);
          router.push("/agent");
        }}
        onDelete={(postId) => {
          posts.remove(postId);
          setOpenPostIds((current) =>
            current.filter((openId) => openId !== postId),
          );
          chat.clearAttached(postId);
          setEditingPostId(null);
          setActiveEditorId("calendar");
        }}
      />
    );

  // Keep one stable content frame so opening a post does not remount the
  // entire calendar before the editor enters. The chrome reveals only when
  // there is a post tab.
  const tabs: readonly EditorTab[] = openEditorValues.map(({ post }) => ({
    id: post.id,
    label: post.title,
    icon:
      post.status === "published" ? ("linkedin-in" as const) : ("pen" as const),
  }));
  const activeId =
    activeEditorId !== "calendar" &&
    openEditorValues.some(({ post }) => post.id === activeEditorId)
      ? activeEditorId
      : "calendar";

  return (
    <>
      {/* The tab strip names the page on screen; this is for a screen reader
          moving by heading. */}
      <h1 className="sr-only">Calendar</h1>
      <EditorTabStrip
        home={{ id: "calendar", label: "Calendar", icon: "calendar" }}
        tabs={tabs}
        activeId={activeId}
        onActivate={(id) => {
          setActiveEditorId(id);
          setEditingPostId(id === "calendar" ? null : id);
        }}
        onClose={(id) => {
          const index = openPostIds.indexOf(id);
          const remaining = openPostIds.filter((postId) => postId !== id);
          setOpenPostIds(remaining);
          if (activeEditorId !== id) return;
          const nextId =
            remaining[Math.max(0, index - 1)] ?? remaining[0] ?? "calendar";
          setActiveEditorId(nextId);
          setEditingPostId(nextId === "calendar" ? null : nextId);
        }}
        className="min-h-0 flex-1"
      >
        {activeId === "calendar" ? calendarContent : editor}
      </EditorTabStrip>
    </>
  );
}
