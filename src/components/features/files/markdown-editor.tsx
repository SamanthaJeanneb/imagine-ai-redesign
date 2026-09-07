"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

export interface DocumentMeta {
  title: string;
  /** "Edited by Sarah Chen, 2h ago". */
  edited: string;
  editorName: string;
  editorAvatarUrl?: string;
}

interface MarkdownEditorProps {
  meta: DocumentMeta;
  /** Current markdown source. */
  value: string;
  /** Last saved source, used to know when Revert and Save are live. */
  savedValue: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onRevert: () => void;
  className?: string;
}

type Block =
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly string[] };

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;

/** Minimal markdown to blocks: headings, bullets, paragraphs. */
function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let list: string[] | null = null;
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: "paragraph", text: paragraph.join(" ") });
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ kind: "list", items: list });
      list = null;
    }
  };

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (heading?.[1] !== undefined) {
      flushParagraph();
      flushList();
      blocks.push({ kind: "heading", text: heading[1] });
    } else if (bullet?.[1] !== undefined) {
      flushParagraph();
      list ??= [];
      list.push(bullet[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return blocks;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * The document view that opens in a tab beside the thread. Reads as a page:
 * title, meta line, then headings as small caps labels. Click into the body to
 * edit the source; Save and Revert only light up when there are changes.
 */
export function MarkdownEditor({
  meta,
  value,
  savedValue,
  onValueChange,
  onSave,
  onRevert,
  className,
}: MarkdownEditorProps) {
  const [editing, setEditing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const dirty = value !== savedValue;
  const blocks = parseBlocks(value);

  return (
    <div
      data-slot="markdown-editor"
      className={cn("flex w-full max-w-2xl flex-col gap-xl", className)}
    >
      <header className="flex items-start justify-between gap-l">
        <div className="flex min-w-0 flex-col gap-s">
          <h1 className="truncate type-title">{meta.title}</h1>
          <div className="flex items-center gap-s type-small text-imagine-foreground-muted">
            <Avatar size="sm" className="size-5">
              {meta.editorAvatarUrl ? (
                <AvatarImage src={meta.editorAvatarUrl} alt={meta.editorName} />
              ) : null}
              <AvatarFallback className="text-[10px]">
                {initials(meta.editorName)}
              </AvatarFallback>
            </Avatar>
            <span>{meta.edited}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-xs">
          <AnimatePresence initial={false}>
            {savedFlash ? (
              <motion.span
                key="saved"
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={fade.fast}
                className="inline-flex items-center gap-xs type-small text-success"
              >
                <Icon name="check" size="s" />
                Saved
              </motion.span>
            ) : null}
          </AnimatePresence>
          <Button
            size="sm"
            variant="ghost"
            disabled={!dirty}
            onClick={onRevert}
          >
            Revert
          </Button>
          <Button
            size="sm"
            disabled={!dirty}
            onClick={() => {
              onSave();
              setEditing(false);
              setSavedFlash(true);
              window.setTimeout(() => {
                setSavedFlash(false);
              }, 1800);
            }}
          >
            Save
          </Button>
        </div>
      </header>

      <motion.div layout transition={spring.soft} className="relative">
        {editing ? (
          <textarea
            autoFocus
            value={value}
            aria-label="Markdown source"
            onChange={(event) => {
              onValueChange(event.target.value);
            }}
            onBlur={() => {
              if (!dirty) setEditing(false);
            }}
            className="field-sizing-content min-h-64 w-full resize-none rounded-panel bg-imagine-surface-raised/60 p-l font-mono text-[13px] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        ) : (
          <button
            type="button"
            aria-label="Edit document"
            onClick={() => {
              setEditing(true);
            }}
            className="flex w-full flex-col gap-l rounded-panel p-l text-left transition-colors outline-none hover:bg-imagine-surface-raised/40 focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {blocks.length === 0 ? (
              <span className="type-body text-imagine-foreground-faint">
                Empty document. Click to start writing.
              </span>
            ) : null}
            {blocks.map((block, index) => {
              switch (block.kind) {
                case "heading":
                  return (
                    <span
                      key={index}
                      className="pt-xs type-micro text-imagine-foreground-muted first:pt-0"
                    >
                      {block.text}
                    </span>
                  );
                case "paragraph":
                  return (
                    <span key={index} className="max-w-prose type-body">
                      {block.text}
                    </span>
                  );
                case "list":
                  return (
                    <ul key={index} className="flex flex-col gap-xs">
                      {block.items.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex gap-m type-body before:mt-2.5 before:size-1 before:shrink-0 before:rounded-full before:bg-imagine-foreground-faint"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  );
              }
            })}
          </button>
        )}
      </motion.div>
    </div>
  );
}
