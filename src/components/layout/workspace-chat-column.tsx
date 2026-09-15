"use client";

import { useChat } from "@/components/features/agent/chat-provider";
import {
  CHAT_COLUMN_WIDTH,
  DockedChatColumn,
  OverlayChatColumn,
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

  // The phone's surface is the column; a narrow page keeps its own width.
  if (isMobile)
    return <OverlayChatColumn {...content} width="100%" onClose={close} />;
  if (isCompact)
    return (
      <OverlayChatColumn
        {...content}
        width={CHAT_COLUMN_WIDTH}
        onClose={close}
      />
    );
  return <DockedChatColumn {...content} className="max-xl:hidden" />;
}
