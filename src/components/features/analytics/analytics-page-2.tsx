"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { PREVIEW_LAYOUT_ID } from "@/components/features/agent/chat-dock";
import { useChat } from "@/components/features/agent/chat-provider";
import { AnalyticsToolbar } from "@/components/features/analytics/analytics-toolbar";
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
import {
  downloadCsv,
  explorerCsvRows,
  sectionsFor,
  snapshotFor,
} from "@/components/features/analytics/analytics-data";
import type { TimeRange } from "@/entities/analytics";
import type { AnalyticsPageData } from "@/services/analytics";
import { fade } from "@/styles/motion";

interface AnalyticsPage2Props {
  data: AnalyticsPageData;
}

/**
 * The analytics workspace at `/analytics-2`. Filters, headline totals, then the
 * engagement explorer, and under it the panels that
 * put the numbers in context: who you are up against, who you reached, how
 * the team splits, when to post, and who has been talking to you. Every
 * panel has a way into the agent. The server precomputes the small filter
 * matrix from the mock; changing a control selects its snapshot immediately.
 */
export function AnalyticsPage2({ data }: AnalyticsPage2Props) {
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
      className="@container flex min-w-0 flex-1 flex-col gap-l md:gap-xl"
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
            downloadCsv(
              explorerCsvRows(snapshot.explorer.points),
              `imagine-analytics-${range}-${profileId}.csv`,
            );
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
