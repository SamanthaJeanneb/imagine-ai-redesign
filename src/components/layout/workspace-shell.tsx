"use client";

import { AnimatePresence, LayoutGroup } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import {
  Sidebar,
  SidebarExpandButton,
  type SidebarNavKey,
  type SidebarThread,
  type SidebarUser,
} from "@/components/layout/sidebar";

interface WorkspaceShellProps {
  orgName: string;
  orgLogoUrl?: string;
  threads: readonly SidebarThread[];
  user: SidebarUser;
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
 * The signed-in shell: rail on the background, page on a surface that rounds
 * into it. Everything lives in one `LayoutGroup` so shared `layoutId`s survive
 * a route change, which is what later lets the chat move between columns.
 */
export function WorkspaceShell({
  orgName,
  orgLogoUrl,
  threads,
  user,
  children,
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const activeKey = navKeyFor(pathname);
  const activeThreadId = threadIdFor(pathname);

  return (
    <LayoutGroup>
      <div className="flex h-dvh overflow-hidden bg-imagine-background">
        <Sidebar
          orgName={orgName}
          {...(orgLogoUrl === undefined ? {} : { orgLogoUrl })}
          {...(activeKey === undefined ? {} : { active: activeKey })}
          {...(activeThreadId === undefined ? {} : { activeThreadId })}
          threads={threads}
          user={user}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onNavigate={(key) => {
            router.push(`/${key}`);
          }}
          onNewPost={() => {
            router.push("/agent");
          }}
          onOpenThread={(id) => {
            router.push(`/agent/${id}`);
          }}
          onOpenUser={() => {
            router.push("/settings");
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col rounded-l-surface bg-imagine-surface shadow-raised">
          {/* Page header row. Holds the way out of the collapsed rail, and sets
              the top inset every page starts below. */}
          <div className="mt-xl flex h-10 shrink-0 items-center gap-s px-xl">
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
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </LayoutGroup>
  );
}
