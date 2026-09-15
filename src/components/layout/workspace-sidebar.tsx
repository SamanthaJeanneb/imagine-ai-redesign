"use client";

import { useRouter } from "next/navigation";

import { useChat } from "@/components/features/agent/chat-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";

/** The workspace rail: the org, the nav, and the conversations under it. */
export function WorkspaceSidebar({
  orgName,
  orgLogoUrl,
}: {
  orgName: string;
  orgLogoUrl?: string;
}) {
  const router = useRouter();
  const chat = useChat();
  const { navActive, activeThreadId, visibleThreads, openThread } =
    useWorkspaceNav();
  const { isMobile, collapsed, setCollapsed, setMobileNavOpen } =
    useWorkspaceChrome();
  const { setPanel } = useWorkspaceFiles();

  return (
    <Sidebar
      orgName={orgName}
      {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
      {...(navActive === undefined ? {} : { active: navActive })}
      {...(activeThreadId === undefined ? {} : { activeThreadId })}
      threads={visibleThreads}
      collapsed={isMobile ? false : collapsed}
      onCollapsedChange={isMobile ? undefined : setCollapsed}
      onNavigate={(key) => {
        // A preview left open would follow the chat into its column.
        chat.setPreview(null);
        setPanel(null);
        setMobileNavOpen(false);
        router.push(`/${key}`);
      }}
      onNewPost={() => {
        // Opens as a conversation at once, so the rail lists it as
        // "New chat" and the header carries the name.
        chat.startNew();
        setPanel(null);
        setMobileNavOpen(false);
        router.push("/new-chat");
      }}
      onOpenThread={(id) => {
        setMobileNavOpen(false);
        openThread(id);
      }}
    />
  );
}
