"use client";

import { motion } from "motion/react";
import { useMemo, useState } from "react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import { AnalyticsToolbar } from "@/components/features/analytics/analytics-toolbar";
import { ByProfileList } from "@/components/features/analytics/by-profile-list";
import { ChartBlock } from "@/components/features/analytics/chart-block";
import { ChartCard } from "@/components/features/analytics/chart-card";
import { StatGroup, StatTile } from "@/components/features/analytics/stat-tile";
import { TopPosts } from "@/components/features/analytics/top-posts";
import type { TimeRange } from "@/entities/analytics";
import type {
  AnalyticsPageData,
  AnalyticsSnapshot,
  PreviewChart,
} from "@/services/analytics";
import { fade } from "@/styles/motion";

interface AnalyticsPageProps {
  data: AnalyticsPageData;
}

const RANGE_DESCRIPTION: Record<"7d" | "1m" | "3m", string> = {
  "7d": "Last 7 days",
  "1m": "Last 30 days",
  "3m": "Last 90 days",
};

function snapshotFor(
  snapshots: readonly AnalyticsSnapshot[],
  range: TimeRange,
  profileId: string,
): AnalyticsSnapshot {
  return (
    snapshots.find(
      (snapshot) =>
        snapshot.range === range && snapshot.profileId === profileId,
    ) ??
    snapshots[0] ?? {
      range: "1m",
      profileId: "all",
      overview: {
        stats: [],
        impressions: { data: [], series: [] },
        byLabel: { data: [], series: [] },
        byProfile: [],
        topPosts: [],
      },
    }
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

/**
 * The analytics workspace: filters, headline totals, trend, post-label and
 * profile cuts, then the posts behind the numbers. The server precomputes the
 * small filter matrix from the mock; changing a control selects its snapshot
 * immediately without shipping the database into the client bundle.
 */
export function AnalyticsPage({ data }: AnalyticsPageProps) {
  const chat = useChat();
  const [range, setRange] = useState<TimeRange>("1m");
  const [profileId, setProfileId] = useState("all");
  const snapshot = snapshotFor(data.snapshots, range, profileId);
  const overview = snapshot.overview;
  const rangeDescription =
    RANGE_DESCRIPTION[range === "7d" || range === "3m" ? range : "1m"];
  const impressionsChart = useMemo<PreviewChart>(
    () => ({
      id: `impressions:${range}:${profileId}`,
      title: "Impressions over time",
      description: rangeDescription,
      kind: "area",
      summary: overview.stats[0]?.value ?? "0",
      data: overview.impressions.data,
      series: overview.impressions.series,
    }),
    [
      overview.impressions.data,
      overview.impressions.series,
      overview.stats,
      profileId,
      range,
      rangeDescription,
    ],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className="flex flex-1 flex-col gap-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-m">
        <h1 className="type-title">Analytics</h1>
        <AnalyticsToolbar
          range={range}
          onRangeChange={setRange}
          profiles={data.profiles}
          profileId={profileId}
          onProfileChange={setProfileId}
          onExport={() => {
            const rows = [
              ["Date", "Impressions"],
              ...overview.impressions.data.map((datum) => [
                datum.label,
                typeof datum["impressions"] === "number"
                  ? datum["impressions"]
                  : 0,
              ]),
            ];
            const csv = rows
              .map((row) => row.map(csvCell).join(","))
              .join("\n");
            const url = URL.createObjectURL(
              new Blob([csv], { type: "text/csv;charset=utf-8" }),
            );
            const link = document.createElement("a");
            link.href = url;
            link.download = `imagine-analytics-${range}-${profileId}.csv`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        />
      </div>

      <StatGroup>
        {overview.stats.map((stat) => (
          <StatTile
            key={stat.label}
            value={stat.value}
            label={stat.label}
            delta={stat.delta}
          />
        ))}
      </StatGroup>

      <ChartCard
        chart={impressionsChart}
        selected={chat.attachedId === impressionsChart.id}
        onOpen={() => {
          chat.toggleAttached({ kind: "chart", chart: impressionsChart });
        }}
        layoutId={PREVIEW_LAYOUT_ID.analytics}
      />

      <div className="grid min-w-0 gap-l xl:grid-cols-2">
        <ChartBlock
          kind="hbar"
          data={overview.byLabel.data}
          series={overview.byLabel.series}
          title="By post label"
          description={rangeDescription}
          headline={false}
          className="min-w-0"
        />
        <ByProfileList
          items={overview.byProfile}
          selectedId={profileId === "all" ? undefined : profileId}
          onOpen={(profile) => {
            setProfileId(profile.id);
          }}
          className="min-w-0"
        />
      </div>

      <TopPosts
        items={overview.topPosts}
        selectedId={
          chat.attached?.kind === "post"
            ? (chat.attachedId ?? undefined)
            : undefined
        }
        onOpen={(item) => {
          if (item.post !== undefined) {
            chat.toggleAttached({ kind: "post", post: item.post });
          }
        }}
      />
    </motion.div>
  );
}
