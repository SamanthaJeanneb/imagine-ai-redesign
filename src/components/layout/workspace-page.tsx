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
  WorkspaceFlushPage,
  WorkspaceInsetPage,
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

  return activeKey === "files" || activeKey === "calendar" ? (
    <WorkspaceFlushPage {...overlay}>{page}</WorkspaceFlushPage>
  ) : (
    <WorkspaceInsetPage {...overlay}>{page}</WorkspaceInsetPage>
  );
}
