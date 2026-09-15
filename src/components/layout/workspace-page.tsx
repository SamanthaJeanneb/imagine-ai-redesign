"use client";

import type { ReactNode } from "react";

import { PageAsideHostProvider } from "@/components/layout/page-aside";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import {
  useWorkspaceEditor,
  WorkspaceEditorLayer,
} from "@/components/layout/workspace-editor";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";
import {
  WorkspaceInsetPage,
  WorkspacePageFrame,
} from "@/components/layout/workspace-page-frame";

/** The route's page, in the frame that route asks for. */
export function WorkspacePage({ children }: { children: ReactNode }) {
  const { activeKey } = useWorkspaceNav();
  const { documentsOpen } = useWorkspaceEditor();
  const { asideHost } = useWorkspaceChrome();
  const overlay = documentsOpen ? { overlay: <WorkspaceEditorLayer /> } : {};
  const page = (
    <PageAsideHostProvider host={asideHost}>{children}</PageAsideHostProvider>
  );

  // Pane-based workspaces, files and the calendar, frame themselves.
  return activeKey === "files" || activeKey === "calendar" ? (
    <WorkspacePageFrame {...overlay}>{page}</WorkspacePageFrame>
  ) : (
    <WorkspaceInsetPage {...overlay}>{page}</WorkspaceInsetPage>
  );
}
