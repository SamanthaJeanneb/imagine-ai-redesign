"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import { CalendarGrid } from "@/components/features/calendar/calendar-grid";
import { CalendarTimeGrid } from "@/components/features/calendar/calendar-time-grid";
import { CalendarToolbar } from "@/components/features/calendar/calendar-toolbar";
import {
  type PostChipData,
  type PostChipStatus,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import {
  buildCalendarRange,
  type CalendarView,
  countPosts,
  type PostsByDay,
  shiftAnchor,
} from "@/lib/calendar";
import { fade } from "@/styles/motion";

interface CalendarPageProps {
  postsByDay: PostsByDay;
  /** The mock's fixed clock, as a date key. Where "Today" goes back to. */
  today: string;
}

const LEGEND: readonly { status: PostChipStatus; label: string }[] = [
  { status: "draft", label: "Draft" },
  { status: "scheduled", label: "Scheduled" },
  { status: "published", label: "Published" },
  { status: "failed", label: "Failed" },
];

/** Color is the only status signal on a chip, so the page says what it means. */
function StatusLegend() {
  return (
    <div className="flex flex-wrap items-center gap-l">
      {LEGEND.map((item) => (
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
export function CalendarPage({ postsByDay, today }: CalendarPageProps) {
  const chat = useChat();
  const [view, setView] = useState<CalendarView>("month");
  const [anchor, setAnchor] = useState(today);
  const [search, setSearch] = useState("");
  const selected = chat.attachedId;

  /** Selecting a post attaches it to the chat, so the next message is about it. */
  function attach(post: PostChipData) {
    chat.toggleAttached({ kind: "post", post });
  }

  const range = buildCalendarRange(view, anchor, postsByDay, today, search);
  const query = search.trim();
  const shown = countPosts(range.days);
  const note = noteFor(
    query,
    shown,
    // What the range holds without the search, so a count has something to
    // measure against.
    query === ""
      ? shown
      : countPosts(buildCalendarRange(view, anchor, postsByDay, today).days),
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-xl">
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
      />

      {view === "month" ? (
        <CalendarGrid
          days={range.days}
          fill
          // The page arrives by morphing out of the composer preview, which
          // opens on the month.
          layoutId={PREVIEW_LAYOUT_ID.calendar}
          onOpenPost={attach}
          {...(selected === null ? {} : { selectedPostId: selected })}
          className="flex-1"
        />
      ) : (
        <CalendarTimeGrid
          days={range.days}
          onOpenPost={attach}
          {...(selected === null ? {} : { selectedPostId: selected })}
        />
      )}

      <div className="flex shrink-0 items-center justify-between gap-l">
        <StatusLegend />
        <AnimatePresence initial={false} mode="popLayout">
          {note === null ? null : (
            <motion.p
              key={note}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={fade.fast}
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
