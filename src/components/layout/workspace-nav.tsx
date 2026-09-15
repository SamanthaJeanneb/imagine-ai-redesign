"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, type ReactNode, useContext } from "react";

import {
  NEW_THREAD_ID,
  useChat,
} from "@/components/features/agent/chat-provider";
import type { ComposerPreview } from "@/components/features/agent/composer";
import type { SidebarNavKey } from "@/components/layout/sidebar";
import {
  chatColumnFor,
  navKeyFor,
  threadIdFor,
  titleFrom,
} from "@/components/layout/workspace-routes";
import type { SidebarThread } from "@/entities/agent";

interface WorkspaceNavState {
  /** The page the route is on, for the rail and the page frame. */
  activeKey: SidebarNavKey | undefined;
  /** What the rail highlights, which the new chat takes over. */
  navActive: SidebarNavKey | undefined;
  /** The rail's rows, with the unstored new chat among them. */
  visibleThreads: readonly SidebarThread[];
  activeThreadId: string | undefined;
  /** The page the chat shares a row with, where it has one. */
  chatColumn: ComposerPreview | undefined;
  docked: boolean;
  /** A conversation is open on its own page, so the header belongs to it. */
  chatOpen: boolean;
  chatTitle: string | undefined;
  openThread: (id: string) => void;
}

const WorkspaceNavContext = createContext<WorkspaceNavState | null>(null);

export function useWorkspaceNav(): WorkspaceNavState {
  const context = useContext(WorkspaceNavContext);
  if (context === null) {
    throw new Error("useWorkspaceNav must be used inside WorkspaceNavProvider");
  }
  return context;
}

/**
 * Where the route and the open conversation meet: which page the rail is on,
 * which threads it lists, and whether the chat has a page or a column. The
 * conversation outlives the route, so this is derived on every render rather
 * than stored.
 */
export function WorkspaceNavProvider({
  threads,
  children,
}: {
  threads: readonly SidebarThread[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const chat = useChat();
  const activeKey = navKeyFor(pathname);
  // A conversation started here is not stored, so the rail would not know it.
  // It gets a row of its own, named "New chat" until the first message.
  const newThreadTitle =
    chat.threadId === NEW_THREAD_ID
      ? (titleFrom(chat.messages) ?? "New chat")
      : undefined;
  const visibleThreads: readonly SidebarThread[] =
    newThreadTitle === undefined
      ? threads
      : [{ id: NEW_THREAD_ID, title: newThreadTitle }, ...threads];
  const activeThreadId =
    activeKey === "agent" && newThreadTitle !== undefined
      ? NEW_THREAD_ID
      : threadIdFor(pathname);
  // The rail highlights one thing. With the new chat selected under Chats,
  // Agent above it stays quiet; `activeKey` still drives the page itself.
  const navActive = activeThreadId === NEW_THREAD_ID ? undefined : activeKey;
  const chatColumn = chatColumnFor(pathname);
  const docked = chatColumn !== undefined;
  const chatOpen = activeKey === "agent" && chat.threadId !== null;
  const chatTitle =
    chat.threadId !== null
      ? (threads.find((thread) => thread.id === chat.threadId)?.title ??
        titleFrom(chat.messages) ??
        "New chat")
      : docked
        ? "New chat"
        : undefined;

  /**
   * Show a thread from the rail or the title's history. The new one has no
   * page of its own: empty, it is the landing; with messages, the thread on
   * `/agent`, whose URL then settles on its own.
   */
  function openThread(id: string) {
    chat.setPreview(null);
    if (id !== NEW_THREAD_ID) {
      router.push(`/agent/${id}`);
      return;
    }
    if (activeKey === "agent") return;
    router.push(chat.messages.length === 0 ? "/new-chat" : "/agent");
  }

  return (
    <WorkspaceNavContext
      value={{
        activeKey,
        navActive,
        visibleThreads,
        activeThreadId,
        chatColumn,
        docked,
        chatOpen,
        chatTitle,
        openThread,
      }}
    >
      {children}
    </WorkspaceNavContext>
  );
}
