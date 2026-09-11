"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useState } from "react";

import type { SidebarThread } from "@/components/layout/sidebar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { pressRow } from "@/styles/motion";

/**
 * Centered search over every chat. The rail only has room for recent threads;
 * this is how you find the rest. Typing filters by title; choosing a row
 * opens it.
 */
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
  const [activeIndex, setActiveIndex] = useState(0);

  const needle = query.trim().toLowerCase();
  const listed =
    needle === ""
      ? threads
      : threads.filter((thread) => thread.title.toLowerCase().includes(needle));
  const active =
    listed.length === 0 ? -1 : Math.min(activeIndex, listed.length - 1);

  function close() {
    onOpenChange(false);
    setQuery("");
    setActiveIndex(0);
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
      <DialogContent className="gap-m sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search chats</DialogTitle>
          <DialogDescription className="sr-only">
            Find a conversation by name and open it.
          </DialogDescription>
        </DialogHeader>
        <SearchField
          value={query}
          onValueChange={(next) => {
            setQuery(next);
            setActiveIndex(0);
          }}
          placeholder="Search chats"
          autoFocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          {...(active >= 0
            ? { "aria-activedescendant": `${listId}-${String(active)}` }
            : {})}
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
                  (active - 1 + listed.length) % listed.length,
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
                  setActiveIndex(0);
                }
                break;
            }
          }}
        />
        {listed.length === 0 ? (
          <p className="flex items-center gap-s px-s py-m type-small text-imagine-foreground-muted">
            <Icon name="magnifying-glass" size="s" />
            {needle === "" ? "No chats yet" : "No chats match"}
          </p>
        ) : (
          <ul
            id={listId}
            role="listbox"
            aria-label="Chats"
            className="-mx-xs flex max-h-80 flex-col gap-px overflow-y-auto"
            onMouseDown={(event) => {
              // Keep the field focused so the click lands on the row.
              event.preventDefault();
            }}
          >
            {listed.map((thread, index) => {
              const current = index === active;
              const selected = thread.id === activeThreadId;
              return (
                <li
                  key={thread.id}
                  id={`${listId}-${String(index)}`}
                  role="option"
                  aria-selected={current}
                >
                  <motion.button
                    type="button"
                    tabIndex={-1}
                    whileTap={pressRow.whileTap}
                    transition={pressRow.transition}
                    onMouseMove={() => {
                      if (!current) setActiveIndex(index);
                    }}
                    onClick={() => {
                      choose(thread.id);
                    }}
                    className={cn(
                      "flex h-8 w-full items-center gap-s rounded-control px-s text-left transition-colors outline-none",
                      current
                        ? "bg-imagine-foreground/8 text-imagine-foreground"
                        : "text-imagine-foreground-muted",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        thread.unread
                          ? "bg-imagine-secondary"
                          : "border border-imagine-foreground-faint/70",
                        selected &&
                          !thread.unread &&
                          "border-imagine-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate type-small",
                        (thread.unread || selected) && "font-medium",
                        selected && "text-imagine-foreground",
                      )}
                    >
                      {thread.title}
                    </span>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
