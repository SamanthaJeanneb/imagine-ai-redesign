"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
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
  type PostOpenOptions,
  type PostChipStatus,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import {
  PostEditor,
  type PostEditorValue,
} from "@/components/features/calendar/post-editor";
import {
  EditorTabStrip,
  type EditorTab,
} from "@/components/features/files/editor-tab-strip";
import type { AssetTileData } from "@/components/features/files/asset-tile";
import type { IconName } from "@/components/ui/icon";
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
import type { NewPostProfile } from "@/services/posts";
import { fade } from "@/styles/motion";
import { cn } from "cn";

interface CalendarPageProps {
  postsByDay: PostsByDay;
  eventsByDay?: EventsByDay;
  /** The mock's fixed clock, as a date key. Where "Today" goes back to. */
  today: string;
  /** Assets the editor can attach to a post. */
  mediaLibrary?: readonly AssetTileData[];
  /** The labels a post can be filed under. */
  labelOptions?: readonly string[];
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
  onOpenPost: (post: PostChipData, options?: PostOpenOptions) => void;
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
        <span
          aria-hidden="true"
          className="size-2 rounded-full bg-imagine-tag-5"
        />
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
  mediaLibrary,
  labelOptions,
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
  const [edits, setEdits] = useState<Record<string, PostEditorValue>>({});
  const [deletedPostIds, setDeletedPostIds] = useState<readonly string[]>([]);
  const [drafted, setDrafted] = useState<
    readonly { post: PostChipData; date: string }[]
  >([]);

  // This mock editor keeps changes for the life of the calendar page,
  // including moving a post to another day.
  const visiblePostsByDay: Record<string, readonly PostChipData[]> = {};
  const dated: readonly { post: PostChipData; date: string }[] = [
    ...Object.entries(postsByDay).flatMap(([date, posts]) =>
      posts.map((post) => ({ post, date })),
    ),
    ...drafted,
  ];
  for (const original of dated) {
    if (deletedPostIds.includes(original.post.id)) continue;
    const edit = edits[original.post.id];
    const post = edit?.post ?? original.post;
    const date = edit?.date ?? original.date;
    visiblePostsByDay[date] = [...(visiblePostsByDay[date] ?? []), post];
  }

  const selected = chat.attached
    .flatMap((item) => (item.kind === "post" ? [item.post.id] : []))
    .at(-1);

  function dateFor(postId: string): string | undefined {
    return Object.entries(visiblePostsByDay).find(([, posts]) =>
      posts.some((post) => post.id === postId),
    )?.[0];
  }

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
    const post: PostChipData = {
      id: `new_${String(Date.now())}`,
      title: "Untitled post",
      time,
      profile: newPostProfile.profile,
      status: "draft",
      preview: { author: newPostProfile.author, body: "" },
    };
    setDrafted((current) => [...current, { post, date }]);
    setAnchor(date);
    openPost(post);
  }

  function savePost(value: PostEditorValue) {
    setEdits((current) => ({ ...current, [value.post.id]: value }));
    // Replace a stale attached copy with the edited one.
    chat.clearAttached(value.post.id);
    chat.attach({ kind: "post", post: value.post });
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
    visiblePostsByDay,
    today,
    search,
    eventsByDay,
  );
  const query = search.trim();
  // The dropdown searches every post and event, not just the range on screen.
  const hits = searchPosts(visiblePostsByDay, query);
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
          buildCalendarRange(
            view,
            anchor,
            visiblePostsByDay,
            today,
            "",
            eventsByDay,
          ).days,
        ),
  );
  const visiblePosts = Object.values(visiblePostsByDay).flat();
  function editorValueFor(postId: string | null): PostEditorValue | undefined {
    if (postId === null) return undefined;
    const post = visiblePosts.find((candidate) => candidate.id === postId);
    const date = dateFor(postId);
    if (post === undefined || date === undefined) return undefined;
    return (
      edits[post.id] ?? {
        post,
        date,
        internalNotes: "",
      }
    );
  }
  const editorValue = editorValueFor(editingPostId);
  const openEditorValues = openPostIds.flatMap((id) => {
    const value = editorValueFor(id);
    return value === undefined ? [] : [value];
  });

  const calendarContent = (
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
          onOpenPost={openPost}
          onOpenEvent={draftFromEvent}
          {...(selected === undefined ? {} : { selectedPostId: selected })}
        />
      ) : view === "month" ? (
        <div className="min-h-0 min-w-0 flex-1">
          {/* The month takes the height between the toolbar and the legend
              and fits itself to it: every week visible, chips sized to the
              rows. Only a cell narrower than a word's worth scrolls sideways. */}
          <CalendarGrid
            days={range.days}
            fit
            // The page arrives by morphing out of the composer preview, which
            // opens on the month.
            layoutId={PREVIEW_LAYOUT_ID.calendar}
            onOpenPost={openPost}
            onOpenEvent={draftFromEvent}
            {...(newPostProfile === undefined
              ? {}
              : { onCreatePost: createPost })}
            {...(selected === undefined ? {} : { selectedPostId: selected })}
            className="h-full"
          />
        </div>
      ) : (
        <div className="min-h-0 min-w-0 flex-1">
          <CalendarTimeGrid
            days={range.days}
            onOpenPost={openPost}
            onOpenEvent={draftFromEvent}
            {...(newPostProfile === undefined
              ? {}
              : { onCreatePost: createPost })}
            {...(selected === undefined ? {} : { selectedPostId: selected })}
            className="h-full"
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

  const editor =
    editorValue === undefined ? null : (
      <PostEditor
        key={editorValue.post.id}
        value={editorValue}
        {...(mediaLibrary === undefined ? {} : { mediaLibrary })}
        {...(labelOptions === undefined ? {} : { labelOptions })}
        onClose={() => {
          setEditingPostId(null);
          setActiveEditorId("calendar");
        }}
        onSave={savePost}
        onOpenAgent={(value) => {
          setEdits((current) => ({
            ...current,
            [value.post.id]: value,
          }));
          chat.startPostChat(value.post);
          router.push("/agent");
        }}
        onDelete={(postId) => {
          setDeletedPostIds((current) => [...current, postId]);
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
  const tabs: readonly EditorTab[] =
    openEditorValues.length === 0
      ? []
      : [
          { id: "calendar", label: "Calendar", icon: "calendar" },
          ...openEditorValues.map(({ post }) => ({
            id: post.id,
            label: post.title,
            icon:
              post.status === "published"
                ? ("linkedin-in" as const)
                : ("pen" as const),
            closable: true,
          })),
        ];
  const activeId =
    activeEditorId !== "calendar" &&
    openEditorValues.some(({ post }) => post.id === activeEditorId)
      ? activeEditorId
      : "calendar";

  return (
    <EditorTabStrip
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
      inset={false}
      className="min-h-0 flex-1"
    >
      {activeId === "calendar" ? calendarContent : editor}
    </EditorTabStrip>
  );
}
