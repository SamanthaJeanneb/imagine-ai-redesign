"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import { type ReactNode } from "react";

import {
  ChatProvider,
  type PreviewData,
} from "@/components/features/agent/chat-provider";
import type { FileSection } from "@/components/features/files/file-tree";
import type { Skill } from "@/components/features/files/skills-list";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import type { AccountUser } from "@/components/layout/account";
import type { SidebarThread } from "@/components/layout/sidebar";
import { WorkspaceChatColumn } from "@/components/layout/workspace-chat-column";
import {
  useWorkspaceChrome,
  WorkspaceChromeProvider,
  WorkspaceNavSheet,
  WorkspacePageAsideSlot,
  WorkspaceScrim,
} from "@/components/layout/workspace-chrome";
import { WorkspaceEditorProvider } from "@/components/layout/workspace-editor";
import {
  useWorkspaceFiles,
  WorkspaceFilesProvider,
} from "@/components/layout/workspace-files";
import { WorkspaceFilesPanel } from "@/components/layout/workspace-files-panel";
import {
  useWorkspaceNav,
  WorkspaceNavProvider,
} from "@/components/layout/workspace-nav";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { WorkspaceSidebar } from "@/components/layout/workspace-sidebar";
import { WorkspaceTopBar } from "@/components/layout/workspace-top-bar";
import type { ReplyIntent, ScriptedReply } from "@/services/agent";
import type { OpenDocument } from "@/services/files";

interface WorkspaceShellProps {
  orgName: string;
  orgLogoUrl?: string;
  threads: readonly SidebarThread[];
  user: AccountUser;
  /** The LinkedIn identities the agent can work across. */
  profiles: readonly ProfileSummary[];
  /** Files available to the thread's right panel. */
  fileSections: readonly FileSection[];
  /** Skills appear beside files and open as editable markdown. */
  skills: readonly Skill[];
  /** Every workspace and skill document the editor can open. */
  documents: readonly OpenDocument[];
  /** The agent's scripted answers, for the conversation the shell owns. */
  replies: Record<ReplyIntent, ScriptedReply>;
  /** What the composer's Calendar and Analytics chips open. */
  previews: PreviewData;
  children: ReactNode;
}

/**
 * The signed-in shell: rail on the background, page on a surface that rounds
 * into it. Everything lives in one `LayoutGroup` so shared `layoutId`s survive
 * a route change, which is what lets the chat move between columns. The
 * conversation is owned here, above the pages, for the same reason.
 */
export function WorkspaceShell({
  orgName,
  orgLogoUrl,
  threads,
  user,
  profiles,
  fileSections,
  skills,
  documents,
  replies,
  previews,
  children,
}: WorkspaceShellProps) {
  return (
    <ChatProvider replies={replies} previews={previews}>
      <WorkspaceNavProvider threads={threads}>
        <WorkspaceFilesProvider
          orgName={orgName}
          {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
          fileSections={fileSections}
          skills={skills}
        >
          <WorkspaceChromeProvider>
            <WorkspaceEditorProvider documents={documents}>
              <WorkspaceFrame
                orgName={orgName}
                {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
                user={user}
                profiles={profiles}
              >
                {children}
              </WorkspaceFrame>
            </WorkspaceEditorProvider>
          </WorkspaceChromeProvider>
        </WorkspaceFilesProvider>
      </WorkspaceNavProvider>
    </ChatProvider>
  );
}

function WorkspaceFrame({
  orgName,
  orgLogoUrl,
  user,
  profiles,
  children,
}: {
  orgName: string;
  orgLogoUrl?: string;
  user: AccountUser;
  profiles: readonly ProfileSummary[];
  children: ReactNode;
}) {
  const { docked } = useWorkspaceNav();
  const { isMobile, isCompact, chatOverlayOpen, setChatOverlayOpen } =
    useWorkspaceChrome();
  const { panelOpen, setPanel } = useWorkspaceFiles();
  // Too narrow to hold both, the chat comes over the page instead of beside
  // it, and the files panel follows it there.
  const chatOverlaid = docked && isCompact;
  const chatInFlow = docked && !chatOverlaid;
  const panelsInFlow = !isCompact;
  const panelsOverlaid = isCompact && !chatOverlaid;
  const header = <WorkspaceTopBar user={user} profiles={profiles} />;
  const page = <WorkspacePage>{children}</WorkspacePage>;
  const filesPanel = panelOpen ? (
    <WorkspaceFilesPanel key="files-panel" />
  ) : null;

  return (
    <LayoutGroup>
      <div className="flex h-dvh overflow-hidden bg-imagine-background">
        <WorkspaceNavSheet>
          <WorkspaceSidebar
            orgName={orgName}
            {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
          />
        </WorkspaceNavSheet>
        <div className="relative flex min-w-0 flex-1 flex-col rounded-none bg-imagine-surface shadow-raised md:rounded-l-surface">
          {docked ? (
            <div className="flex min-h-0 min-w-0 flex-1">
              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {header}
                {page}
              </div>
              <WorkspacePageAsideSlot />
              {chatInFlow ? (
                <AnimatePresence initial={false}>
                  <WorkspaceChatColumn key="chat" />
                </AnimatePresence>
              ) : null}
              {panelsInFlow ? (
                <AnimatePresence initial={false}>{filesPanel}</AnimatePresence>
              ) : null}
            </div>
          ) : (
            <>
              {header}
              <div className="relative flex min-h-0 min-w-0 flex-1">
                {page}
                <WorkspacePageAsideSlot />
                {chatInFlow ? (
                  <AnimatePresence initial={false}>
                    <WorkspaceChatColumn key="chat" />
                  </AnimatePresence>
                ) : null}
                {panelsInFlow ? (
                  <AnimatePresence initial={false}>
                    {filesPanel}
                  </AnimatePresence>
                ) : null}
              </div>
            </>
          )}
          <AnimatePresence initial={false}>
            {chatOverlaid && chatOverlayOpen ? (
              <WorkspaceScrim
                key="chat-overlay"
                onDismiss={() => {
                  setChatOverlayOpen(false);
                }}
              >
                {isMobile && filesPanel !== null ? (
                  filesPanel
                ) : (
                  <>
                    <WorkspaceChatColumn key="chat" />
                    {filesPanel}
                  </>
                )}
              </WorkspaceScrim>
            ) : null}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {panelsOverlaid && filesPanel !== null ? (
              <WorkspaceScrim
                key="panel-overlay"
                onDismiss={() => {
                  setPanel(null);
                }}
              >
                {filesPanel}
              </WorkspaceScrim>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </LayoutGroup>
  );
}
