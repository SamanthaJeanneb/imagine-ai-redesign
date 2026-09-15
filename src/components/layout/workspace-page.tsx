"use client";

import type { ReactNode } from "react";

import { PageAsideHostProvider } from "@/components/layout/page-aside";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import {
  useWorkspaceEditor,
  WorkspaceEditorLayer,
} from "@/components/layout/workspace-editor";

/**
 * What sits around whichever frame the route composes: the slot a page's own
 * sidebar portals into, and the file tabs and editor over the page. The
 * editor is positioned against this box rather than the frame, so the tab
 * strip covers the page whatever inset the route asked for.
 */
export function WorkspacePage({ children }: { children: ReactNode }) {
  const { documentsOpen } = useWorkspaceEditor();
  const { asideHost } = useWorkspaceChrome();

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {/* The overlay's tab strip; this spacer keeps the page from sliding
          under it. */}
      {documentsOpen ? (
        <>
          <div aria-hidden="true" className="h-9 shrink-0" />
          <WorkspaceEditorLayer />
        </>
      ) : null}
      <PageAsideHostProvider host={asideHost}>{children}</PageAsideHostProvider>
    </div>
  );
}
