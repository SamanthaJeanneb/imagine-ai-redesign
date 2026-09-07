import type { ReactNode } from "react";

import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { getThreads } from "@/services/agent";
import { getCurrentUser, getWorkspace } from "@/services/workspace";

/** Every signed-in screen. The shell owns the rail; pages fill the surface. */
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
    >
      {children}
    </WorkspaceShell>
  );
}
