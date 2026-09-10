"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState } from "react";

import {
  LANDING_COLUMN,
  LandingBelow,
  LandingIntro,
  LandingRail,
  type LandingStat,
} from "@/components/features/agent/agent-landing";
import {
  ActivityCards,
  CenteredIntro,
  MonthCalendar,
} from "@/components/features/agent/agent-landing-2";
import { AgentThread } from "@/components/features/agent/agent-thread";
import { ChatDock } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import type { TimelineEntry } from "@/components/features/agent/timeline";
import type {
  ChartDatum,
  ChartSeries,
} from "@/components/features/analytics/chart-block";
import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { EventChipData } from "@/components/features/calendar/event-chip";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { UpNextItem } from "@/components/features/calendar/up-next-list";
import { PageAside } from "@/components/layout/page-aside";
import type { AgentMessage } from "@/services/agent";
import { COMPACT_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { blurOut, fade } from "@/styles/motion";

export interface LandingData {
  greeting: string;
  dateLabel: string;
  timeline: readonly TimelineEntry[];
  days: readonly CalendarDay[];
  stats: readonly LandingStat[];
  chart: { data: readonly ChartDatum[]; series: readonly ChartSeries[] };
  upNext: readonly UpNextItem[];
  /** The whole month. Only the centered layout shows it; it falls back to `days`. */
  month?: { label: string; days: readonly CalendarDay[] };
}

/**
 * `split` is `/agent`: greeting and timeline on the left, stats on the right.
 * `centered` is `/landing-2`: one column with the agent's mark, the composer,
 * three activity cards, and the month.
 */
export type LandingLayout = "split" | "centered";

interface AgentWorkspaceProps {
  /** Present on `/agent`, where the composer starts as the hero. */
  landing?: LandingData;
  landingLayout?: LandingLayout;
  /** Present on `/agent/[threadId]`, where a stored thread is already open. */
  thread?: { id: string; messages: readonly AgentMessage[] };
}

/**
 * `/agent`, in both of its modes. The landing and the thread are one component
 * so the composer is one element: on send it stays mounted and slides from the
 * hero position down into the dock while everything around it gives way.
 *
 * The conversation itself lives in `ChatProvider`, above the page, so leaving
 * for the calendar or analytics keeps it and coming back finds it here.
 */
export function AgentWorkspace({
  landing,
  landingLayout = "split",
  thread,
}: AgentWorkspaceProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const chat = useChat();
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const [handled, setHandled] = useState<readonly string[]>([]);

  // A stored thread becomes the open conversation. Until the provider has it,
  // render what the page brought, so the switch has no blank frame. Keyed on
  // the id alone: `open` changes with the open thread, and following it would
  // reopen this one the moment "New chat" closed it.
  const storedThreadId = thread?.id;
  const openStored = useEffectEvent(() => {
    if (thread !== undefined) chat.open(thread.id, thread.messages);
  });
  useEffect(() => {
    if (storedThreadId !== undefined) openStored();
  }, [storedThreadId]);
  const synced = thread === undefined || chat.threadId === thread.id;
  const messages = synced ? chat.messages : thread.messages;

  // "New chat" opens a conversation before anything is said; until the first
  // message it is still the landing.
  const onLanding =
    landing !== undefined &&
    (chat.threadId === null || chat.messages.length === 0);

  // No navigation on the first send: the composer has to survive the morph.
  // The URL catches up instead, so the rail reads as a thread and a reload of
  // the live one lands back on the page. Coming back to `/agent` with a
  // conversation open shows it, and the same effect settles the URL then.
  // An empty new chat keeps the landing's own URL.
  const settledThreadId =
    chat.threadId !== null && chat.messages.length > 0 ? chat.threadId : null;
  useEffect(() => {
    if (landing === undefined || settledThreadId === null) return;
    window.history.replaceState(null, "", `/agent/${settledThreadId}`);
  }, [landing, settledThreadId]);

  const centered = landingLayout === "centered";
  const selectedPostId = chat.attached
    .flatMap((item) => (item.kind === "post" ? [item.post.id] : []))
    .at(-1);
  const pending = (landing?.timeline ?? []).filter(
    (entry) => !handled.includes(entry.id),
  );

  /** Picking a post off the landing calendar makes the next message about it. */
  function attachPost(post: PostChipData) {
    chat.toggleAttached({ kind: "post", post });
  }

  function draftFromEvent(event: EventChipData) {
    const where = event.location === undefined ? "" : ` at ${event.location}`;
    chat.setDraft(
      `Write a LinkedIn post about ${event.title}${where} (${event.whenLabel}).`,
    );
  }

  /**
   * One element in both modes, so the send is a single spring from the hero
   * position down to the dock. The dock floats over the thread rather than
   * sitting on a bar, which is what keeps the move to one animation.
   */
  const composer = (
    <ChatDock
      variant={onLanding ? "hero" : "dock"}
      animateLayout={!reduceMotion}
      // Split: the landing's column, so it lines up with the calendar under
      // it. Centered: narrower than the cards and the month, so it reads as
      // the prompt and not another block. Thread: the message column.
      className={
        onLanding
          ? centered
            ? "mx-auto w-full max-w-2xl min-w-0"
            : LANDING_COLUMN
          : "sticky bottom-l z-10 mx-auto mt-xl w-full max-w-3xl min-w-0"
      }
    />
  );

  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="flex min-h-full min-w-0 flex-1 flex-col">
        {/* `popLayout` takes the leaving landing out of flow at once, so the
            composer has a single, settled position to spring to. Its children
            have to be motion elements for that, which is why the wrappers are
            here rather than inside the landing pieces. */}
        <AnimatePresence initial={false} mode="popLayout">
          {onLanding ? (
            <motion.div key="intro" exit={blurOut} transition={fade.base}>
              {centered ? (
                <CenteredIntro
                  greeting={landing.greeting}
                  dateLabel={landing.dateLabel}
                />
              ) : (
                <LandingIntro
                  greeting={landing.greeting}
                  dateLabel={landing.dateLabel}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {onLanding ? null : (
          <AgentThread
            messages={messages}
            thinking={chat.thinking}
            {...(chat.thinkingStatuses === undefined
              ? {}
              : { thinkingStatuses: chat.thinkingStatuses })}
            onIntent={chat.sendIntent}
          />
        )}

        {composer}

        <AnimatePresence initial={false} mode="popLayout">
          {onLanding ? (
            <motion.div
              key="below"
              exit={blurOut}
              transition={fade.base}
              className="flex min-w-0 shrink-0 flex-col xl:min-h-0 xl:flex-1"
            >
              {centered ? (
                <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-1 flex-col gap-xxxl pt-xxxl pb-l">
                  <ActivityCards
                    entries={pending}
                    onAction={(entry, action) => {
                      setHandled((current) => [...current, entry.id]);
                      chat.send(action.prompt ?? entry.title, action.intent);
                    }}
                  />
                  <MonthCalendar
                    label={landing.month?.label ?? "Next two weeks"}
                    days={landing.month?.days ?? landing.days}
                    onOpenPost={attachPost}
                    onOpenEvent={draftFromEvent}
                    onOpenCalendar={() => {
                      router.push("/calendar");
                    }}
                    {...(selectedPostId === undefined
                      ? {}
                      : { selectedPostId })}
                  />
                </div>
              ) : (
                <LandingBelow
                  entries={pending}
                  days={landing.days}
                  onAction={(entry, action) => {
                    setHandled((current) => [...current, entry.id]);
                    chat.send(action.prompt ?? entry.title, action.intent);
                  }}
                  onOpenPost={attachPost}
                  onOpenEvent={draftFromEvent}
                  {...(selectedPostId === undefined ? {} : { selectedPostId })}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {onLanding && !centered && landing !== undefined ? (
          <div className="w-full min-w-0 shrink-0 xl:hidden">
            <LandingRail
              stacked
              stats={landing.stats}
              chart={landing.chart}
              upNext={landing.upNext}
              onOpenCalendar={() => {
                router.push("/calendar");
              }}
            />
          </div>
        ) : null}
      </div>

      {/* The rail is a sidebar in the shell's row, beside the page rather
          than inside its scroll, so it runs the full height under the header
          and resizes like the other panels. */}
      <PageAside>
        <AnimatePresence initial={false}>
          {onLanding && !centered && !isCompact && landing !== undefined ? (
            <LandingRail
              key="rail"
              stats={landing.stats}
              chart={landing.chart}
              upNext={landing.upNext}
              onOpenCalendar={() => {
                router.push("/calendar");
              }}
            />
          ) : null}
        </AnimatePresence>
      </PageAside>
    </div>
  );
}
