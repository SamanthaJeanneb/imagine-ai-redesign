"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import type {
  TimelineAction,
  TimelineEntry,
} from "@/components/features/agent/timeline";
import {
  type CalendarDay,
  CalendarGrid,
} from "@/components/features/calendar/calendar-grid";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { hoverLift, pressRow } from "@/styles/motion";

/**
 * The centered landing, `/landing-2`. One column, everything on the axis: the
 * agent's mark and greeting, the composer, a row of what needs the user, and
 * the month below. No right rail. Like the split landing these pieces do not
 * animate themselves; the workspace wraps each one so the first send exits
 * them together.
 */

/** How many activities become cards. The rest are a thread away. */
const CARDS = 3;

/** A glyph for each kind of activity the agent reports. */
const KIND_ICON: Record<string, IconName> = {
  Drafted: "file-pen",
  Scheduled: "calendar",
  Published: "circle-check",
  Failed: "triangle-exclamation",
  "Reply drafted": "comment",
  "Persona updated": "user",
};

export function CenteredIntro({
  greeting,
  dateLabel,
}: {
  greeting: string;
  dateLabel: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-xl pb-xxl text-center">
      {/* The agent, as a person would be: a circle. Black mark on a white disc
          in both themes, with a plain drop shadow: no ring, no sheen. */}
      <span className="flex size-16 items-center justify-center rounded-full bg-white text-black shadow-[0_2px_6px_rgb(0_0_0/0.08),0_12px_28px_-8px_rgb(0_0_0/0.22)]">
        <Icon name="imagine" className="text-[34px]" />
      </span>
      <div className="flex flex-col gap-xs">
        <h1 className="type-title">{greeting}</h1>
        <p className="type-small text-imagine-foreground-muted">{dateLabel}</p>
      </div>
    </div>
  );
}

/**
 * Three raised cards, one activity each: a glyph for the kind, the kind and
 * when, the title, and the primary action along the bottom edge. Pressing a
 * card takes that action, which opens a thread with its sentence. Cards sit
 * on the surface, so they are the only container here.
 */
export function ActivityCards({
  entries,
  onAction,
  className,
}: {
  entries: readonly TimelineEntry[];
  onAction: (entry: TimelineEntry, action: TimelineAction) => void;
  className?: string;
}) {
  const shown = entries.slice(0, CARDS);
  if (shown.length === 0) return null;

  return (
    <Stagger
      kind="grid"
      data-slot="activity-cards"
      className={cn("grid grid-cols-3 gap-l", className)}
    >
      {shown.map((entry) => {
        const primary =
          entry.actions.find((action) => action.primary) ?? entry.actions[0];
        const icon = KIND_ICON[entry.kind] ?? "imagine";
        return (
          <StaggerItem key={entry.id} className="flex">
            <motion.button
              type="button"
              whileTap={pressRow.whileTap}
              whileHover={hoverLift.whileHover}
              transition={pressRow.transition}
              onClick={() => {
                if (primary) onAction(entry, primary);
              }}
              className="group/card flex min-h-40 w-full flex-col gap-m rounded-panel bg-imagine-surface p-l text-left shadow-raised transition-shadow outline-none hover:shadow-floating focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <span className="flex items-center justify-between gap-s">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-control",
                    entry.unread
                      ? "bg-imagine-secondary-soft text-imagine-secondary-strong"
                      : "bg-imagine-surface-raised text-imagine-foreground",
                  )}
                >
                  <Icon name={icon} size="m" />
                </span>
                {entry.unread ? (
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-imagine-secondary ring-[3px] ring-imagine-secondary-soft"
                  />
                ) : null}
              </span>
              <span className="flex flex-col gap-xxs">
                <span className="truncate type-small text-imagine-foreground-muted">
                  {entry.kind}
                  <span className="text-imagine-foreground-faint"> · </span>
                  {entry.when}
                </span>
                <span className="line-clamp-2 type-body font-medium">
                  {entry.title}
                </span>
              </span>
              {primary ? (
                <span className="mt-auto flex items-center gap-xs border-t border-imagine-border pt-m type-small font-medium">
                  {primary.label}
                  <Icon
                    name="arrow-right"
                    size="s"
                    className="transition-transform group-hover/card:translate-x-0.5"
                  />
                </span>
              ) : null}
            </motion.button>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

/** The whole month, the way the calendar page shows it, with a way there. */
export function MonthCalendar({
  label,
  days,
  onOpenPost,
  onOpenCalendar,
  selectedPostId,
  className,
}: {
  label: string;
  days: readonly CalendarDay[];
  onOpenPost: (post: PostChipData) => void;
  onOpenCalendar: () => void;
  selectedPostId?: string;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-l", className)}>
      <div className="flex items-baseline justify-between gap-l">
        <h2 className="type-heading">{label}</h2>
        <Button
          variant="link"
          size="sm"
          className="px-0 text-imagine-foreground-muted"
          onClick={onOpenCalendar}
        >
          <Icon name="calendar" size="s" />
          Open calendar
        </Button>
      </div>
      <CalendarGrid
        days={days}
        density="page"
        onOpenPost={onOpenPost}
        {...(selectedPostId === undefined ? {} : { selectedPostId })}
      />
    </section>
  );
}
