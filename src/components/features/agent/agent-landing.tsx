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
import { Disclosure } from "@/components/motion/disclosure";
import { Stagger } from "@/components/motion/stagger";
import { Icon } from "@/components/ui/icon";
import { pressRow, spring } from "@/styles/motion";

/**
 * The landing, in three pieces so the composer can sit between them and slide
 * into the thread dock. The pieces animate nowhere themselves: the workspace
 * wraps each one, because the first send exits them all together.
 */

export interface LandingStat {
  value: string;
  label: string;
}

export function LandingIntro({
  greeting,
  dateLabel,
}: {
  greeting: string;
  dateLabel: string;
}) {
  return (
    <div className="flex flex-col gap-xxs pb-l">
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
  const unread = entries.some((entry) => entry.unread);

  return (
    <div className="flex flex-col gap-xxl pt-xl pb-xxl">
      {/* The week is the reason to be here, so it stays put. What happened while
          the user was away waits behind its header. */}
      <section className="flex flex-col gap-l">
        <h2 className="type-heading">Next two weeks</h2>
        <CalendarGrid
          days={days}
          density="strip"
          onOpenPost={onOpenPost}
          {...(selectedPostId === undefined ? {} : { selectedPostId })}
        />
      </section>
      {entries.length === 0 ? null : (
        <section className="flex flex-col gap-l">
          <h2 className="flex">
            <motion.button
              type="button"
              aria-expanded={open}
              onClick={() => {
                setOpen((current) => !current);
              }}
              whileTap={pressRow.whileTap}
              transition={pressRow.transition}
              className="-mx-s flex items-center gap-s rounded-control px-s py-xs type-heading transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              While you were away
              {unread && !open ? (
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-imagine-secondary ring-4 ring-imagine-secondary-soft"
                />
              ) : null}
              <motion.span
                aria-hidden="true"
                animate={{ rotate: open ? 90 : 0 }}
                transition={spring.snappy}
                className="flex text-imagine-foreground-faint"
              >
                <Icon name="chevron-right" size="s" />
              </motion.span>
            </motion.button>
          </h2>
          <Disclosure open={open}>
            <Timeline entries={entries} onAction={onAction} className="pl-xs" />
          </Disclosure>
        </section>
      )}
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
    <div className="flex w-72 flex-col gap-xl pb-xxl">
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
        kind="bar"
        data={chart.data}
        series={chart.series}
        tone="accent"
        dense
      />
      <UpNextList items={upNext} onViewAll={onOpenCalendar} />
    </div>
  );
}
