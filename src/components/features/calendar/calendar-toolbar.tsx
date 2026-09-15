"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchBox, type SearchBoxResult } from "@/components/ui/search-box";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CalendarView } from "@/lib/calendar";
import { fade } from "@/styles/motion";

/*
 * The calendar's toolbar, in parts. The page assembles them:
 *
 *   <CalendarToolbar>
 *     <CalendarRange>
 *       <CalendarRangeStepper onPrevious onNext onToday />
 *       <CalendarRangeLabel>September 2026</CalendarRangeLabel>
 *     </CalendarRange>
 *     <CalendarViewToggle value onValueChange />
 *     <CalendarSearch value onValueChange results onSelect />
 *   </CalendarToolbar>
 */

/**
 * The frame: one line where the page is wide, with the range at the left,
 * the view switch in the middle, and the search at the right; stacked where
 * it is narrow.
 */
export function CalendarToolbar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="calendar-toolbar"
      className={cn(
        "flex w-full min-w-0 flex-col gap-m @min-[42rem]/page:grid @min-[42rem]/page:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] @min-[42rem]/page:items-center @min-[42rem]/page:gap-l",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The stepper and the range's name, side by side. */
export function CalendarRange({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-m">{children}</div>;
}

/** Back a range, to today, forward a range. */
export function CalendarRangeStepper({
  onPrevious,
  onNext,
  onToday,
}: {
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
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
      <Button size="icon-xs" variant="ghost" aria-label="Next" onClick={onNext}>
        <Icon name="chevron-right" size="s" />
      </Button>
    </div>
  );
}

/** "September 2026" or "8 to 14 Sep", fading through as the range moves. */
export function CalendarRangeLabel({ children }: { children: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={children}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={fade.base}
        className="min-w-0 truncate type-heading"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

const VIEWS: readonly { key: CalendarView; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

/** Day, week, or month. */
export function CalendarViewToggle({
  value,
  onValueChange,
}: {
  value: CalendarView;
  onValueChange: (view: CalendarView) => void;
}) {
  return (
    <ToggleGroup
      value={value}
      onValueChange={(next) => {
        const found = VIEWS.find((item) => item.key === next);
        if (found) onValueChange(found.key);
      }}
      aria-label="Calendar view"
      className="self-start"
    >
      {VIEWS.map((item) => (
        <ToggleGroupItem key={item.key} value={item.key}>
          {item.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Search over posts, its hits listed under the field. */
export function CalendarSearch({
  value,
  onValueChange,
  results,
  onSelect,
}: {
  value: string;
  onValueChange: (value: string) => void;
  /** Posts and events matching the search, listed under the field. */
  results: readonly SearchBoxResult[];
  /** A result was chosen; the id is the post's or the event's. */
  onSelect: (id: string) => void;
}) {
  return (
    <SearchBox
      value={value}
      onValueChange={onValueChange}
      results={results}
      onSelect={onSelect}
      placeholder="Search posts"
      emptyLabel={`No posts match “${value.trim()}”`}
      listLabel="Posts"
      className="w-full min-w-0 @min-[42rem]/page:w-64 @min-[42rem]/page:justify-self-end"
    />
  );
}
