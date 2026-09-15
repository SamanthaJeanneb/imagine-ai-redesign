"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState, type ReactNode } from "react";

import { searchThreads } from "@/components/layout/chat-search";
import type { SidebarThread } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchBox } from "@/components/ui/search-box";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { pressRow } from "@/styles/motion";

interface ChatControlsProps {
  filesOpen: boolean;
  onFilesOpenChange: (open: boolean) => void;
  className?: string;
}

/**
 * The files panel toggle. On an open agent thread it takes the place of the
 * account controls. History lives on the chat name, not here.
 */
export function ChatControls({
  filesOpen,
  onFilesOpenChange,
  className,
}: ChatControlsProps) {
  return (
    <div className={cn("flex items-center gap-xs", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={filesOpen ? "Hide files" : "Show files"}
            aria-pressed={filesOpen}
            onClick={() => {
              onFilesOpenChange(!filesOpen);
            }}
            className={cn(
              "text-imagine-foreground-muted hover:text-imagine-foreground",
              filesOpen && "bg-imagine-surface-raised text-imagine-foreground",
            )}
          >
            {/* The kit has no right-hand sidebar glyph; mirror the left one.
                On a wrapper, not the icon: the kit rewrites the icon's own
                classes when it swaps in the SVG. */}
            <span className="flex -scale-x-100">
              <Icon name="sidebar" />
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {filesOpen ? "Hide files" : "Files"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function historyThreads(
  threads: readonly SidebarThread[],
  currentThreadId: string | null,
  currentTitle: string,
): readonly SidebarThread[] {
  const currentIsStored = threads.some(
    (thread) => thread.id === currentThreadId,
  );
  if (currentThreadId !== null && !currentIsStored) {
    return [{ id: currentThreadId, title: currentTitle }, ...threads];
  }
  return threads;
}

/**
 * The arrow beside the open conversation's name: the rest of the history, in
 * a popover with a search. Render it inside `ChatTitle`.
 */
export function ChatHistoryMenu({
  title,
  threads,
  currentThreadId,
  onSelectThread,
}: {
  title: string;
  threads: readonly SidebarThread[];
  currentThreadId: string | null;
  onSelectThread: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const visible = historyThreads(threads, currentThreadId, title);

  function close() {
    setOpen(false);
    setQuery("");
  }

  function select(id: string) {
    onSelectThread(id);
    close();
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label="Chat history"
          className="-ml-xxs text-imagine-foreground-faint hover:text-imagine-foreground"
        >
          <Icon
            name="chevron-down"
            size="s"
            className="transition-transform group-data-[state=open]/button:rotate-180"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-80 gap-0 p-0">
        <div className="p-s">
          <SearchBox
            value={query}
            onValueChange={setQuery}
            results={searchThreads(visible, query)}
            onSelect={select}
            placeholder="Search chats"
            emptyLabel={`No chats match “${query.trim()}”`}
            listLabel="Chats"
            autoFocus
          />
        </div>
        {query.trim() !== "" ? null : (
          <nav
            aria-label="Chat history"
            className="flex max-h-80 flex-col gap-xxs overflow-y-auto p-s pt-0"
          >
            {visible.map((thread) => {
              const active = thread.id === currentThreadId;
              return (
                <motion.button
                  key={thread.id}
                  type="button"
                  aria-current={active ? "true" : undefined}
                  onClick={() => {
                    select(thread.id);
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
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * The open conversation's name, in the page header after the profile faces.
 * `ChatHistoryMenu` as a child puts the way into the rest of the history
 * beside it. Enter and leave motion lives on the header wrapper, so the menu
 * is not a motion child.
 */
export function ChatTitle({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <h2
        title={title}
        className="min-w-0 truncate type-small font-medium text-imagine-foreground"
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
