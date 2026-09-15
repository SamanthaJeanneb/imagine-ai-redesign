import type { ReactNode } from "react";

import { WorkspaceInsetPage } from "@/components/layout/workspace-page-frame";

/** Pages that read as a column on the surface: the agent, analytics, settings. */
export default function InsetPagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WorkspaceInsetPage>{children}</WorkspaceInsetPage>;
}
