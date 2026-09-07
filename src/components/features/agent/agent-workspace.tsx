"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  LandingBelow,
  LandingIntro,
  LandingRail,
  type LandingStat,
} from "@/components/features/agent/agent-landing";
import { AgentThread } from "@/components/features/agent/agent-thread";
import { Composer } from "@/components/features/agent/composer";
import { PostContext } from "@/components/features/agent/post-context";
import type { TimelineEntry } from "@/components/features/agent/timeline";
import type {
  ChartDatum,
  ChartSeries,
} from "@/components/features/analytics/chart-block";
import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { UpNextItem } from "@/components/features/calendar/up-next-list";
import type { AgentMessage, ScriptedReply } from "@/services/agent";
import { blurOut, fade } from "@/styles/motion";

export interface LandingData {
  greeting: string;
  dateLabel: string;
  timeline: readonly TimelineEntry[];
  days: readonly CalendarDay[];
  stats: readonly LandingStat[];
  chart: { data: readonly ChartDatum[]; series: readonly ChartSeries[] };
  upNext: readonly UpNextItem[];
}

interface AgentWorkspaceProps {
  /**
   * Played back part by part on every send, since there is no model here.
   * Scheduling confirms a slot; everything else drafts.
   */
  replies: { default: ScriptedReply; schedule: ScriptedReply };
  /** Present on `/agent`, where the composer starts as the hero. */
  landing?: LandingData;
  /** Present on `/agent/[threadId]`, where the thread is already open. */
  messages?: readonly AgentMessage[];
}

interface Streaming {
  messageId: string;
  revealed: number;
  reply: ScriptedReply;
}

/** How long the thinking state holds, then the gap between parts. */
const THINK_MS = 1400;
const PART_MS = 700;

/** A live conversation is not stored, so its URL is not a real thread id. */
const NEW_THREAD_PATH = "/agent/new";

/** What pressing a button in a reply says on the user's behalf. */
const INTENT_PROMPT: Record<string, string> = {
  schedule: "Schedule it.",
  edit: "I want to edit it first.",
  regenerate: "Try another angle.",
  move: "Move it to another day.",
  unschedule: "Take it off the calendar.",
  "browse-files": "Let me pick from the files.",
};

/**
 * `/agent`, in both of its modes. The landing and the thread are one component
 * so the composer is one element: on send it stays mounted and slides from the
 * hero position down into the dock while everything around it gives way.
 */
export function AgentWorkspace({
  replies,
  landing,
  messages: initialMessages,
}: AgentWorkspaceProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [messages, setMessages] = useState<readonly AgentMessage[]>(
    initialMessages ?? [],
  );
  const [streaming, setStreaming] = useState<Streaming | null>(null);
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<PostChipData | null>(null);
  const [handled, setHandled] = useState<readonly string[]>([]);
  const [onLanding, setOnLanding] = useState(landing !== undefined);
  const turns = useRef(0);

  // The reply arrives a part at a time: the thinking state holds, then the rest.
  useEffect(() => {
    if (streaming === null) return;
    const { messageId, revealed, reply } = streaming;
    const next = revealed + 1;

    const timer = window.setTimeout(
      () => {
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId
              ? { ...message, parts: reply.parts.slice(0, next) }
              : message,
          ),
        );
        setStreaming(
          next < reply.parts.length
            ? { messageId, revealed: next, reply }
            : null,
        );
      },
      revealed === 0 ? THINK_MS : PART_MS,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [streaming]);

  function send(text: string, intent = "default") {
    turns.current += 1;
    const turn = String(turns.current);
    const messageId = `reply-${turn}`;

    setMessages((current) => [
      ...current,
      { id: `user-${turn}`, role: "user", parts: [{ type: "text", text }] },
      { id: messageId, role: "assistant", parts: [] },
    ]);
    setStreaming({
      messageId,
      revealed: 0,
      reply:
        intent === "schedule" || intent === "approve"
          ? replies.schedule
          : replies.default,
    });
    setDraft("");
    setAttached(null);

    if (onLanding) {
      setOnLanding(false);
      // No navigation: the composer has to survive the morph. The URL catches
      // up so the rail reads as a thread, and a reload lands back on the page.
      window.history.replaceState(null, "", NEW_THREAD_PATH);
    }
  }

  /** An attached post rides along in the message, the way a person would say it. */
  function sendDraft(text: string) {
    send(attached === null ? text : `About "${attached.title}": ${text}`);
  }

  const showLanding = landing !== undefined && onLanding;

  /**
   * One element in both modes, so the send is a single spring from the hero
   * position down to the dock. The dock floats over the thread rather than
   * sitting on a bar, which is what keeps the move to one animation.
   */
  const composer = (
    <Composer
      variant={onLanding ? "hero" : "dock"}
      value={draft}
      onValueChange={setDraft}
      onSend={sendDraft}
      animateLayout={!reduceMotion}
      className={
        onLanding ? "max-w-2xl" : "sticky bottom-l z-10 mx-auto mt-l max-w-3xl"
      }
      {...(attached === null
        ? {}
        : {
            placeholder: "Ask about this post",
            attachments: (
              <PostContext
                posts={[attached]}
                onRemove={() => {
                  setAttached(null);
                }}
              />
            ),
          })}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 gap-xl px-xl">
      <div className="flex min-w-0 flex-1 flex-col pb-l">
        {/* `popLayout` takes the leaving landing out of flow at once, so the
            composer has a single, settled position to spring to. Its children
            have to be motion elements for that, which is why the wrappers are
            here rather than inside the landing pieces. */}
        <AnimatePresence initial={false} mode="popLayout">
          {showLanding ? (
            <motion.div key="intro" exit={blurOut} transition={fade.base}>
              <LandingIntro
                greeting={landing.greeting}
                dateLabel={landing.dateLabel}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {onLanding ? null : (
          <AgentThread
            messages={messages}
            thinking={streaming !== null}
            {...(streaming === null
              ? {}
              : { thinkingStatuses: streaming.reply.statuses })}
            onIntent={(intent) => {
              send(INTENT_PROMPT[intent] ?? "Go ahead.", intent);
            }}
          />
        )}

        {composer}

        <AnimatePresence initial={false} mode="popLayout">
          {showLanding ? (
            <motion.div key="below" exit={blurOut} transition={fade.base}>
              <LandingBelow
                entries={landing.timeline.filter(
                  (entry) => !handled.includes(entry.id),
                )}
                days={landing.days}
                onAction={(entry, action) => {
                  setHandled((current) => [...current, entry.id]);
                  send(action.prompt ?? entry.title, action.intent);
                }}
                onOpenPost={setAttached}
                {...(attached === null ? {} : { selectedPostId: attached.id })}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false} mode="popLayout">
        {showLanding ? (
          <motion.aside
            key="rail"
            exit={{ opacity: 0, x: 24 }}
            transition={fade.base}
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
