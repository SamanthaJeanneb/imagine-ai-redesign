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
}

export const SIDEBAR_NAV: readonly SidebarNavItem[] = [
  { key: "agent", label: "Agent", icon: "message" },
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "analytics", label: "Analytics", icon: "chart-simple" },
  { key: "files", label: "Files", icon: "folder" },
];

interface SidebarProps {
  orgName: string;
  /** The organization's mark. Falls back to the Imagine sparkle. */
  orgLogoUrl?: string;
  active: SidebarNavKey;
  threads: readonly SidebarThread[];
  user: SidebarUser;
  /** Icon rail. Used while the files panel is open. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
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
 * Workspace sidebar. Fills the height of its parent on `imagine-background`;
 * the main surface beside it rounds its left corners (`rounded-l-surface`) so
 * the page rounds into the rail.
 * The selected nav item has a light accent wash and a bar in the gutter, and
 * both slide together when the selection moves.
 */
export function Sidebar({
  orgName,
  orgLogoUrl,
  active,
  threads,
  user,
  collapsed = false,
  onCollapsedChange,
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
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={spring.soft}
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col overflow-x-hidden bg-imagine-background text-imagine-foreground",
        collapsed ? "items-center px-s py-xl" : "px-m py-xl",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-l", collapsed && "items-center")}>
        {/* Organization */}
        <div
          className={cn(
            "flex h-10 items-center gap-s",
            collapsed ? "justify-center" : "px-xs",
          )}
        >
          {orgLogoUrl ? (
            // Org logos are user uploads from arbitrary hosts; next/image needs a domain list.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogoUrl}
              alt=""
              className="size-8 shrink-0 rounded-control object-cover shadow-control"
            />
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-control accent-gradient text-imagine-secondary-foreground">
              <Icon name="sparkles" size="s" active />
            </span>
          )}
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
          {/* Only while expanded. Collapsed, the rail is icons alone and the
              page carries the control; see `SidebarExpandButton`. */}
          <AnimatePresence initial={false}>
            {onCollapsedChange && !collapsed ? (
              <motion.span
                key="collapse"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade.fast}
                className="ml-auto flex"
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Collapse sidebar"
                      onClick={() => {
                        onCollapsedChange(true);
                      }}
                      className="text-imagine-foreground-faint hover:text-imagine-foreground"
                    >
                      <Icon name="chevron-left" size="s" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Collapse</TooltipContent>
                </Tooltip>
              </motion.span>
            ) : null}
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
                <Icon
                  name={item.icon}
                  size="m"
                  active={selected && item.key !== "agent"}
                />
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

      {/* Recent posts. Collapsed keeps the spacer so the account stays pinned. */}
      <AnimatePresence initial={false} mode="popLayout">
        {collapsed ? (
          <motion.div
            key="spacer"
            className="flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade.fast}
          />
        ) : (
          <motion.div
            key="posts"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade.base}
            className="mt-xl flex min-h-0 flex-1 flex-col"
          >
            <div className="flex h-8 shrink-0 items-center px-s">
              <span className="type-micro font-medium text-imagine-foreground-muted">
                Posts
              </span>
            </div>
            <Stagger
              kind="list"
              className="flex min-h-0 flex-1 flex-col overflow-y-auto"
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
                        "relative flex h-7 w-full items-center gap-s rounded-control pr-s pl-xs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
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
          </motion.div>
        )}
      </AnimatePresence>

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
            <span className="min-w-0 flex-1 truncate type-small font-semibold">
              {user.name}
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

/**
 * The other half of the collapse control. While the rail is collapsed it holds
 * only icons, so the way back out lives on the page instead: render this in the
 * page's own header, where the chevron points at the rail it will reopen.
 */
export function SidebarExpandButton({
  onExpand,
  className,
}: {
  onExpand: () => void;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={spring.snappy}
      className={cn("flex", className)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Expand sidebar"
            aria-expanded={false}
            onClick={onExpand}
            className="text-imagine-foreground-faint hover:text-imagine-foreground"
          >
            <Icon name="chevron-right" size="s" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Expand</TooltipContent>
      </Tooltip>
    </motion.span>
  );
}
