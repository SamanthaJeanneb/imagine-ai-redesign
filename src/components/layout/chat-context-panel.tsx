"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import {
  FileTree,
  type FileSection,
} from "@/components/features/files/file-tree";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { SidebarThread } from "@/components/layout/sidebar";
import { fade, pressRow, spring } from "@/styles/motion";

export type ChatPanelMode = "history" | "files";

interface ChatContextPanelProps {
  mode: ChatPanelMode;
  threads: readonly SidebarThread[];
  fileSections: readonly FileSection[];
  currentThreadId: string | null;
  currentTitle: string;
  onSelectThread: (id: string) => void;
  onClose: () => void;
}

const PANEL_WIDTH = 384;

function PanelHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex h-12 shrink-0 items-center border-b border-imagine-border px-l">
      <h2 className="type-small font-semibold text-imagine-foreground">
        {title}
      </h2>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={`Close ${title.toLowerCase()}`}
        onClick={onClose}
        className="-mr-xs ml-auto text-imagine-foreground-muted hover:text-imagine-foreground"
      >
        <Icon name="xmark" size="s" />
      </Button>
    </div>
  );
}

function HistoryPanel({
  threads,
  currentThreadId,
  currentTitle,
  onSelectThread,
}: Pick<
  ChatContextPanelProps,
  "threads" | "currentThreadId" | "currentTitle" | "onSelectThread"
>) {
  const currentIsStored = threads.some(
    (thread) => thread.id === currentThreadId,
  );
  const visibleThreads =
    currentThreadId !== null && !currentIsStored
      ? [{ id: currentThreadId, title: currentTitle }, ...threads]
      : threads;

  return (
    <nav aria-label="Chat history" className="flex flex-col gap-xxs p-s">
      {visibleThreads.map((thread) => {
        const active = thread.id === currentThreadId;
        return (
          <motion.button
            key={thread.id}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => {
              onSelectThread(thread.id);
            }}
            whileTap={pressRow.whileTap}
            transition={pressRow.transition}
            className={cn(
              "flex min-h-9 w-full items-center gap-s rounded-control px-s py-xs text-left transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40",
              active && "bg-imagine-surface-raised",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                thread.unread
                  ? "bg-imagine-secondary"
                  : "bg-imagine-foreground-faint",
                active && !thread.unread && "bg-imagine-foreground",
              )}
            />
            <span
              className={cn(
                "truncate type-small",
                active
                  ? "font-medium text-imagine-foreground"
                  : "text-imagine-foreground-muted",
              )}
            >
              {thread.title}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

function FilesPanel({
  fileSections,
}: {
  fileSections: readonly FileSection[];
}) {
  const [activeFileId, setActiveFileId] = useState<string>();

  return (
    <FileTree
      sections={fileSections}
      {...(activeFileId === undefined ? {} : { activeFileId })}
      onOpenFile={setActiveFileId}
      className="p-s"
    />
  );
}

/**
 * The thread's working panel. It is in layout flow, so opening it compresses
 * the conversation instead of covering it. Its left edge begins exactly where
 * the top-bar divider ends.
 */
export function ChatContextPanel({
  mode,
  threads,
  fileSections,
  currentThreadId,
  currentTitle,
  onSelectThread,
  onClose,
}: ChatContextPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      data-slot="chat-context-panel"
      aria-label={mode === "history" ? "Chat history" : "Files"}
      initial={reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
      animate={{ width: PANEL_WIDTH, opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: fade.fast }
          : { width: 0, opacity: 0, transition: fade.base }
      }
      transition={spring.snappy}
      className="flex min-h-0 shrink-0 justify-end overflow-hidden border-l border-imagine-border"
    >
      <div className="flex min-h-0 w-96 shrink-0 flex-col bg-imagine-surface">
        <PanelHeader
          title={mode === "history" ? "Chat history" : "Files"}
          onClose={onClose}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={fade.fast}
            >
              {mode === "history" ? (
                <HistoryPanel
                  threads={threads}
                  currentThreadId={currentThreadId}
                  currentTitle={currentTitle}
                  onSelectThread={onSelectThread}
                />
              ) : (
                <FilesPanel fileSections={fileSections} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
