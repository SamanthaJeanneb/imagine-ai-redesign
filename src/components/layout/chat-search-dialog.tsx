"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useState, type ReactNode } from "react";

import type { SidebarThread } from "@/components/layout/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { InputGroupInput } from "@/components/ui/input-group";
import { pressRow } from "@/styles/motion";

/**
 * Centered search over every chat. Idle, it groups the current thread under
 * Last opened and the rest under Recent chats. Typing filters as you go:
 * every word has to match, titles rank above body text, and the hit is
 * marked in the row.
 */

function wordsIn(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function haystack(thread: SidebarThread): string {
  return `${thread.title} ${thread.preview ?? ""}`.toLowerCase();
}

function matches(thread: SidebarThread, words: readonly string[]): boolean {
  if (words.length === 0) return true;
  const hay = haystack(thread);
  return words.every((word) => hay.includes(word));
}

function titleMatches(thread: SidebarThread, words: readonly string[]): boolean {
  const title = thread.title.toLowerCase();
  return words.every((word) => title.includes(word));
}

/** Title prefix, then title contains, then body. Lower is better. */
function score(thread: SidebarThread, words: readonly string[]): number {
  const title = thread.title.toLowerCase();
  const joined = words.join(" ");
  if (title.startsWith(joined)) return 0;
  if (words.every((word) => title.includes(word))) return 1;
  return 2;
}

function Highlighted({
  text,
  words,
}: {
  text: string;
  words: readonly string[];
}): ReactNode {
  if (words.length === 0) return text;
  const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, index) => {
    const hit = words.some((word) => part.toLowerCase() === word);
    return hit ? (
      <span key={index} className="font-semibold text-imagine-foreground">
        {part}
      </span>
    ) : (
      part
    );
  });
}

/** A short window around the first matching word in the body. */
function snippet(
  preview: string,
  words: readonly string[],
): string | undefined {
  const lower = preview.toLowerCase();
  let index = -1;
  let length = 0;
  for (const word of words) {
    const found = lower.indexOf(word);
    if (found >= 0) {
      index = found;
      length = word.length;
      break;
    }
  }
  if (index < 0) return undefined;
  const start = Math.max(0, index - 20);
  const end = Math.min(preview.length, index + length + 48);
  const slice = preview.slice(start, end).trim();
  return `${start > 0 ? "…" : ""}${slice}${end < preview.length ? "…" : ""}`;
}

function ChatRow({
  thread,
  words,
  current,
  optionId,
  onHover,
  onChoose,
}: {
  thread: SidebarThread;
  words: readonly string[];
  current: boolean;
  optionId: string;
  onHover: () => void;
  onChoose: () => void;
}) {
  const body =
    words.length > 0 &&
    thread.preview !== undefined &&
    !titleMatches(thread, words)
      ? snippet(thread.preview, words)
      : undefined;

  return (
    <li id={optionId} role="option" aria-selected={current}>
      <motion.button
        type="button"
        tabIndex={-1}
        whileTap={pressRow.whileTap}
        transition={pressRow.transition}
        onMouseMove={onHover}
        onClick={onChoose}
        className={cn(
          "flex w-full items-center gap-s rounded-control px-xs py-s text-left transition-colors outline-none",
          current
            ? "bg-imagine-foreground/8 text-imagine-foreground"
            : "text-imagine-foreground hover:bg-imagine-foreground/5",
        )}
      >
        <span
          aria-hidden="true"
          className="size-4 shrink-0 rounded-full border border-imagine-foreground/35"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-xxs">
          <span className="truncate type-small font-medium">
            <Highlighted text={thread.title} words={words} />
          </span>
          {body === undefined ? null : (
            <span className="truncate type-caption text-imagine-foreground-muted">
              <Highlighted text={body} words={words} />
            </span>
          )}
        </span>
      </motion.button>
    </li>
  );
}

function ChatSection({
  label,
  threads,
  words,
  listed,
  active,
  listId,
  onHover,
  onChoose,
}: {
  label: string;
  threads: readonly SidebarThread[];
  words: readonly string[];
  listed: readonly SidebarThread[];
  active: number;
  listId: string;
  onHover: (index: number) => void;
  onChoose: (id: string) => void;
}) {
  if (threads.length === 0) return null;

  return (
    <section className="flex flex-col gap-s">
      <p className="px-xs type-small text-imagine-foreground-muted">{label}</p>
      <div
        className="flex flex-col"
        onMouseDown={(event) => {
          event.preventDefault();
        }}
      >
        {threads.map((thread) => {
          const index = listed.findIndex((item) => item.id === thread.id);
          return (
            <ChatRow
              key={thread.id}
              thread={thread}
              words={words}
              current={index === active}
              optionId={`${listId}-${String(index)}`}
              onHover={() => {
                if (index !== active) onHover(index);
              }}
              onChoose={() => {
                onChoose(thread.id);
              }}
            />
          );
        })}
      </div>
    </section>
  );
}

export function ChatSearchDialog({
  open,
  onOpenChange,
  threads,
  activeThreadId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threads: readonly SidebarThread[];
  activeThreadId?: string;
  onSelect: (id: string) => void;
}) {
  const listId = useId();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const words = wordsIn(query);
  const lastOpened =
    threads.find((thread) => thread.id === activeThreadId) ?? threads[0];
  const lastOpenedId = lastOpened?.id;
  const recent = threads.filter((thread) => thread.id !== lastOpenedId);

  const lastOpenedHits =
    lastOpened !== undefined && matches(lastOpened, words) ? [lastOpened] : [];
  const recentHits =
    words.length === 0
      ? recent
      : recent.filter((thread) => matches(thread, words)).toSorted((a, b) => {
          return score(a, words) - score(b, words);
        });
  const listed = [...lastOpenedHits, ...recentHits];
  const active =
    listed.length === 0 || activeIndex < 0
      ? -1
      : Math.min(activeIndex, listed.length - 1);

  function close() {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(-1);
  }

  function choose(id: string) {
    onSelect(id);
    close();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          onOpenChange(true);
          return;
        }
        close();
      }}
    >
      <DialogContent className="gap-xl p-xl sm:max-w-lg">
        <DialogTitle className="sr-only">Search chats</DialogTitle>
        <DialogDescription className="sr-only">
          Find a conversation by name or what was said, then open it.
        </DialogDescription>
        <InputGroupInput
          type="text"
          value={query}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="Search..."
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          className="h-8 px-xs pr-10"
          {...(active >= 0
            ? { "aria-activedescendant": `${listId}-${String(active)}` }
            : {})}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(-1);
          }}
          onKeyDown={(event) => {
            switch (event.key) {
              case "ArrowDown":
                event.preventDefault();
                if (listed.length === 0) return;
                setActiveIndex((active + 1) % listed.length);
                break;
              case "ArrowUp":
                event.preventDefault();
                if (listed.length === 0) return;
                setActiveIndex(
                  active < 0
                    ? listed.length - 1
                    : (active - 1 + listed.length) % listed.length,
                );
                break;
              case "Enter": {
                const hit = listed[active];
                if (hit !== undefined) {
                  event.preventDefault();
                  choose(hit.id);
                }
                break;
              }
              case "Escape":
                if (query !== "") {
                  event.preventDefault();
                  setQuery("");
                  setActiveIndex(-1);
                }
                break;
            }
          }}
        />
        <div
          id={listId}
          role="listbox"
          aria-label="Chats"
          className="-mx-xs flex max-h-[min(28rem,55vh)] flex-col gap-xl overflow-y-auto"
        >
          {listed.length === 0 ? (
            <p className="flex items-center gap-s px-xs py-m type-small text-imagine-foreground-muted">
              <Icon name="magnifying-glass" size="s" />
              {words.length === 0 ? "No chats yet" : "No chats match"}
            </p>
          ) : (
            <>
              <ChatSection
                label="Last opened"
                threads={lastOpenedHits}
                words={words}
                listed={listed}
                active={active}
                listId={listId}
                onHover={setActiveIndex}
                onChoose={choose}
              />
              <ChatSection
                label="Recent chats"
                threads={recentHits}
                words={words}
                listed={listed}
                active={active}
                listId={listId}
                onHover={setActiveIndex}
                onChoose={choose}
              />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
