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
  { key: "agent", label: "Agent", icon: "sparkles" },
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
 * Workspace sidebar. Sits on `imagine-background`; the main surface rounds
 * into it. Selection is one accent pill that slides between nav items.
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

  return (
    <motion.aside
      layout
      transition={spring.soft}
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col gap-xl bg-imagine-background py-l text-imagine-foreground",
        collapsed ? "w-14 items-center px-s" : "w-56 px-m",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-s",
          collapsed ? "justify-center" : "px-xs",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
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
              className="truncate type-body font-semibold"
            >
              {orgName}
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
        <Button className="w-full" onClick={onNewPost}>
          <Icon name="plus" data-icon="inline-start" />
          New post
        </Button>
      )}

      <nav aria-label="Workspace" className="flex flex-col gap-xxs">
        {SIDEBAR_NAV.map((item) => {
          const selected = item.key === active;
          const button = (
            <button
              key={item.key}
              type="button"
              aria-current={selected ? "page" : undefined}
              onClick={() => onNavigate?.(item.key)}
              className={cn(
                "group/nav relative flex h-9 items-center gap-m rounded-control px-s text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
                collapsed && "w-9 justify-center px-0",
                selected
                  ? "text-imagine-secondary"
                  : "text-imagine-foreground-muted hover:text-imagine-foreground",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-control bg-imagine-secondary-soft"
                />
              ) : null}
              <span className="relative z-10 flex w-4 justify-center">
                <Icon name={item.icon} size="l" active={selected} />
              </span>
              {collapsed ? null : (
                <span className="relative z-10 type-body font-medium">
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

      {collapsed ? null : (
        <div className="flex min-h-0 flex-1 flex-col gap-s">
          <span className="px-s type-small text-imagine-foreground-muted">
            Posts
          </span>
          <Stagger kind="list" className="flex flex-col gap-xxs">
            {threads.map((thread) => {
              const selected = thread.id === activeThreadId;
              return (
                <StaggerItem key={thread.id}>
                  <button
                    type="button"
                    onClick={() => onOpenThread?.(thread.id)}
                    className={cn(
                      "flex h-8 w-full items-center gap-m rounded-control px-s text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                      selected
                        ? "bg-imagine-surface text-imagine-foreground"
                        : "text-imagine-foreground-muted hover:text-imagine-foreground",
                    )}
                  >
                    <span className="flex w-4 justify-center">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-1.5 rounded-full",
                          thread.unread
                            ? "bg-imagine-secondary"
                            : "bg-imagine-foreground-faint",
                        )}
                      />
                    </span>
                    <span className="truncate type-small">{thread.title}</span>
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        </div>
      )}

      <button
        type="button"
        onClick={onOpenUser}
        className={cn(
          "mt-auto flex items-center gap-m rounded-control p-xs text-left transition-colors outline-none hover:bg-imagine-surface focus-visible:ring-2 focus-visible:ring-ring/40",
          collapsed && "justify-center",
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
            <span className="flex-1 truncate type-small font-medium">
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
