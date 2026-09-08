"use client";

import { motion } from "motion/react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import { ChartCard } from "@/components/features/analytics/chart-card";
import { StatGroup, StatTile } from "@/components/features/analytics/stat-tile";
import type { AnalyticsStat, PreviewChart } from "@/services/analytics";
import { fade } from "@/styles/motion";

interface AnalyticsPageProps {
  stats: readonly AnalyticsStat[];
  charts: readonly PreviewChart[];
}

/**
 * The analytics page's body: the month's numbers, then the same charts the
 * composer previews. Pressing one attaches it to the chat in the right
 * column, the way pressing a post on the calendar does. The first chart
 * carries the preview's layout id, so expanding morphs it into place while
 * the tiles above it fade in.
 */
export function AnalyticsPage({ stats, charts }: AnalyticsPageProps) {
  const chat = useChat();

  return (
    <div className="flex flex-1 flex-col gap-xl px-xxl pb-xxl">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={fade.base}
        className="flex flex-col gap-xl"
      >
        <h1 className="type-heading">Analytics</h1>
        <StatGroup>
          {stats.map((stat) => (
            <StatTile
              key={stat.label}
              value={stat.value}
              label={stat.label}
              delta={stat.delta}
            />
          ))}
        </StatGroup>
      </motion.div>
      {/* The trend runs the full width; the cuts of it sit beneath, side by
          side where there is room. */}
      <div className="grid gap-l lg:grid-cols-2">
        {charts.map((chart, index) => (
          <ChartCard
            key={chart.id}
            chart={chart}
            selected={chat.attachedId === chart.id}
            onOpen={() => {
              chat.toggleAttached({ kind: "chart", chart });
            }}
            className={index === 0 ? "lg:col-span-2" : undefined}
            {...(index === 0 ? { layoutId: PREVIEW_LAYOUT_ID.analytics } : {})}
          />
        ))}
      </div>
    </div>
  );
}
