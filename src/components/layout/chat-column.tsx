"use client";

import { cn } from "cn";
import { motion, useReducedMotion, type Transition } from "motion/react";
import type { ReactNode } from "react";

import {
  AgentThinking,
  AgentThread,
} from "@/components/features/agent/agent-thread";
import { ThreadChatDock } from "@/components/features/agent/chat-dock";
import { ChatEmptyMark } from "@/components/features/agent/chat-empty-mark";
import { useChat } from "@/components/features/agent/chat-provider";
import type { ComposerPreview } from "@/components/features/agent/composer";
import { ChatHistoryMenu, ChatTitle } from "@/components/layout/chat-controls";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle";
import type { SidebarThread } from "@/entities/agent";
import { useResizable } from "@/lib/use-resizable";
import { fade, spring } from "@/styles/motion";

const EMPTY_COPY: Record<ComposerPreview, string> = {
  calendar:
    "Ask about what is on the calendar, or select a post to talk about it.",
  analytics: "Ask about these numbers, or what to post next.",
};

/** `w-96`, as a number for the width animation. */
const COLUMN_WIDTH = 384;

interface ChatColumnContentProps {
  /** The page beside the chat. Its own preview chip is not offered. */
  page: ComposerPreview;
  title: string;
  threads: readonly SidebarThread[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
}

interface ChatColumnAsideProps {
  /** The settled width. The inner column is fixed at it, so text never rewraps mid-animation. */
  width: number | string;
  /** Mid-drag: follow the pointer with no spring. */
  dragging?: boolean;
  transition: Transition;
  className?: string;
  children: ReactNode;
}

/**
 * Enters in flow by width, so the page beside it compresses in the same beat
 * instead of jumping when the column is gone.
 */
function ChatColumnAside({
  width,
  dragging = false,
  transition,
  className,
  children,
}: ChatColumnAsideProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.aside
      data-slot="chat-column"
      initial={reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
      animate={dragging ? { opacity: 1 } : { width, opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: fade.fast }
          : { width: 0, opacity: 0, transition: fade.base }
      }
      transition={transition}
      style={dragging || typeof width === "string" ? { width } : undefined}
      className={cn(
        "relative flex min-h-0 shrink-0 justify-end overflow-hidden bg-imagine-surface",
        className,
      )}
    >
      {children}
    </motion.aside>
  );
}

interface ChatColumnBodyProps extends ChatColumnContentProps {
  width: number | string;
  /** Trailing header controls, e.g. `ChatColumnCloseButton`. */
  children?: ReactNode;
}

/**
 * The column itself: the title and its history at the top, the thread
 * scrolling, the composer holding the foot, with the preview that opens this
 * page not on offer.
 */
function ChatColumnBody({
  page,
  title,
  threads,
  currentThreadId,
  onSelectThread,
  width,
  children,
}: ChatColumnBodyProps) {
  const chat = useChat();
  const previews: readonly ComposerPreview[] =
    page === "calendar" ? ["analytics"] : ["calendar"];

  return (
    <div
      style={{ width }}
      className="flex min-h-0 w-full shrink-0 flex-col border-l border-imagine-foreground/12"
    >
      <div className="mt-m flex h-8 shrink-0 items-center gap-s px-l">
        <ChatTitle title={title} className="flex-1">
          <ChatHistoryMenu
            title={title}
            threads={threads}
            currentThreadId={currentThreadId}
            onSelectThread={onSelectThread}
          />
        </ChatTitle>
        {children}
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
          <AgentThread messages={chat.messages} onIntent={chat.sendIntent}>
            <AgentThinking />
          </AgentThread>
        )}
        <ThreadChatDock
          previews={previews}
          className="sticky bottom-l z-10 mt-xl"
        />
      </div>
    </div>
  );
}

/** The way out of an overlaid column, trailing on its header row. */
function ChatColumnCloseButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="-mr-s ml-auto flex items-center">
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Close chat"
        onClick={onClick}
        className="text-imagine-foreground-muted hover:text-imagine-foreground"
      >
        <Icon name="xmark" />
      </Button>
    </div>
  );
}

interface DockedChatColumnProps extends ChatColumnContentProps {
  className?: string;
}

/**
 * The chat as a right column beside the calendar and analytics pages, on a
 * frame wide enough to hold both. The same conversation as `/agent`, narrower,
 * taking the full height of the surface, with a handle to resize it.
 */
export function DockedChatColumn({
  className,
  ...content
}: DockedChatColumnProps) {
  const resize = useResizable({
    defaultWidth: COLUMN_WIDTH,
    min: 320,
    max: 640,
    edge: "start",
  });

  return (
    <ChatColumnAside
      width={resize.width}
      dragging={resize.dragging}
      transition={resize.transition}
      className={className}
    >
      <ResizeHandle
        edge="start"
        binding={resize.handle}
        dragging={resize.dragging}
        label="Resize chat"
      />
      <ChatColumnBody {...content} width={resize.width} />
    </ChatColumnAside>
  );
}

interface OverlayChatColumnProps extends ChatColumnContentProps {
  onClose: () => void;
  className?: string;
}

/**
 * The same column sitting over the page instead of taking a column of its
 * own, on a frame too narrow to share. Fixed width, with a close control.
 */
export function OverlayChatColumn({
  onClose,
  className,
  ...content
}: OverlayChatColumnProps) {
  return (
    <ChatColumnAside
      width={COLUMN_WIDTH}
      transition={spring.settle}
      className={className}
    >
      <ChatColumnBody {...content} width={COLUMN_WIDTH}>
        <ChatColumnCloseButton onClick={onClose} />
      </ChatColumnBody>
    </ChatColumnAside>
  );
}

/** The column filling a phone's surface, with a close control. */
export function SheetChatColumn({
  onClose,
  className,
  ...content
}: OverlayChatColumnProps) {
  return (
    <ChatColumnAside
      width="100%"
      transition={spring.settle}
      className={className}
    >
      <ChatColumnBody {...content} width="100%">
        <ChatColumnCloseButton onClick={onClose} />
      </ChatColumnBody>
    </ChatColumnAside>
  );
}
