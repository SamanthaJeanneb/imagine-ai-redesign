"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import {
  FileTree,
  type FileSection,
} from "@/components/features/files/file-tree";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useResizable } from "@/lib/use-resizable";
import { fade, spring } from "@/styles/motion";

/** The thread's working panel. History is a dropdown on the chat name. */
export type ChatPanelMode = "files";

interface ChatContextPanelProps {
  fileSections: readonly FileSection[];
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
  fileSections,
  onClose,
}: ChatContextPanelProps) {
  const reduceMotion = useReducedMotion();
  const resize = useResizable({
    defaultWidth: PANEL_WIDTH,
    min: 280,
    max: 560,
    edge: "start",
    transition: spring.snappy,
  });

  return (
    <motion.aside
      data-slot="chat-context-panel"
      aria-label="Files"
      initial={reduceMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
      animate={{ width: resize.width, opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: fade.fast }
          : { width: 0, opacity: 0, transition: fade.base }
      }
      transition={resize.transition}
      className="relative flex min-h-0 shrink-0 justify-end overflow-hidden border-l border-imagine-border"
    >
      <ResizeHandle
        edge="start"
        binding={resize.handle}
        dragging={resize.dragging}
        label="Resize panel"
      />
      <div
        style={{ width: resize.width }}
        className="flex min-h-0 shrink-0 flex-col bg-imagine-surface"
      >
        <PanelHeader title="Files" onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FilesPanel fileSections={fileSections} />
        </div>
      </div>
    </motion.aside>
  );
}
