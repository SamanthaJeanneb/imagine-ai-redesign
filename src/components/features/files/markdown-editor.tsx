"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

export interface DocumentMeta {
  title: string;
}

interface MarkdownEditorProps {
  meta: DocumentMeta;
  /** Current markdown source. */
  value: string;
  /** Last saved source, used to know when Cancel and Save are live. */
  savedValue: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
  className?: string;
}

interface Line {
  /** Where the line sits in the source: stable while its text is edited. */
  id: number;
  text: string;
}

type Block = { id: number } & (
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly Line[] }
);

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;

/** Minimal markdown to blocks: headings, bullets, paragraphs. */
function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let list: Line[] | null = null;
  let paragraph: Line[] = [];

  const flushParagraph = () => {
    const first = paragraph[0];
    if (first !== undefined) {
      blocks.push({
        id: first.id,
        kind: "paragraph",
        text: paragraph.map((line) => line.text).join(" "),
      });
      paragraph = [];
    }
  };
  const flushList = () => {
    const first = list?.[0];
    if (list !== null && first !== undefined) {
      blocks.push({ id: first.id, kind: "list", items: list });
      list = null;
    }
  };

  source.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (heading?.[1] !== undefined) {
      flushParagraph();
      flushList();
      blocks.push({ id: index, kind: "heading", text: heading[1] });
    } else if (bullet?.[1] !== undefined) {
      flushParagraph();
      list ??= [];
      list.push({ id: index, text: bullet[1] });
    } else {
      flushList();
      paragraph.push({ id: index, text: line });
    }
  });
  flushParagraph();
  flushList();
  return blocks;
}

/**
 * The document view that opens in a tab beside the thread. Reads as a page:
 * title, then headings as small caps labels. Click into the body to edit the
 * source. Cancel appears once there are unsaved changes; Save lights up then too.
 */
export function MarkdownEditor({
  meta,
  value,
  savedValue,
  onValueChange,
  onSave,
  className,
}: MarkdownEditorProps) {
  const [editing, setEditing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<number>(undefined);
  const dirty = value !== savedValue;
  const blocks = parseBlocks(value);

  useEffect(
    () => () => {
      window.clearTimeout(flashTimer.current);
    },
    [],
  );

  return (
    <div
      data-slot="markdown-editor"
      className={cn("mx-auto flex w-full max-w-2xl flex-col gap-xl", className)}
    >
      <header className="flex items-start justify-between gap-l">
        <h1 className="min-w-0 truncate type-title">{meta.title}</h1>
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
          {dirty ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onValueChange(savedValue);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          ) : null}
          <Button
            size="sm"
            disabled={!dirty}
            onClick={() => {
              onSave();
              setEditing(false);
              setSavedFlash(true);
              window.clearTimeout(flashTimer.current);
              flashTimer.current = window.setTimeout(() => {
                setSavedFlash(false);
              }, 1800);
            }}
          >
            Save
          </Button>
        </div>
      </header>

      <motion.div
        layout
        layoutDependency={editing}
        transition={spring.settle}
        className="relative"
      >
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
            className="field-sizing-content min-h-64 w-full resize-none rounded-panel bg-imagine-surface-raised/60 p-l font-mono type-small leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        ) : (
          // A button may only hold phrasing content, and the preview has
          // lists in it, so the press target lies over the preview instead.
          <div className="relative flex w-full flex-col gap-l rounded-panel p-l transition-colors hover:bg-imagine-surface-raised/40">
            {blocks.length === 0 ? (
              <p className="type-body text-imagine-foreground-faint">
                Empty document. Click to start writing.
              </p>
            ) : null}
            {blocks.map((block) => {
              switch (block.kind) {
                case "heading":
                  return (
                    <p
                      key={block.id}
                      className="pt-xs type-micro text-imagine-foreground-muted first:pt-0"
                    >
                      {block.text}
                    </p>
                  );
                case "paragraph":
                  return (
                    <p key={block.id} className="max-w-prose type-body">
                      {block.text}
                    </p>
                  );
                case "list":
                  return (
                    <ul key={block.id} className="flex flex-col gap-xs">
                      {block.items.map((item) => (
                        <li
                          key={item.id}
                          className="flex gap-m type-body before:mt-2.5 before:size-1 before:shrink-0 before:rounded-full before:bg-imagine-foreground-faint"
                        >
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  );
              }
            })}
            <button
              type="button"
              aria-label="Edit document"
              onClick={() => {
                setEditing(true);
              }}
              className="absolute inset-0 rounded-panel outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
