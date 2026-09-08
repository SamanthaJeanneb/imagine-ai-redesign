"use client";

import { motion } from "motion/react";
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
import type { PostChipData } from "@/components/features/calendar/post-chip";
import {
  UpNextList,
  type UpNextItem,
} from "@/components/features/calendar/up-next-list";
import { Stagger } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { spring } from "@/styles/motion";

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
const PREVIEW = 2;

export function LandingIntro({
  greeting,
  dateLabel,
}: {
  greeting: string;
  dateLabel: string;
}) {
  return (
    <div className="flex flex-col gap-xs pt-xl pb-xl">
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
  selectedPostId,
}: {
  entries: readonly TimelineEntry[];
  days: readonly CalendarDay[];
  onAction: (entry: TimelineEntry, action: TimelineAction) => void;
  onOpenPost: (post: PostChipData) => void;
  selectedPostId?: string;
}) {
  const [open, setOpen] = useState(false);
  const rest = entries.length - PREVIEW;

  return (
    <div className="flex flex-1 flex-col gap-xxl pt-xl pb-l">
      {entries.length === 0 ? null : (
        <section className="flex flex-col gap-l">
          <h2 className="type-heading">While you were away</h2>
          {/* The first two are the preview. The timeline animates the rest in,
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
          className="flex-1"
          {...(selectedPostId === undefined ? {} : { selectedPostId })}
        />
      </section>
    </div>
  );
}

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
  return (
    <div className="flex w-72 flex-col gap-xxl pb-section">
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
  );
}
