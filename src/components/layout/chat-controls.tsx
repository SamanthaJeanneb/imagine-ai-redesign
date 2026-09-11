"use client";

import { cn } from "cn";

import type { ChatPanelMode } from "@/components/layout/chat-context-panel";
import type { SidebarThread } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatControlsProps {
  panel: ChatPanelMode | null;
  onPanelChange: (panel: ChatPanelMode | null) => void;
  className?: string;
}

/**
 * The files panel toggle. On an open agent thread it takes the place of the
 * account controls. History lives on the chat name, not here.
 */
export function ChatControls({
  panel,
  onPanelChange,
  className,
}: ChatControlsProps) {
  const filesOpen = panel === "files";

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
              onPanelChange(filesOpen ? null : "files");
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

function ChatHistoryMenu({
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
  const visible = historyThreads(threads, currentThreadId, title);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuGroup>
          {visible.map((thread) => {
            const active = thread.id === currentThreadId;
            return (
              <DropdownMenuItem
                key={thread.id}
                aria-current={active ? "true" : undefined}
                onSelect={() => {
                  onSelectThread(thread.id);
                }}
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
                <span className="truncate">{thread.title}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * The open conversation's name, in the page header after the profile faces.
 * An arrow beside the name opens the rest of the history. Enter and leave
 * motion lives on the header wrapper, so the menu is not a motion child.
 */
export function ChatTitle({
  title,
  threads,
  currentThreadId = null,
  onSelectThread,
  className,
}: {
  title: string;
  threads?: readonly SidebarThread[];
  currentThreadId?: string | null;
  onSelectThread?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <h1
        title={title}
        className="min-w-0 truncate type-small font-medium text-imagine-foreground"
      >
        {title}
      </h1>
      {onSelectThread === undefined || threads === undefined ? null : (
        <ChatHistoryMenu
          title={title}
          threads={threads}
          currentThreadId={currentThreadId}
          onSelectThread={onSelectThread}
        />
      )}
    </div>
  );
}
