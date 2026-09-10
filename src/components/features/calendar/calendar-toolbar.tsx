"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchBox, type SearchBoxResult } from "@/components/ui/search-box";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CalendarView } from "@/lib/calendar";
import { fade } from "@/styles/motion";

interface CalendarToolbarProps {
  /** "September 2026" or "8 to 14 Sep". */
  rangeLabel: string;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  /** Posts matching the search, listed under the field. */
  searchResults: readonly SearchBoxResult[];
  /** A result was chosen; the id is the post's. */
  onSearchSelect: (postId: string) => void;
  className?: string;
}

const VIEWS: readonly { key: CalendarView; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

/** Range stepper, view switch, and search on one line. */
export function CalendarToolbar({
  rangeLabel,
  view,
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  search,
  onSearchChange,
  searchResults,
  onSearchSelect,
  className,
}: CalendarToolbarProps) {
  return (
    <div
      data-slot="calendar-toolbar"
      className={cn(
        "grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-l",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-xs">
        <div className="flex items-center rounded-control bg-imagine-surface-raised p-xxs">
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Previous"
            onClick={onPrevious}
          >
            <Icon name="chevron-left" size="s" />
          </Button>
          <Button size="xs" variant="ghost" onClick={onToday}>
            Today
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Next"
            onClick={onNext}
          >
            <Icon name="chevron-right" size="s" />
          </Button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={rangeLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={fade.base}
            className="min-w-32 type-heading"
          >
            {rangeLabel}
          </motion.span>
        </AnimatePresence>
      </div>

      <ToggleGroup
        value={view}
        onValueChange={(next) => {
          const found = VIEWS.find((item) => item.key === next);
          if (found) onViewChange(found.key);
        }}
        aria-label="Calendar view"
      >
        {VIEWS.map((item) => (
          <ToggleGroupItem key={item.key} value={item.key}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <SearchBox
        value={search}
        onValueChange={onSearchChange}
        results={searchResults}
        onSelect={onSearchSelect}
        placeholder="Search posts"
        emptyLabel={`No posts match “${search.trim()}”`}
        listLabel="Posts"
        className="w-64 justify-self-end"
      />
    </div>
  );
}
