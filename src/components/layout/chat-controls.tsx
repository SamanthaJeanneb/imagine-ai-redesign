"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import type { ChatPanelMode } from "@/components/layout/chat-context-panel";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fade } from "@/styles/motion";

interface ChatControlsProps {
  panel: ChatPanelMode | null;
  onPanelChange: (panel: ChatPanelMode | null) => void;
  className?: string;
}

/**
 * The right end of the page header once a conversation is open: the way into
 * past chats and the toggle for the right panel. Takes the place of the
 * account controls, which the thread has no use for.
 */
export function ChatControls({
  panel,
  onPanelChange,
  className,
}: ChatControlsProps) {
  const historyOpen = panel === "history";
  const filesOpen = panel === "files";

  return (
    <div className={cn("flex items-center gap-xs", className)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Chat history"
            aria-pressed={historyOpen}
            onClick={() => {
              onPanelChange(historyOpen ? null : "history");
            }}
            className={cn(
              "text-imagine-foreground-muted hover:text-imagine-foreground",
              historyOpen &&
                "bg-imagine-surface-raised text-imagine-foreground",
            )}
          >
            <Icon name="clock-rotate-left" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">History</TooltipContent>
      </Tooltip>
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

/**
 * The open conversation's name, in the page header after the profile faces.
 * Arrives a beat after the faces have let go of their sentence, sliding in
 * from where that sentence was; leaves quickly so the sentence can return.
 */
export function ChatTitle({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <motion.h1
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0, transition: { ...fade.base, delay: 0.1 } }}
      exit={{ opacity: 0, x: -8, transition: fade.fast }}
      title={title}
      className={cn(
        "min-w-0 truncate type-small font-medium text-imagine-foreground",
        className,
      )}
    >
      {title}
    </motion.h1>
  );
}
