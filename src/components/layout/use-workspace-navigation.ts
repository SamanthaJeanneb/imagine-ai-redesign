"use client";

import { useRouter } from "next/navigation";

import { useChat } from "@/components/features/agent/chat-provider";
import type { SidebarNavKey } from "@/components/layout/sidebar";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import { useWorkspaceFiles } from "@/components/layout/workspace-files";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";

/**
 * Going somewhere in the workspace, with what the last place left open put
 * away: a preview would follow the chat into its column, and the files panel
 * and the phone's nav sheet belong to where they were opened.
 */
export function useWorkspaceNavigation() {
  const router = useRouter();
  const chat = useChat();
  const { openThread } = useWorkspaceNav();
  const { setMobileNavOpen } = useWorkspaceChrome();
  const { setFilesPanelOpen } = useWorkspaceFiles();

  const goToSection = (key: SidebarNavKey) => {
    chat.setPreview(null);
    setFilesPanelOpen(false);
    setMobileNavOpen(false);
    router.push(`/${key}`);
  };

  // Opens as a conversation at once, so the rail lists it as "New chat" and
  // the header carries the name.
  const startNewChat = () => {
    chat.startNew();
    setFilesPanelOpen(false);
    setMobileNavOpen(false);
    router.push("/new-chat");
  };

  const showThread = (id: string) => {
    setMobileNavOpen(false);
    openThread(id);
  };

  return { goToSection, startNewChat, showThread };
}
