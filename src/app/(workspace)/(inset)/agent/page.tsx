import type { Metadata } from "next";

import { SplitLandingWorkspace } from "@/components/features/agent/agent-workspace";
import { getAgentLandingProps } from "@/services/agent";

export const metadata: Metadata = {
  title: "Agent",
  description: "Draft, review, and schedule LinkedIn posts with the agent.",
};

export default function AgentPage() {
  return (
    <SplitLandingWorkspace
      landing={{
        greeting: "How can I help with your LinkedIn content today?",
        ...getAgentLandingProps(),
      }}
    />
  );
}
