"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fade } from "@/styles/motion";

export type CalendarView = "day" | "week" | "month";

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
  className,
}: CalendarToolbarProps) {
  return (
    <div
      data-slot="calendar-toolbar"
      className={cn("flex flex-wrap items-center gap-l", className)}
    >
      <div className="flex items-center gap-xs">
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
            transition={fade.fast}
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
        className="mx-auto"
      >
        {VIEWS.map((item) => (
          <ToggleGroupItem key={item.key} value={item.key}>
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <SearchField
        value={search}
        onValueChange={onSearchChange}
        placeholder="Search posts"
        className="w-56"
      />
    </div>
  );
}
