"use client";

import { motion, useReducedMotion } from "motion/react";

import { AgentThread } from "@/components/features/agent/agent-thread";
import { ChatDock } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import type { ComposerPreview } from "@/components/features/agent/composer";
import { fade, spring } from "@/styles/motion";

const EMPTY_COPY: Record<ComposerPreview, string> = {
  calendar:
    "Ask about what is on the calendar, or select a post to talk about it.",
  analytics: "Ask about these numbers, or what to post next.",
};

/** `w-96`, as a number for the width animation. */
const COLUMN_WIDTH = 384;

interface ChatColumnProps {
  /** The page beside the chat. Its own preview chip is not offered. */
  page: ComposerPreview;
}

/**
 * The chat as a right column, beside the calendar and analytics pages. The
 * same conversation as `/agent`, narrower: the thread scrolls, the composer
 * holds the foot, and the preview that opens this page is not on offer.
 */
export function ChatColumn({ page }: ChatColumnProps) {
  const reduceMotion = useReducedMotion();
  const chat = useChat();
  const previews: readonly ComposerPreview[] =
    page === "calendar" ? ["analytics"] : ["calendar"];

  return (
    // Enters in flow by width, so the page beside it compresses in the same
    // beat instead of jumping when the column is gone. The inner column is
    // fixed at the final width, so its text never rewraps mid-animation.
    <motion.aside
      data-slot="chat-column"
      initial={reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
      animate={{ width: COLUMN_WIDTH, opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: fade.fast }
          : { width: 0, opacity: 0, transition: fade.base }
      }
      transition={spring.soft}
      className="flex shrink-0 justify-end overflow-hidden"
    >
      <div className="flex min-h-0 w-96 shrink-0 flex-col overflow-y-auto border-l border-imagine-foreground/12 px-l">
        {chat.messages.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...fade.base, delay: 0.15 }}
            className="mt-auto pb-l type-small text-imagine-foreground-muted"
          >
            {EMPTY_COPY[page]}
          </motion.p>
        ) : (
          <AgentThread
            messages={chat.messages}
            thinking={chat.thinking}
            {...(chat.thinkingStatuses === undefined
              ? {}
              : { thinkingStatuses: chat.thinkingStatuses })}
            onIntent={chat.sendIntent}
          />
        )}
        <ChatDock
          previews={previews}
          animateLayout={!reduceMotion}
          className="sticky bottom-l z-10 mt-l"
        />
      </div>
    </motion.aside>
  );
}
