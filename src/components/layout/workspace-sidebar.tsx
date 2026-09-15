"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";
import { useWorkspaceNavigation } from "@/components/layout/use-workspace-navigation";

/** The workspace rail: the org, the nav, and the conversations under it. */
export function WorkspaceSidebar({
  orgName,
  orgLogoUrl,
}: {
  orgName: string;
  orgLogoUrl?: string;
}) {
  const { navActive, activeThreadId, visibleThreads } = useWorkspaceNav();
  const { isMobile, collapsed, setCollapsed } = useWorkspaceChrome();
  const { goToSection, startNewChat, showThread } = useWorkspaceNavigation();

  return (
    <Sidebar
      orgName={orgName}
      {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
      {...(navActive === undefined ? {} : { active: navActive })}
      {...(activeThreadId === undefined ? {} : { activeThreadId })}
      threads={visibleThreads}
      collapsed={isMobile ? false : collapsed}
      onCollapsedChange={isMobile ? undefined : setCollapsed}
      onNavigate={goToSection}
      onNewPost={startNewChat}
      onOpenThread={showThread}
    />
  );
}
