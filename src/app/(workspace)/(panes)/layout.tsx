import type { ReactNode } from "react";

import { WorkspacePageFrame } from "@/components/layout/workspace-page-frame";

/** Pane-based workspaces, files and the calendar, inset themselves. */
export default function PanePagesLayout({ children }: { children: ReactNode }) {
  return <WorkspacePageFrame>{children}</WorkspacePageFrame>;
}
