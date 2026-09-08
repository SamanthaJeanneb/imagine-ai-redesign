import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getScriptedReply, getThreads } from "@/services/agent";
import { getLandingRail } from "@/services/analytics";
import { getUpcomingWeeks } from "@/services/calendar";
import { getCurrentUser, getWorkspace } from "@/services/workspace";

/**
 * Every signed-in screen. The shell owns the rail and the conversation; pages
 * fill the surface. The scripted replies and the preview data come from here
 * because the chat can be on any page.
 */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  const workspace = getWorkspace();

  return (
    <WorkspaceShell
      orgName={workspace.name}
      {...(workspace.logoUrl === undefined
        ? {}
        : { orgLogoUrl: workspace.logoUrl })}
      threads={getThreads()}
      user={getCurrentUser()}
      replies={{
        default: getScriptedReply(),
        schedule: getScriptedReply("schedule"),
      }}
      previews={{
        calendar: getUpcomingWeeks(),
        analytics: getLandingRail().chart,
      }}
    >
      {children}
    </WorkspaceShell>
  );
}
