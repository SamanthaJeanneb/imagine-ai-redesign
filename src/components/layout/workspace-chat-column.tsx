"use client";

import { useChat } from "@/components/features/agent/chat-provider";
import {
  DockedChatColumn,
  OverlayChatColumn,
  SheetChatColumn,
} from "@/components/layout/chat-column";
import { useWorkspaceChrome } from "@/components/layout/workspace-chrome";
import { useWorkspaceNav } from "@/components/layout/workspace-nav";

/**
 * The conversation beside the calendar and analytics: a column of its own on
 * a frame wide enough, over the page on one that is not, and the whole
 * surface on a phone.
 */
export function WorkspaceChatColumn() {
  const chat = useChat();
  const { chatColumn, chatTitle, visibleThreads, openThread } =
    useWorkspaceNav();
  const { isMobile, isCompact, setChatOverlayOpen } = useWorkspaceChrome();
  if (chatColumn === undefined) return null;

  const content = {
    page: chatColumn,
    title: chatTitle ?? "New chat",
    threads: visibleThreads,
    currentThreadId: chat.threadId,
    onSelectThread: openThread,
  };
  const close = () => {
    setChatOverlayOpen(false);
  };

  if (isMobile) return <SheetChatColumn {...content} onClose={close} />;
  if (isCompact) return <OverlayChatColumn {...content} onClose={close} />;
  return <DockedChatColumn {...content} className="max-xl:hidden" />;
}
