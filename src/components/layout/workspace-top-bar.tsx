"use client";

import { cn } from "cn";
import { AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useChat } from "@/components/features/agent/chat-provider";
import {
  ProfileSelector,
  ProfileSelectorLabel,
  ProfileSelectorPrefix,
} from "@/components/features/agent/profile-selector";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import {
  AccountControls,
  AccountName,
  type AccountUser,
} from "@/components/layout/account";
import {
  ChatControls,
  ChatHistoryMenu,
  ChatTitle,
} from "@/components/layout/chat-controls";
import { SidebarExpandButton } from "@/components/layout/sidebar";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import {
  ChatOverlayToggle,
  MobileNavButton,
  WorkspaceHeaderBar,
  WorkspaceHeaderEnd,
  WorkspaceHeaderTitle,
} from "@/components/layout/workspace-header";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";

/**
 * The header row above the page. On the agent page with a conversation open
 * the header belongs to the thread: its name in the middle, its controls on
 * the right. Beside the calendar and analytics the chat takes the right side
 * instead, so the page header keeps the account and drops "Posting as".
 */
export function WorkspaceTopBar({
  user,
  profiles,
}: {
  user: AccountUser;
  /** The LinkedIn identities the agent can work across. */
  profiles: readonly ProfileSummary[];
}) {
  const router = useRouter();
  const chat = useChat();
  const { visibleThreads, chatOpen, chatTitle, docked, openThread } =
    useWorkspaceNav();
  const {
    isMobile,
    collapsed,
    setCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    chatOverlayOpen,
    setChatOverlayOpen,
  } = useWorkspaceChrome();
  const { panel, setPanel } = useWorkspaceFiles();
  // Everyone still connected, to start. Disconnected profiles need connecting
  // before the agent can post as them, so they wait to be chosen on purpose.
  const [selectedProfileIds, setSelectedProfileIds] = useState<
    readonly string[]
  >(() =>
    profiles
      .filter((profile) => profile.status === "connected")
      .map((profile) => profile.id),
  );
  const compactProfiles = chatOpen || isMobile;
  const showPostingAs = !docked && !isMobile;

  return (
    <WorkspaceHeaderBar>
      <MobileNavButton
        open={mobileNavOpen}
        onClick={() => {
          setMobileNavOpen(true);
          setChatOverlayOpen(false);
        }}
      />
      <AnimatePresence initial={false}>
        {collapsed ? (
          <SidebarExpandButton
            key="expand"
            onExpand={() => {
              setCollapsed(false);
            }}
            // Optically aligns the chevron with the page's text column.
            className="-ml-2.5 hidden md:flex"
          />
        ) : null}
      </AnimatePresence>
      {profiles.length > 0 ? (
        <ProfileSelector
          profiles={profiles}
          selectedIds={selectedProfileIds}
          onSelectedIdsChange={setSelectedProfileIds}
          // First in the row, the faces sit on the page's text column;
          // after the expand chevron they take the row's gap instead.
          className={cn("min-w-0", !collapsed && "-ml-1.5")}
        >
          {/* With a conversation open the faces stand alone and its name
              follows them. Beside the calendar and analytics the chat has
              its own column, so the header drops "Posting as". */}
          {compactProfiles ? null : (
            <ProfileSelectorLabel key="label">
              {showPostingAs ? <ProfileSelectorPrefix key="prefix" /> : null}
            </ProfileSelectorLabel>
          )}
        </ProfileSelector>
      ) : null}
      <AnimatePresence initial={false}>
        {chatOpen && chatTitle !== undefined ? (
          <WorkspaceHeaderTitle key="title">
            <ChatTitle title={chatTitle}>
              <ChatHistoryMenu
                title={chatTitle}
                threads={visibleThreads}
                currentThreadId={chat.threadId}
                onSelectThread={openThread}
              />
            </ChatTitle>
          </WorkspaceHeaderTitle>
        ) : null}
      </AnimatePresence>
      <AnimatePresence initial={false} mode="wait">
        {chatOpen ? (
          <WorkspaceHeaderEnd key="chat">
            <ChatControls panel={panel} onPanelChange={setPanel} />
          </WorkspaceHeaderEnd>
        ) : (
          <WorkspaceHeaderEnd key="account" className="items-center gap-xxs">
            {docked ? (
              <ChatOverlayToggle
                open={chatOverlayOpen}
                onOpenChange={(open) => {
                  setChatOverlayOpen(open);
                  if (open) setMobileNavOpen(false);
                }}
              />
            ) : null}
            <AccountControls
              user={user}
              onOpenSettings={() => {
                router.push("/settings");
              }}
              onSignOut={() => {
                // The mock has no session to end; leaving lands on sign-in.
                router.push("/sign-in");
              }}
            >
              {compactProfiles ? null : <AccountName />}
            </AccountControls>
          </WorkspaceHeaderEnd>
        )}
      </AnimatePresence>
    </WorkspaceHeaderBar>
  );
}
