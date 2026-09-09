import { AgentWorkspace } from "@/components/features/agent/agent-workspace";
import { formatFullDate } from "@/lib/format";
import { getNow } from "@/mocks/db";
import { getTimeline } from "@/services/agent";
import { getLandingRail } from "@/services/analytics";
import { getUpcomingWeeks, getUpNext } from "@/services/calendar";
import { getCurrentUser } from "@/services/workspace";

/**
 * The agent landing, second concept: a single centered column. The agent's
 * mark and greeting, the composer, three cards for what needs the user, and
 * the next two weeks underneath. Sending morphs into the same thread as
 * `/agent`.
 */
export default function LandingTwoPage() {
  const rail = getLandingRail();
  const [firstName] = getCurrentUser().name.split(" ");

  return (
    <AgentWorkspace
      landingLayout="centered"
      landing={{
        greeting: `Hi ${firstName ?? "there"}, what are we posting next?`,
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
