"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fade, spring } from "@/styles/motion";

export type SidebarNavKey = "agent" | "calendar" | "analytics" | "files";

export interface SidebarNavItem {
  key: SidebarNavKey;
  label: string;
  icon: IconName;
}

export interface SidebarThread {
  id: string;
  title: string;
  /** Unread activity since the user last opened it. */
  unread?: boolean;
}

export interface SidebarUser {
  name: string;
  avatarUrl?: string;
  /** Second line under the name, e.g. the plan or role. */
  note?: string;
}

export const SIDEBAR_NAV: readonly SidebarNavItem[] = [
  { key: "agent", label: "Agent", icon: "comment" },
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "analytics", label: "Analytics", icon: "chart-simple" },
  { key: "files", label: "Files", icon: "folder" },
];

interface SidebarProps {
  orgName: string;
  active: SidebarNavKey;
  threads: readonly SidebarThread[];
  user: SidebarUser;
  /** Icon rail. Used while the files panel is open. */
  collapsed?: boolean;
  activeThreadId?: string;
  onNavigate?: (key: SidebarNavKey) => void;
  onNewPost?: () => void;
  onOpenThread?: (id: string) => void;
  onOpenUser?: () => void;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Workspace sidebar. Fills its parent on `imagine-background`; the main
 * surface rounds into it. The selected nav item carries a light accent wash
 * and a bar in the gutter; both slide together when the selection moves.
 */
export function Sidebar({
  orgName,
  active,
  threads,
  user,
  collapsed = false,
  activeThreadId,
  onNavigate,
  onNewPost,
  onOpenThread,
  onOpenUser,
  className,
}: SidebarProps) {
  const indicatorId = useId();
  const threadIndicatorId = useId();

  return (
    <motion.aside
      layout
      transition={spring.soft}
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col bg-imagine-background text-imagine-foreground",
        collapsed ? "w-16 items-center px-s py-xl" : "w-64 px-m py-xl",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col",
          collapsed ? "items-center gap-l" : "gap-l",
        )}
      >
        {/* Organization */}
        <div
          className={cn(
            "flex h-10 items-center gap-s",
            collapsed ? "justify-center" : "px-xs",
          )}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-control accent-gradient text-imagine-secondary-foreground">
            <Icon name="sparkles" size="s" active />
          </span>
          <AnimatePresence initial={false}>
            {collapsed ? null : (
              <motion.span
                key="org"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade.fast}
                className="flex min-w-0 flex-1 items-center gap-xs"
              >
                <span className="truncate type-heading">{orgName}</span>
                <Icon
                  name="chevron-down"
                  size="s"
                  className="text-imagine-foreground-faint"
                />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" aria-label="New post" onClick={onNewPost}>
                <Icon name="plus" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">New post</TooltipContent>
          </Tooltip>
        ) : (
          <Button className="w-full" size="lg" onClick={onNewPost}>
            <Icon name="plus" data-icon="inline-start" />
            New post
          </Button>
        )}
      </div>

      {/* Primary navigation */}
      <nav
        aria-label="Workspace"
        className={cn(
          "mt-xl flex flex-col gap-xxs",
          collapsed && "items-center",
        )}
      >
        {SIDEBAR_NAV.map((item) => {
          const selected = item.key === active;
          const button = (
            <button
              key={item.key}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => onNavigate?.(item.key)}
              className={cn(
                "group/nav relative flex h-10 items-center gap-s rounded-control text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
                collapsed ? "w-10 justify-center" : "pr-s pl-xs",
                selected
                  ? "text-imagine-foreground"
                  : "text-imagine-foreground-muted hover:bg-imagine-surface hover:text-imagine-foreground",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-control selection-gradient"
                >
                  <span
                    className={cn(
                      "absolute inset-y-2.5 w-0.5 rounded-full bg-imagine-secondary",
                      collapsed ? "-left-1.5" : "-left-2",
                    )}
                  />
                </motion.span>
              ) : null}
              <span
                className={cn(
                  "relative z-10 flex size-7 shrink-0 items-center justify-center",
                  selected && "text-imagine-secondary",
                )}
              >
                <Icon name={item.icon} size="m" active={selected} />
              </span>
              {collapsed ? null : (
                <span
                  className={cn(
                    "relative z-10 type-body",
                    selected ? "font-semibold" : "font-medium",
                  )}
                >
                  {item.label}
                </span>
              )}
            </button>
          );

          if (!collapsed) return button;
          return (
            <Tooltip key={item.key}>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Recent posts */}
      {collapsed ? (
        <div className="min-h-0 flex-1" />
      ) : (
        <div className="mt-xl flex min-h-0 flex-1 flex-col">
          <div className="flex h-8 shrink-0 items-center justify-between px-s">
            <span className="type-micro font-medium text-imagine-foreground-muted">
              Posts
            </span>
            <span className="type-micro text-imagine-foreground-faint tabular-nums">
              {threads.length}
            </span>
          </div>
          <Stagger
            kind="list"
            className="flex min-h-0 flex-1 flex-col gap-xxs overflow-y-auto"
          >
            {threads.map((thread) => {
              const selected = thread.id === activeThreadId;
              return (
                <StaggerItem key={thread.id}>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => onOpenThread?.(thread.id)}
                    className={cn(
                      "relative flex h-9 w-full items-center gap-s rounded-control pr-s pl-xs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      selected
                        ? "text-imagine-foreground"
                        : "text-imagine-foreground-muted hover:bg-imagine-surface hover:text-imagine-foreground",
                    )}
                  >
                    {selected ? (
                      <motion.span
                        layoutId={threadIndicatorId}
                        aria-hidden="true"
                        transition={spring.snappy}
                        className="absolute inset-0 rounded-control selection-gradient-soft"
                      />
                    ) : null}
                    <span className="relative z-10 flex size-7 shrink-0 items-center justify-center">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-1.5 rounded-full",
                          thread.unread
                            ? "bg-imagine-secondary ring-[3px] ring-imagine-secondary-soft"
                            : "bg-imagine-foreground-faint/70",
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "relative z-10 truncate type-small",
                        thread.unread && "font-medium",
                      )}
                    >
                      {thread.title}
                    </span>
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      )}

      {/* Account */}
      <button
        type="button"
        onClick={onOpenUser}
        className={cn(
          "mt-l flex items-center gap-s rounded-control text-left transition-colors outline-none hover:bg-imagine-surface focus-visible:ring-2 focus-visible:ring-ring/40",
          collapsed ? "size-10 justify-center" : "h-12 pr-s pl-xs",
        )}
      >
        <Avatar size="sm">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt={user.name} />
          ) : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        {collapsed ? null : (
          <>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate type-small font-semibold">
                {user.name}
              </span>
              {user.note ? (
                <span className="truncate type-small text-imagine-foreground-faint">
                  {user.note}
                </span>
              ) : null}
            </span>
            <Icon
              name="chevron-right"
              size="s"
              className="text-imagine-foreground-faint"
            />
          </>
        )}
      </button>
    </motion.aside>
  );
}
