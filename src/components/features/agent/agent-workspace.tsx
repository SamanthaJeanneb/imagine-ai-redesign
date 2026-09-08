"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
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
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { UpNextItem } from "@/components/features/calendar/up-next-list";
import type { AgentMessage } from "@/services/agent";
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
  const { open } = chat;
  const [handled, setHandled] = useState<readonly string[]>([]);

  // A stored thread becomes the open conversation. Until the provider has it,
  // render what the page brought, so the switch has no blank frame.
  useEffect(() => {
    if (thread !== undefined) open(thread.id, thread.messages);
  }, [thread, open]);
  const synced = thread === undefined || chat.threadId === thread.id;
  const messages = synced ? chat.messages : thread.messages;

  const onLanding = landing !== undefined && chat.threadId === null;

  // No navigation on the first send: the composer has to survive the morph.
  // The URL catches up instead, so the rail reads as a thread and a reload of
  // the live one lands back on the page. Coming back to `/agent` with a
  // conversation open shows it, and the same effect settles the URL then.
  useEffect(() => {
    if (landing === undefined || chat.threadId === null) return;
    window.history.replaceState(null, "", `/agent/${chat.threadId}`);
  }, [landing, chat.threadId]);

  const centered = landingLayout === "centered";
  const pending = (landing?.timeline ?? []).filter(
    (entry) => !handled.includes(entry.id),
  );

  /** Picking a post off the landing calendar makes the next message about it. */
  function attachPost(post: PostChipData) {
    chat.toggleAttached({ kind: "post", post });
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
      // Split: spans the column, so it lines up with the calendar under it.
      // Centered: narrower than the cards and the month, so it reads as the
      // prompt and not another block. Thread: the message column.
      className={
        onLanding
          ? centered
            ? "mx-auto max-w-2xl"
            : undefined
          : "sticky bottom-l z-10 mx-auto mt-l max-w-3xl"
      }
    />
  );

  return (
    <div className="flex min-h-full flex-1 px-xxl">
      <div
        className={cn(
          "flex min-h-full min-w-0 flex-1 flex-col pb-xl",
          // The gap to the rail. Centered has no rail.
          !centered && "pr-xxl",
        )}
      >
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
              className="flex min-h-0 flex-1 flex-col"
            >
              {centered ? (
                <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-xxxl pt-xxxl pb-l">
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
                    onOpenCalendar={() => {
                      router.push("/calendar");
                    }}
                    {...(chat.attachedId === null
                      ? {}
                      : { selectedPostId: chat.attachedId })}
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
                  {...(chat.attachedId === null
                    ? {}
                    : { selectedPostId: chat.attachedId })}
                />
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {onLanding && !centered ? (
          <motion.aside
            key="rail"
            exit={{ opacity: 0, x: 24 }}
            transition={fade.base}
            className="self-stretch border-l border-imagine-foreground/12 pl-xxl"
          >
            <LandingRail
              stats={landing.stats}
              chart={landing.chart}
              upNext={landing.upNext}
              onOpenCalendar={() => {
                router.push("/calendar");
              }}
            />
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
