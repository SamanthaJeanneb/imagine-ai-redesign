import { AgentWorkspace } from "@/components/features/agent/agent-workspace";
import { formatFullDate } from "@/lib/format";
import { getNow } from "@/mocks/db";
import { getScriptedReply, getTimeline } from "@/services/agent";
import { getLandingRail } from "@/services/analytics";
import { getUpcomingWeeks, getUpNext } from "@/services/calendar";

export default function AgentPage() {
  const rail = getLandingRail();

  return (
    <AgentWorkspace
      replies={{
        default: getScriptedReply(),
        schedule: getScriptedReply("schedule"),
      }}
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
