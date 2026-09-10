"use client";

// Imagine: a search field whose results drop down under it as you type.
// Arrow keys move, Enter opens, Escape clears. Used by the Files browser and
// the calendar toolbar.

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { fade, pressRow } from "@/styles/motion";

export interface SearchBoxResult {
  id: string;
  icon: IconName;
  title: string;
  /** Where it is, or when: "Acme", "Tue, 8 Sep · 9:00". */
  detail?: string;
}

interface SearchBoxProps {
  value: string;
  onValueChange: (value: string) => void;
  results: readonly SearchBoxResult[];
  onSelect: (id: string) => void;
  placeholder?: string;
  /** Shown when the query has no results. */
  emptyLabel?: string;
  /** Accessible name for the results list. */
  listLabel?: string;
  /** Results beyond this many are counted, not listed. */
  limit?: number;
  className?: string;
}

export function SearchBox({
  value,
  onValueChange,
  results,
  onSelect,
  placeholder,
  emptyLabel = "Nothing matches",
  listLabel = "Search results",
  limit = 8,
  className,
}: SearchBoxProps) {
  const listId = useId();
  // Typing shows the list; leaving the field or pressing Escape hides it.
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const query = value.trim();
  const open = query !== "" && !dismissed;
  const listed = results.slice(0, limit);
  const more = results.length - listed.length;
  // Results shrink as the query narrows; keep the highlight on a real row.
  const active =
    listed.length === 0 ? -1 : Math.min(activeIndex, listed.length - 1);

  const choose = (id: string) => {
    onSelect(id);
    setActiveIndex(0);
    setDismissed(true);
  };

  return (
    <div data-slot="search-box" className={cn("relative", className)}>
      <SearchField
        value={value}
        onValueChange={(next) => {
          onValueChange(next);
          setActiveIndex(0);
          setDismissed(false);
        }}
        {...(placeholder === undefined ? {} : { placeholder })}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        {...(open && active >= 0
          ? { "aria-activedescendant": `${listId}-${String(active)}` }
          : {})}
        onFocus={() => {
          setDismissed(false);
        }}
        onBlur={() => {
          setDismissed(true);
        }}
        onKeyDown={(event) => {
          if (!open) {
            if (event.key === "ArrowDown" && query !== "") {
              event.preventDefault();
              setDismissed(false);
            }
            return;
          }
          switch (event.key) {
            case "ArrowDown":
              event.preventDefault();
              setActiveIndex(
                listed.length === 0 ? 0 : (active + 1) % listed.length,
              );
              break;
            case "ArrowUp":
              event.preventDefault();
              setActiveIndex(
                listed.length === 0
                  ? 0
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
              event.preventDefault();
              setDismissed(true);
              break;
          }
        }}
      />
      <AnimatePresence>
        {open ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={fade.fast}
            // Pressing a row must not blur the input before the click lands.
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            // Hangs from the field's right edge and may grow past its left,
            // so a long title and its detail both fit.
            className="absolute top-full right-0 z-30 mt-xs w-max max-w-sm min-w-full overflow-hidden rounded-panel bg-imagine-surface p-xs shadow-floating ring-1 ring-imagine-border"
          >
            {listed.length === 0 ? (
              <p className="flex items-center gap-s px-s py-m type-small text-imagine-foreground-muted">
                <Icon name="magnifying-glass" size="s" />
                {emptyLabel}
              </p>
            ) : (
              <ul
                id={listId}
                role="listbox"
                aria-label={listLabel}
                className="flex max-h-80 flex-col gap-px overflow-y-auto"
              >
                {listed.map((result, index) => {
                  const current = index === active;
                  return (
                    <li
                      key={result.id}
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
                          choose(result.id);
                        }}
                        className={cn(
                          "flex w-full items-center gap-s rounded-control px-s py-xs text-left transition-colors outline-none",
                          current
                            ? "bg-imagine-foreground/8 text-imagine-foreground"
                            : "text-imagine-foreground-muted",
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center">
                          <Icon name={result.icon} size="s" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate type-small font-medium text-imagine-foreground">
                            {result.title}
                          </span>
                          {result.detail === undefined ? null : (
                            <span className="truncate text-xs text-imagine-foreground-faint">
                              {result.detail}
                            </span>
                          )}
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
            )}
            {more > 0 ? (
              <p className="px-s pt-xs pb-xxs text-xs text-imagine-foreground-faint">
                {String(more)} more. Keep typing to narrow it down.
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
