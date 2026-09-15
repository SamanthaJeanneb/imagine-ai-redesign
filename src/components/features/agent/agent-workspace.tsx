"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useEffectEvent, useState, type ReactNode } from "react";

import {
  LANDING_COLUMN,
  LandingBelow,
  LandingIntro,
  LandingRail,
  LandingRailStacked,
  type LandingStat,
} from "@/components/features/agent/agent-landing";
import {
  ActivityCards,
  CenteredIntro,
  MonthCalendar,
} from "@/components/features/agent/agent-landing-2";
import {
  AgentThinking,
  AgentThread,
} from "@/components/features/agent/agent-thread";
import {
  HeroChatDock,
  ThreadChatDock,
} from "@/components/features/agent/chat-dock";
import { ChatEmptyMark } from "@/components/features/agent/chat-empty-mark";
import {
  useChat,
  type ChatActions,
  type ChatState,
} from "@/components/features/agent/chat-provider";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import { PageAside } from "@/components/layout/page-aside";
import type { TimelineAction, TimelineEntry } from "@/entities/agent";
import type { ChartDatum, ChartSeries } from "@/entities/analytics";
import type { CalendarDay, UpNextItem } from "@/entities/calendar-event";
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

/* -------------------------------------------------------------------------- */
/* Shared parts                                                                */
/* -------------------------------------------------------------------------- */

/** The page's row: the column, and beside it the host for a page sidebar. */
function AgentWorkspaceFrame({
  children,
  aside,
}: {
  children: ReactNode;
  /** The rail is a sidebar in the shell's row, beside the page rather than
      inside its scroll, so it runs the full height under the header and
      resizes like the other panels. */
  aside?: ReactNode;
}) {
  return (
    <div className="flex min-h-full min-w-0 flex-1">
      <div className="flex min-h-full min-w-0 flex-1 flex-col">{children}</div>
      <PageAside>{aside}</PageAside>
    </div>
  );
}

/** The conversation, or the agent's mark while it is still empty. */
function ThreadBody({
  messages,
  chat,
}: {
  messages: readonly AgentMessage[];
  chat: ChatState & ChatActions;
}) {
  if (messages.length === 0) return <ChatEmptyMark />;
  return (
    <AgentThread messages={messages} onIntent={chat.sendIntent}>
      <AgentThinking />
    </AgentThread>
  );
}

/** The composer at the foot of a thread, in the message column. */
function ThreadComposer() {
  return (
    <ThreadChatDock className="sticky bottom-l z-10 mx-auto mt-xl w-full max-w-3xl min-w-0" />
  );
}

/**
 * A landing piece that leaves when the conversation starts. `popLayout` takes
 * it out of flow at once, so the composer has a single, settled position to
 * spring to; that needs a motion element as the presence child, which is why
 * the wrapper is here rather than inside the landing pieces.
 */
function LandingPiece({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div exit={blurOut} transition={fade.base} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * What both landings share: whether the landing is still showing, which
 * activity cards are still pending, and how the calendar under the composer
 * feeds the next message.
 */
function useLanding(landing: LandingData) {
  const chat = useChat();
  const [handled, setHandled] = useState<readonly string[]>([]);

  // "New chat" opens a conversation before anything is said; until the first
  // message it is still the landing, even if a file or other context is
  // already attached. Opening a post from the editor is the exception: that
  // starts a thread with the post in it, so the landing gives way.
  const onLanding = chat.threadId === null || chat.messages.length === 0;

  const selectedPostId = chat.attachedPosts.at(-1)?.id;
  const pending = landing.timeline.filter(
    (entry) => !handled.includes(entry.id),
  );

  /** Picking a post off the landing calendar makes the next message about it. */
  function attachPost(post: PostChipData) {
    chat.toggleAttached({ kind: "post", post });
  }

  function handleActivity(entry: TimelineEntry, action: TimelineAction) {
    setHandled((current) => [...current, entry.id]);
    chat.send(action.prompt ?? entry.title, action.intent);
  }

  return {
    chat,
    onLanding,
    pending,
    selectedPostId,
    attachPost,
    handleActivity,
  };
}

/* -------------------------------------------------------------------------- */
/* Pages                                                                       */
/* -------------------------------------------------------------------------- */

interface AgentThreadWorkspaceProps {
  /** The stored thread `/agent/[threadId]` opened. */
  thread: { id: string; messages: readonly AgentMessage[] };
}

/**
 * `/agent/[threadId]`: a stored conversation. The conversation itself lives
 * in `ChatProvider`, above the page, so leaving for the calendar or analytics
 * keeps it and coming back finds it here.
 */
export function AgentThreadWorkspace({ thread }: AgentThreadWorkspaceProps) {
  const chat = useChat();

  // The stored thread becomes the open conversation. Until the provider has
  // it, render what the page brought, so the switch has no blank frame. Keyed
  // on the id alone: `open` changes with the open thread, and following it
  // would reopen this one the moment "New chat" closed it.
  const openStored = useEffectEvent(() => {
    chat.open(thread.id, thread.messages);
  });
  useEffect(() => {
    openStored();
  }, [thread.id]);
  const messages =
    chat.threadId === thread.id ? chat.messages : thread.messages;

  return (
    <AgentWorkspaceFrame>
      <ThreadBody messages={messages} chat={chat} />
      <ThreadComposer />
    </AgentWorkspaceFrame>
  );
}

interface LandingWorkspaceProps {
  landing: LandingData;
}

/**
 * `/agent`: greeting and timeline on the left, the overview rail on the
 * right. The landing and the thread it becomes are one component so the
 * composer's box is one `layoutId`: on send the hero's frame springs down
 * into the dock while everything around it gives way.
 */
export function SplitLandingWorkspace({ landing }: LandingWorkspaceProps) {
  const router = useRouter();
  const isCompact = useMediaQuery(COMPACT_QUERY);
  const {
    chat,
    onLanding,
    pending,
    selectedPostId,
    attachPost,
    handleActivity,
  } = useLanding(landing);

  const openCalendar = () => {
    router.push("/calendar");
  };
  const overview = {
    stats: landing.stats,
    chart: landing.chart,
    upNext: landing.upNext,
    onOpenCalendar: openCalendar,
  };

  return (
    <AgentWorkspaceFrame
      aside={
        <AnimatePresence initial={false}>
          {onLanding && !isCompact ? (
            <LandingRail key="rail" {...overview} />
          ) : null}
        </AnimatePresence>
      }
    >
      <AnimatePresence initial={false} mode="popLayout">
        {onLanding ? (
          <LandingPiece key="intro">
            <LandingIntro
              greeting={landing.greeting}
              dateLabel={landing.dateLabel}
            />
          </LandingPiece>
        ) : null}
      </AnimatePresence>

      {onLanding ? null : <ThreadBody messages={chat.messages} chat={chat} />}

      {onLanding ? (
        // The landing's column, so it lines up with the calendar under it.
        <HeroChatDock className={LANDING_COLUMN} />
      ) : (
        <ThreadComposer />
      )}

      <AnimatePresence initial={false} mode="popLayout">
        {onLanding ? (
          // Natural height: the calendar takes the room it needs and the
          // page scrolls, rather than the strip squeezing into what a laptop
          // leaves under the composer.
          <LandingPiece key="below" className="flex min-w-0 shrink-0 flex-col">
            <LandingBelow
              entries={pending}
              days={landing.days}
              onAction={handleActivity}
              onOpenPost={attachPost}
              onOpenEvent={chat.draftFromEvent}
              {...(selectedPostId === undefined ? {} : { selectedPostId })}
            />
          </LandingPiece>
        ) : null}
      </AnimatePresence>
      {onLanding ? (
        <div className="w-full min-w-0 shrink-0 xl:hidden">
          <LandingRailStacked {...overview} />
        </div>
      ) : null}
    </AgentWorkspaceFrame>
  );
}

/**
 * `/new-chat`: one column with the agent's mark, the composer, three
 * activity cards, and the month. Becomes the thread the same way.
 */
export function CenteredLandingWorkspace({ landing }: LandingWorkspaceProps) {
  const router = useRouter();
  const {
    chat,
    onLanding,
    pending,
    selectedPostId,
    attachPost,
    handleActivity,
  } = useLanding(landing);

  return (
    <AgentWorkspaceFrame>
      <AnimatePresence initial={false} mode="popLayout">
        {onLanding ? (
          <LandingPiece key="intro">
            <CenteredIntro
              greeting={landing.greeting}
              dateLabel={landing.dateLabel}
            />
          </LandingPiece>
        ) : null}
      </AnimatePresence>

      {onLanding ? null : <ThreadBody messages={chat.messages} chat={chat} />}

      {onLanding ? (
        // Narrower than the cards and the month, so it reads as the prompt
        // and not another block.
        <HeroChatDock className="mx-auto w-full max-w-2xl min-w-0" />
      ) : (
        <ThreadComposer />
      )}

      <AnimatePresence initial={false} mode="popLayout">
        {onLanding ? (
          <LandingPiece key="below" className="flex min-w-0 shrink-0 flex-col">
            <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col gap-xxl pt-xxl pb-l md:gap-xxxl md:pt-xxxl">
              <ActivityCards entries={pending} onAction={handleActivity} />
              <MonthCalendar
                label={landing.month?.label ?? "Next two weeks"}
                days={landing.month?.days ?? landing.days}
                onOpenPost={attachPost}
                onOpenEvent={chat.draftFromEvent}
                onOpenCalendar={() => {
                  router.push("/calendar");
                }}
                {...(selectedPostId === undefined ? {} : { selectedPostId })}
              />
            </div>
          </LandingPiece>
        ) : null}
      </AnimatePresence>
    </AgentWorkspaceFrame>
  );
}
