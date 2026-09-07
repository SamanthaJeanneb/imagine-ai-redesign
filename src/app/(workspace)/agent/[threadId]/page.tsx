import { redirect } from "next/navigation";

import { AgentWorkspace } from "@/components/features/agent/agent-workspace";
import { getScriptedReply, getThread } from "@/services/agent";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const thread = getThread(threadId);

  // A conversation started in the browser is never stored, so its URL only
  // holds while the page is open. Reloading it starts over on the landing.
  if (thread === null) redirect("/agent");

  return (
    <AgentWorkspace
      replies={{
        default: getScriptedReply(),
        schedule: getScriptedReply("schedule"),
      }}
      messages={thread.messages}
    />
  );
}
