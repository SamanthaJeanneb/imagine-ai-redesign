import type { Metadata } from "next";

import { CenteredLandingWorkspace } from "@/components/features/agent/agent-workspace";
import { getAgentLandingProps } from "@/services/agent";
import { getCurrentUser } from "@/services/workspace";

export const metadata: Metadata = {
  title: "New chat",
  description: "Start a conversation with the LinkedIn content agent.",
};

/**
 * A new chat: a single centered column. The agent's mark and greeting, the
 * composer, three cards for what needs the user, and the next two weeks
 * underneath. Sending morphs into the same thread as `/agent`.
 */
export default function NewChatPage() {
  const [firstName] = getCurrentUser().name.split(" ");

  return (
    <CenteredLandingWorkspace
      landing={{
        greeting: `Hi ${firstName ?? "there"}, what are we posting next?`,
        ...getAgentLandingProps(),
      }}
    />
  );
}
