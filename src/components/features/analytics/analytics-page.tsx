"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import { AnalyticsToolbar } from "@/components/features/analytics/analytics-toolbar";
import { AskImagine } from "@/components/features/analytics/ask-imagine";
import { BenchmarkPanel } from "@/components/features/analytics/benchmark-panel";
import {
  BestTimeGrid,
  formatSlot,
} from "@/components/features/analytics/best-time-grid";
import { EngagementExplorer } from "@/components/features/analytics/engagement-explorer";
import { IcpPosts } from "@/components/features/analytics/icp-posts";
import { InteractionFeed } from "@/components/features/analytics/interaction-feed";
import { StatGroup, StatTile } from "@/components/features/analytics/stat-tile";
import { TeamPerformance } from "@/components/features/analytics/team-performance";
import type { TimeRange } from "@/entities/analytics";
import type {
  AnalyticsPageData,
  AnalyticsSections,
  AnalyticsSnapshot,
} from "@/services/analytics";
import { fade } from "@/styles/motion";

interface AnalyticsPageProps {
  data: AnalyticsPageData;
}

const EMPTY_SNAPSHOT: AnalyticsSnapshot = {
  range: "1m",
  profileId: "all",
  overview: {
    stats: [],
    impressions: { data: [], series: [] },
    byLabel: { data: [], series: [] },
    byProfile: [],
    topPosts: [],
  },
  explorer: {
    points: [],
    posts: [],
    xTicks: [],
    totals: { reach: 0, rate: 0, followers: 0, posts: 0 },
    pipeline: { contacts: 0, opportunities: 0, amount: 0 },
  },
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
    snapshots[0] ??
    EMPTY_SNAPSHOT
  );
}

function sectionsFor(
  sections: readonly AnalyticsSections[],
  profileId: string,
): AnalyticsSections | undefined {
  return (
    sections.find((section) => section.profileId === profileId) ?? sections[0]
  );
}

function csvCell(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

/**
 * The analytics workspace. Filters, the agent's read of the numbers, the
 * headline totals, then the engagement explorer, and under it the panels that
 * put the numbers in context: who you are up against, who you reached, how
 * the team splits, when to post, and who has been talking to you. Every
 * panel has a way into the agent. The server precomputes the small filter
 * matrix from the mock; changing a control selects its snapshot immediately.
 */
export function AnalyticsPage({ data }: AnalyticsPageProps) {
  const chat = useChat();
  const [range, setRange] = useState<TimeRange>("1m");
  const [profileId, setProfileId] = useState("all");
  const snapshot = snapshotFor(data.snapshots, range, profileId);
  const sections = sectionsFor(data.sections, profileId);
  const overview = snapshot.overview;
  const selectedPostId = chat.attached
    .flatMap((item) => (item.kind === "post" ? [item.post.id] : []))
    .at(-1);
  const ask = (prompt: string, intent?: string) => {
    chat.send(prompt, intent);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className="@container flex flex-1 flex-col gap-xl"
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
              [
                "Date",
                "Reach",
                "Engagement rate",
                "Followers",
                "Posts",
                "Pipeline",
              ],
              ...snapshot.explorer.points.map((point) => [
                point.day,
                point.reach,
                point.rate,
                point.followers,
                point.posts,
                point.pipeline,
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

      <AskImagine insights={sections?.insights ?? []} onAsk={ask} />

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

      <EngagementExplorer
        data={snapshot.explorer}
        {...(selectedPostId === undefined ? {} : { selectedPostId })}
        onSelectPost={(post) => {
          if (post.chip !== undefined) {
            chat.toggleAttached({ kind: "post", post: post.chip });
          }
        }}
        onAsk={ask}
        layoutId={PREVIEW_LAYOUT_ID.analytics}
      />

      {sections ? (
        <>
          <BenchmarkPanel data={sections.benchmark} onAsk={ask} />

          <IcpPosts
            data={sections.icp}
            onEngage={(engager, post, action) => {
              if (action === "reply") {
                ask(
                  `Draft a reply to ${engager.name}'s comment on "${post.title}".`,
                  "comment",
                );
              } else {
                ask(
                  `Draft a comment on ${engager.name}'s latest post, from ${post.profileName}.`,
                  "outreach",
                );
              }
            }}
            onAsk={ask}
          />

          <div className="grid min-w-0 gap-xl @5xl:grid-cols-2">
            <TeamPerformance data={data.team} onAsk={ask} />
            <BestTimeGrid
              data={sections.bestTimes}
              onPick={(slot) => {
                ask(
                  `Schedule the next post for ${formatSlot(slot)}.`,
                  "schedule",
                );
              }}
              onAsk={ask}
            />
          </div>

          <InteractionFeed
            items={sections.interactions}
            onAct={(item, action) => {
              if (action === "reply") {
                ask(
                  `Draft a reply to ${item.name}'s comment on "${item.postTitle}".`,
                  "comment",
                );
              } else {
                ask(
                  `Draft a comment on ${item.name}'s latest post.`,
                  "outreach",
                );
              }
            }}
            onAsk={ask}
          />
        </>
      ) : null}
    </motion.div>
  );
}
