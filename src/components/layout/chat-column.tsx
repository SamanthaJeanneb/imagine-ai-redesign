"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";

import { AgentThread } from "@/components/features/agent/agent-thread";
import { ChatDock } from "@/components/features/agent/chat-dock";
import { ChatEmptyMark } from "@/components/features/agent/chat-empty-mark";
import { useChat } from "@/components/features/agent/chat-provider";
import type { ComposerPreview } from "@/components/features/agent/composer";
import { ChatTitle } from "@/components/layout/chat-controls";
import type { SidebarThread } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useResizable } from "@/lib/use-resizable";
import { fade } from "@/styles/motion";

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
  title: string;
  threads: readonly SidebarThread[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
  /** Sits over the page instead of taking a column, on a narrow frame. */
  overlay?: boolean;
  /** Phone overlay: fill the surface. */
  fullWidth?: boolean;
  onClose?: () => void;
  className?: string;
}

/**
 * The chat as a right column, beside the calendar and analytics pages. The
 * same conversation as `/agent`, narrower: it takes the full height of the
 * surface, the title and its history sit at the top of the open column, the
 * thread scrolls, the composer holds the foot, and the preview that opens
 * this page is not on offer.
 */
export function ChatColumn({
  page,
  title,
  threads,
  currentThreadId,
  onSelectThread,
  overlay = false,
  fullWidth = false,
  onClose,
  className,
}: ChatColumnProps) {
  const reduceMotion = useReducedMotion();
  const chat = useChat();
  const resize = useResizable({
    defaultWidth: COLUMN_WIDTH,
    min: 320,
    max: 640,
    edge: "start",
  });
  const previews: readonly ComposerPreview[] =
    page === "calendar" ? ["analytics"] : ["calendar"];
  const width = fullWidth ? "100%" : resize.width;

  return (
    // Enters in flow by width, so the page beside it compresses in the same
    // beat instead of jumping when the column is gone. The inner column is
    // fixed at the final width, so its text never rewraps mid-animation.
    <motion.aside
      data-slot="chat-column"
      initial={reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
      animate={{ width, opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: fade.fast }
          : { width: 0, opacity: 0, transition: fade.base }
      }
      transition={resize.transition}
      className={cn(
        "relative flex min-h-0 shrink-0 justify-end overflow-hidden bg-imagine-surface",
        className,
      )}
    >
      {overlay || fullWidth ? null : (
        <ResizeHandle
          edge="start"
          binding={resize.handle}
          dragging={resize.dragging}
          label="Resize chat"
        />
      )}
      <div
        style={{ width }}
        className="flex min-h-0 w-full shrink-0 flex-col border-l border-imagine-foreground/12"
      >
        <div className="mt-m flex h-8 shrink-0 items-center gap-s px-l">
          <ChatTitle
            title={title}
            threads={threads}
            currentThreadId={currentThreadId}
            onSelectThread={onSelectThread}
            className="flex-1"
          />
          {onClose === undefined ? null : (
            <div className="-mr-s ml-auto flex items-center">
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Close chat"
                onClick={onClose}
                className="text-imagine-foreground-muted hover:text-imagine-foreground"
              >
                <Icon name="xmark" />
              </Button>
            </div>
          )}
        </div>
        {/* Padding lives on the scrollport. `overflow-y-auto` also clips x,
            and the dock sits flush to that edge — its shadow and side radius
            disappear if the inset is outside. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-l pb-l">
          {chat.messages.length === 0 ? (
            <>
              <ChatEmptyMark />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...fade.base, delay: 0.15 }}
                className="shrink-0 pb-l type-small text-imagine-foreground-muted"
              >
                {EMPTY_COPY[page]}
              </motion.p>
            </>
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
            className="sticky bottom-l z-10 mt-xl"
          />
        </div>
      </div>
    </motion.aside>
  );
}
