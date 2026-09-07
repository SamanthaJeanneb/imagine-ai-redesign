"use client";

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
  return (
    <div className="flex flex-col gap-xxl pt-xl pb-xxl">
      <section className="flex flex-col gap-l">
        <h2 className="type-heading">While you were away</h2>
        {entries.length === 0 ? (
          <p className="type-body text-imagine-foreground-muted">
            Nothing new. The agent is waiting on you.
          </p>
        ) : (
          <Timeline entries={entries} onAction={onAction} className="pl-xs" />
        )}
      </section>
      <section className="flex flex-col gap-l">
        <h2 className="type-heading">Next two weeks</h2>
        <CalendarGrid
          days={days}
          density="strip"
          onOpenPost={onOpenPost}
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
