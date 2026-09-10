"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import {
  Timeline,
  type TimelineAction,
  type TimelineEntry,
} from "@/components/features/agent/timeline";
import {
  ChartBlock,
  type ChartDatum,
  type ChartSeries,
} from "@/components/features/analytics/chart-block";
import { StatTile } from "@/components/features/analytics/stat-tile";
import {
  type CalendarDay,
  CalendarGrid,
} from "@/components/features/calendar/calendar-grid";
import type { EventChipData } from "@/components/features/calendar/event-chip";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import {
  UpNextList,
  type UpNextItem,
} from "@/components/features/calendar/up-next-list";
import { Stagger } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useResizable } from "@/lib/use-resizable";
import { fade, spring } from "@/styles/motion";

/** The rail's content column at rest was `w-72` inside a `pl-xxl` gutter. */
const RAIL_WIDTH = { default: 336, min: 288, max: 480 } as const;

/**
 * The split landing's column. Capped and centred so that on a wide screen the
 * timeline's actions stay within reach of their titles instead of drifting to
 * the far edge. The composer takes the same classes so it lines up.
 */
export const LANDING_COLUMN = "mx-auto w-full max-w-4xl min-w-0";

/**
 * The landing, in three pieces so the composer can sit between them and slide
 * into the thread dock. The pieces animate nowhere themselves: the workspace
 * wraps each one, because the first send exits them all together.
 */

export interface LandingStat {
  value: string;
  label: string;
}

/** How many activities show before the list has to be opened. */
const PREVIEW = 3;

export function LandingIntro({
  greeting,
  dateLabel,
}: {
  greeting: string;
  dateLabel: string;
}) {
  return (
    <div className={cn(LANDING_COLUMN, "flex flex-col gap-xs pb-xl")}>
      <h1 className="type-title">{greeting}</h1>
      <p className="type-small text-imagine-foreground-muted">{dateLabel}</p>
    </div>
  );
}

export function LandingBelow({
  entries,
  days,
  onAction,
  onOpenPost,
  onOpenEvent,
  selectedPostId,
}: {
  entries: readonly TimelineEntry[];
  days: readonly CalendarDay[];
  onAction: (entry: TimelineEntry, action: TimelineAction) => void;
  onOpenPost: (post: PostChipData) => void;
  onOpenEvent?: (event: EventChipData) => void;
  selectedPostId?: string;
}) {
  const [open, setOpen] = useState(false);
  const rest = entries.length - PREVIEW;

  return (
    // The same beat above the first section as between the sections, so the
    // composer does not crowd the timeline. No bottom padding of its own: the
    // page's inset already matches the top.
    <div className={cn(LANDING_COLUMN, "flex flex-1 flex-col gap-xxl pt-xxl")}>
      {entries.length === 0 ? null : (
        <section className="flex flex-col gap-l">
          <h2 className="type-heading">While you were away</h2>
          {/* The first few are the preview. The timeline animates the rest in,
              so opening it grows the list rather than swapping it. */}
          <Timeline
            entries={open ? entries : entries.slice(0, PREVIEW)}
            onAction={onAction}
          />
          {rest > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={open}
              onClick={() => {
                setOpen((current) => !current);
              }}
              // Pulled back by the button's own padding so the label lines up
              // with the heading rather than sitting inside it.
              className="-ml-2.5 self-start"
            >
              {open ? "Show less" : `Show ${String(rest)} more`}
              <motion.span
                aria-hidden="true"
                animate={{ rotate: open ? -90 : 90 }}
                transition={spring.snappy}
                className="flex text-imagine-foreground-faint"
                data-icon="inline-end"
              >
                <Icon name="chevron-right" size="s" />
              </motion.span>
            </Button>
          ) : null}
        </section>
      )}
      <section className="flex flex-1 flex-col gap-l">
        <h2 className="type-heading">Next two weeks</h2>
        <CalendarGrid
          days={days}
          density="strip"
          onOpenPost={onOpenPost}
          onOpenEvent={onOpenEvent}
          className="flex-1"
          {...(selectedPostId === undefined ? {} : { selectedPostId })}
        />
      </section>
    </div>
  );
}

/**
 * The landing's right sidebar: this month's numbers, the impressions curve,
 * and what posts next. A full-height column beside the page like the chat
 * and context panels, with its own scroll and a drag handle on its inner
 * edge. It leaves by width, so the page widens in the same beat.
 */
export function LandingRail({
  stats,
  chart,
  upNext,
  onOpenCalendar,
}: {
  stats: readonly LandingStat[];
  chart: { data: readonly ChartDatum[]; series: readonly ChartSeries[] };
  upNext: readonly UpNextItem[];
  onOpenCalendar: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const resize = useResizable({
    defaultWidth: RAIL_WIDTH.default,
    min: RAIL_WIDTH.min,
    max: RAIL_WIDTH.max,
    edge: "start",
  });

  return (
    <motion.aside
      data-slot="landing-rail"
      initial={false}
      animate={{ width: resize.width, opacity: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0, transition: fade.fast }
          : { width: 0, opacity: 0, transition: fade.base }
      }
      transition={resize.transition}
      className="relative flex min-h-0 shrink-0 justify-end overflow-hidden"
    >
      <ResizeHandle
        edge="start"
        binding={resize.handle}
        dragging={resize.dragging}
        label="Resize overview"
      />
      {/* Fixed at the final width, so nothing rewraps while the column
          animates. Padding matches the page's own inset. */}
      <div
        style={{ width: resize.width }}
        className="flex min-h-0 shrink-0 flex-col gap-xxl overflow-y-auto border-l border-imagine-foreground/12 px-xl pt-xxl pb-xxl"
      >
        {/* Numbers only. The deltas live on the analytics page, where there is
            room for them and a range control to make them mean something. */}
        <Stagger kind="grid" className="grid grid-cols-2 gap-l">
          {stats.map((stat) => (
            <StatTile
              key={stat.label}
              value={stat.value}
              label={stat.label}
              size="compact"
            />
          ))}
        </Stagger>
        <ChartBlock
          kind="area"
          data={chart.data}
          series={chart.series}
          title="Impressions over time"
          description="Last 30 days"
          tone="accent"
        />
        <UpNextList items={upNext} onViewAll={onOpenCalendar} />
      </div>
    </motion.aside>
  );
}
