import type { Metadata } from "next";

import { SplitLandingWorkspace } from "@/components/features/agent/agent-workspace";
import { formatFullDate } from "@/lib/format";
import { getNow } from "@/mocks/db";
import { getTimeline } from "@/services/agent";
import { getLandingRail } from "@/services/analytics";
import { getUpcomingWeeks, getUpNext } from "@/services/calendar";

export const metadata: Metadata = {
  title: "Agent",
  description: "Draft, review, and schedule LinkedIn posts with the agent.",
};

export default function AgentPage() {
  const rail = getLandingRail();

  return (
    <SplitLandingWorkspace
      landing={{
        greeting: "How can I help with your LinkedIn content today?",
        dateLabel: formatFullDate(getNow()),
        timeline: getTimeline(),
        days: getUpcomingWeeks(),
        stats: rail.stats,
        chart: rail.chart,
        upNext: getUpNext(),
      }}
    />
  );
}
