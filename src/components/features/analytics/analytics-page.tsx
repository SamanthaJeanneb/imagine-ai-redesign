"use client";

import { motion } from "motion/react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { ChartBlock } from "@/components/features/analytics/chart-block";
import { StatGroup, StatTile } from "@/components/features/analytics/stat-tile";
import type { AnalyticsChart, AnalyticsStat } from "@/services/analytics";
import { fade } from "@/styles/motion";

interface AnalyticsPageProps {
  stats: readonly AnalyticsStat[];
  impressions: AnalyticsChart;
}

/**
 * The analytics page's body. The impressions chart carries the composer
 * preview's layout id, so expanding the preview morphs it into place while
 * the tiles above it fade in.
 */
export function AnalyticsPage({ stats, impressions }: AnalyticsPageProps) {
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
      <motion.div layoutId={PREVIEW_LAYOUT_ID.analytics}>
        <ChartBlock
          kind="area"
          data={impressions.data}
          series={impressions.series}
          title="Impressions over time"
          description="Last 30 days"
        />
      </motion.div>
    </div>
  );
}
