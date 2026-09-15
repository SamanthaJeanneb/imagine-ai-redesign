"use client";

import { cn } from "cn";
import { AnimatePresence, LayoutGroup } from "motion/react";
import { useState, type ReactNode } from "react";

import {
  ChatProvider,
  type PreviewData,
} from "@/components/features/agent/chat-provider";
import type { FileSection } from "@/components/features/files/file-tree";
import type { Skill } from "@/components/features/files/skills-list";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import { WorkspaceChatColumn } from "@/components/layout/workspace-chat-column";
import {
  useWorkspaceChrome,
  WorkspaceChromeProvider,
  WorkspaceNavSheet,
  WorkspacePageAsideSlot,
  WorkspaceScrim,
  WorkspaceSurface,
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
import type { SidebarThread } from "@/entities/agent";
import type { AccountUser } from "@/entities/workspace";
import { useResizable } from "@/lib/use-resizable";
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
        <WorkspaceFilesProvider>
          <WorkspaceChromeProvider>
            <WorkspaceEditorProvider documents={documents}>
              <WorkspaceFrame
                orgName={orgName}
                {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
                user={user}
                profiles={profiles}
                fileSections={fileSections}
                skills={skills}
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
  fileSections,
  skills: initialSkills,
  children,
}: {
  orgName: string;
  orgLogoUrl?: string;
  user: AccountUser;
  profiles: readonly ProfileSummary[];
  fileSections: readonly FileSection[];
  skills: readonly Skill[];
  children: ReactNode;
}) {
  const { docked } = useWorkspaceNav();
  const { isMobile, isCompact, chatOverlayOpen, setChatOverlayOpen } =
    useWorkspaceChrome();
  const { panelOpen, setFilesPanelOpen } = useWorkspaceFiles();
  const [skills, setSkills] = useState(initialSkills);
  // Held here rather than in the panel, so a reopened panel is the width it
  // was left at.
  const filesResize = useResizable({
    defaultWidth: 400,
    min: 264,
    max: 560,
    edge: "start",
  });
  // Too narrow to hold both, the chat comes over the page instead of beside
  // it, and the files panel follows it there.
  const chatOverlaid = docked && isCompact;
  const chatInFlow = docked && !isCompact;
  const panelsInFlow = !isCompact;
  const panelsOverlaid = isCompact && !docked;
  const header = <WorkspaceTopBar user={user} profiles={profiles} />;
  const page = <WorkspacePage>{children}</WorkspacePage>;
  const filesPanel = panelOpen ? (
    <WorkspaceFilesPanel
      key="files-panel"
      orgName={orgName}
      {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
      fileSections={fileSections}
      skills={skills}
      onSkillEnabledChange={(id, enabled) => {
        setSkills((current) =>
          current.map((skill) =>
            skill.id === id ? { ...skill, enabled } : skill,
          ),
        );
      }}
      resize={filesResize}
    />
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
        <WorkspaceSurface className="relative flex min-w-0 flex-1 flex-col rounded-none bg-imagine-surface shadow-raised md:rounded-l-surface">
          {/* One tree in both arrangements: flipping `docked` only moves the
              header and the side column with grid placement, so the page and
              the aside slot are never unmounted. */}
          <div className="relative grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)]">
            <div
              className={cn("min-w-0", docked ? "col-start-1" : "col-span-2")}
            >
              {header}
            </div>
            <div className="col-start-1 row-start-2 flex min-h-0 min-w-0 flex-col">
              {page}
            </div>
            <div
              className={cn(
                "col-start-2 flex min-h-0",
                docked ? "row-span-2 row-start-1" : "row-start-2",
              )}
            >
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
          </div>
          <WorkspaceScrim
            open={chatOverlaid && chatOverlayOpen}
            onOpenChange={setChatOverlayOpen}
            label="Chat"
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
          <WorkspaceScrim
            open={panelsOverlaid && filesPanel !== null}
            onOpenChange={setFilesPanelOpen}
            label="Files"
          >
            {filesPanel}
          </WorkspaceScrim>
        </WorkspaceSurface>
      </div>
    </LayoutGroup>
  );
}
