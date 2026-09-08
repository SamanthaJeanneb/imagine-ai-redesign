"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import {
  ChatProvider,
  type PreviewData,
  useChat,
} from "@/components/features/agent/chat-provider";
import type { ComposerPreview } from "@/components/features/agent/composer";
import { AccountControls, type AccountUser } from "@/components/layout/account";
import { ChatColumn } from "@/components/layout/chat-column";
import {
  Sidebar,
  SidebarExpandButton,
  type SidebarNavKey,
  type SidebarThread,
} from "@/components/layout/sidebar";
import type { ScriptedReply } from "@/services/agent";

interface WorkspaceShellProps {
  orgName: string;
  orgLogoUrl?: string;
  threads: readonly SidebarThread[];
  user: AccountUser;
  /** The agent's scripted answers, for the conversation the shell owns. */
  replies: { default: ScriptedReply; schedule: ScriptedReply };
  /** What the composer's Calendar and Analytics chips open. */
  previews: PreviewData;
  children: ReactNode;
}

const NAV_KEYS: readonly SidebarNavKey[] = [
  "agent",
  "calendar",
  "analytics",
  "files",
];

/** `/calendar` and `/agent/t1` both resolve to their nav item; `/settings` to none. */
function navKeyFor(pathname: string): SidebarNavKey | undefined {
  // The alternate agent landing is still the agent.
  if (pathname === "/landing-2") return "agent";
  return NAV_KEYS.find(
    (key) => pathname === `/${key}` || pathname.startsWith(`/${key}/`),
  );
}

/** `/agent/t1` → `t1`. */
function threadIdFor(pathname: string): string | undefined {
  const [, base, threadId] = pathname.split("/");
  return base === "agent" ? threadId : undefined;
}

/**
 * Where the chat goes. It fills the page on `/agent`; beside the calendar and
 * analytics it is a column on the right; everywhere else it is put away.
 */
function chatColumnFor(pathname: string): ComposerPreview | undefined {
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/analytics")) return "analytics";
  return undefined;
}

/**
 * The signed-in shell: rail on the background, page on a surface that rounds
 * into it. Everything lives in one `LayoutGroup` so shared `layoutId`s survive
 * a route change, which is what lets the chat move between columns. The
 * conversation is owned here, above the pages, for the same reason.
 */
export function WorkspaceShell({
  replies,
  previews,
  children,
  ...frame
}: WorkspaceShellProps) {
  return (
    <ChatProvider replies={replies} previews={previews}>
      <WorkspaceFrame {...frame}>{children}</WorkspaceFrame>
    </ChatProvider>
  );
}

function WorkspaceFrame({
  orgName,
  orgLogoUrl,
  threads,
  user,
  children,
}: Omit<WorkspaceShellProps, "replies" | "previews">) {
  const pathname = usePathname();
  const router = useRouter();
  const chat = useChat();
  const [collapsed, setCollapsed] = useState(false);
  const activeKey = navKeyFor(pathname);
  const activeThreadId = threadIdFor(pathname);
  const chatColumn = chatColumnFor(pathname);

  return (
    <LayoutGroup>
      <div className="flex h-dvh overflow-hidden bg-imagine-background">
        <Sidebar
          orgName={orgName}
          {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
          {...(activeKey === undefined ? {} : { active: activeKey })}
          {...(activeThreadId === undefined ? {} : { activeThreadId })}
          threads={threads}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onNavigate={(key) => {
            // A preview left open would follow the chat into its column.
            chat.setPreview(null);
            router.push(`/${key}`);
          }}
          onNewPost={() => {
            chat.reset();
            router.push("/agent");
          }}
          onOpenThread={(id) => {
            chat.setPreview(null);
            router.push(`/agent/${id}`);
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col rounded-l-surface bg-imagine-surface shadow-raised">
          {/* Page header row. The way out of the collapsed rail on the left,
              the account on the right; sets the top inset every page starts
              below. */}
          <div className="mt-m mb-xxl flex h-8 shrink-0 items-center gap-s px-xxl">
            <AnimatePresence initial={false}>
              {collapsed ? (
                <SidebarExpandButton
                  key="expand"
                  onExpand={() => {
                    setCollapsed(false);
                  }}
                  // Optically aligns the chevron with the page's text column.
                  className="-ml-2.5"
                />
              ) : null}
            </AnimatePresence>
            <AccountControls
              user={user}
              // The gear's glyph, not its hit area, sits on the page's right edge.
              className="-mr-s ml-auto"
              onOpenAccount={() => {
                router.push("/settings");
              }}
              onOpenSettings={() => {
                router.push("/settings");
              }}
            />
          </div>
          <div className="flex min-h-0 flex-1">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
              {children}
            </div>
            <AnimatePresence initial={false}>
              {chatColumn === undefined ? null : (
                <ChatColumn key="chat" page={chatColumn} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
