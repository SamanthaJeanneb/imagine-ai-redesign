"use client";

import { cn } from "cn";
import {
  AnimatePresence,
  motion,
  stagger as staggerChildren,
  type Variants,
} from "motion/react";
import { useId, useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fade, spring, stagger } from "@/styles/motion";

export type SidebarNavKey = "agent" | "calendar" | "analytics" | "files";

export type SidebarHelpKey = "contact" | "terms" | "release-notes";

/** What the Help center opens up into, top to bottom. */
const HELP_ITEMS: readonly {
  key: SidebarHelpKey;
  label: string;
  icon: IconName;
}[] = [
  { key: "contact", label: "Contact us", icon: "envelope" },
  { key: "terms", label: "Terms and policies", icon: "file-lines" },
  { key: "release-notes", label: "Release notes", icon: "file-pen" },
];

/**
 * The Help center reveal. Opening, the clip springs up while the children are
 * staggered from the last item, the one nearest the hairline, so the menu
 * surfaces out of the line. Closing is one motion, not two: the clip and the
 * items sink together on the same ease-out (no spring, so nothing overshoots
 * past zero height and snaps), top item first, so the shrinking top edge
 * swallows each row as it drops.
 */
const HELP_MENU: Variants = {
  hidden: {
    height: 0,
    transition: {
      ...fade.base,
      delayChildren: staggerChildren(stagger.grid),
    },
  },
  show: {
    height: "auto",
    transition: {
      ...spring.soft,
      delayChildren: staggerChildren(stagger.list, { from: "last" }),
    },
  },
};

/** Full opacity throughout: the items float up out of the clip, nothing fades. */
const HELP_ITEM: Variants = {
  hidden: { y: 16, transition: fade.base },
  show: { y: 0, transition: spring.soft },
};

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
  /** Omitted on routes outside the nav, like settings, where nothing is selected. */
  active?: SidebarNavKey;
  threads: readonly SidebarThread[];
  /** Icon rail. Used while the files panel is open. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  activeThreadId?: string;
  onNavigate?: (key: SidebarNavKey) => void;
  onNewPost?: () => void;
  onOpenThread?: (id: string) => void;
  /** An item chosen from the Help center menu at the foot of the rail. */
  onHelp?: (key: SidebarHelpKey) => void;
  className?: string;
}

/**
 * Workspace sidebar. Fills the height of its parent on `imagine-background`;
 * the main surface beside it rounds its left corners (`rounded-l-surface`) so
 * the page rounds into the rail.
 * The selected row is a quiet rounded wash of the foreground, sliding with
 * `layoutId` when the selection moves. No accent bar, no pink fill.
 */
export function Sidebar({
  orgName,
  orgLogoUrl,
  active,
  threads,
  collapsed = false,
  onCollapsedChange,
  activeThreadId,
  onNavigate,
  onNewPost,
  onOpenThread,
  onHelp,
  className,
}: SidebarProps) {
  const indicatorId = useId();
  const threadIndicatorId = useId();

  const [helpOpen, setHelpOpen] = useState(false);
  const helpId = useId();

  const helpTrigger = (
    <button
      type="button"
      aria-expanded={helpOpen}
      aria-controls={helpId}
      onClick={() => {
        setHelpOpen((current) => !current);
      }}
      className={cn(
        "flex h-8 shrink-0 items-center gap-xs rounded-control text-left text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        helpOpen && "text-imagine-foreground",
        collapsed ? "w-8 justify-center" : "pr-s pl-xs",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon name="circle-info" size="s" active={helpOpen} />
      </span>
      {collapsed ? null : (
        <>
          <span className="flex-1 type-small font-medium">Help center</span>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: helpOpen ? 180 : 0 }}
            transition={spring.snappy}
            className="flex text-imagine-foreground-faint"
          >
            <Icon name="chevron-up" size="s" />
          </motion.span>
        </>
      )}
    </button>
  );

  /**
   * The items live in the rail, above the hairline. The hairline never moves:
   * it is the Help center row's top edge, and the items rise out of it. The
   * clip grows with a spring while the items float up inside it at full
   * opacity, nearest the line first (`stagger` from last), so the whole thing
   * reads as rising rather than fading in.
   */
  const helpMenu = (
    <AnimatePresence initial={false}>
      {helpOpen ? (
        <motion.div
          key="help"
          id={helpId}
          variants={HELP_MENU}
          initial="hidden"
          animate="show"
          exit="hidden"
          // Content pins to the bottom of the clip, so the item nearest the
          // line shows first and the rest emerge above it as the height grows.
          className={cn(
            "flex shrink-0 flex-col justify-end overflow-hidden",
            collapsed && "items-center",
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-px pt-s",
              collapsed && "items-center",
            )}
          >
            {/* The menu's own top edge. It rides up with the items and is the
                last thing to surface, so the group arrives capped. */}
            <motion.span
              aria-hidden="true"
              variants={HELP_ITEM}
              className={cn(
                "mb-s h-px shrink-0 self-stretch bg-imagine-foreground/12",
                collapsed ? "-mx-m" : "-mx-s",
              )}
            />
            {HELP_ITEMS.map((item) => {
              const row = (
                <motion.button
                  key={item.key}
                  type="button"
                  variants={HELP_ITEM}
                  onClick={() => {
                    setHelpOpen(false);
                    onHelp?.(item.key);
                  }}
                  className={cn(
                    "flex h-7 items-center gap-xs rounded-control text-left text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                    collapsed ? "w-8 justify-center" : "pr-s pl-xs",
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center">
                    <Icon name={item.icon} size="s" />
                  </span>
                  {collapsed ? null : (
                    <span className="type-small">{item.label}</span>
                  )}
                </motion.button>
              );

              if (!collapsed) return row;
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{row}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 56 : 224 }}
      transition={spring.soft}
      data-collapsed={collapsed || undefined}
      className={cn(
        "flex h-full shrink-0 flex-col overflow-x-hidden bg-imagine-background text-imagine-foreground",
        collapsed ? "items-center px-m py-m" : "px-s py-m",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-m", collapsed && "items-center")}>
        {/* Organization */}
        <div
          className={cn(
            "flex h-8 items-center gap-s",
            collapsed ? "justify-center" : "px-xs",
          )}
        >
          {orgLogoUrl ? (
            // Org logos are user uploads from arbitrary hosts; next/image needs a domain list.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgLogoUrl}
              alt=""
              className="size-6 shrink-0 rounded-control object-cover shadow-control"
            />
          ) : (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-control accent-gradient text-imagine-secondary-foreground">
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
                <span className="truncate type-small font-semibold">
                  {orgName}
                </span>
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
              <button
                type="button"
                aria-label="New chat"
                onClick={onNewPost}
                className="flex h-8 w-8 items-center justify-center rounded-control text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <Icon name="pen-to-square" size="s" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">New chat</TooltipContent>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={onNewPost}
            className="flex h-8 items-center gap-xs rounded-control pr-s pl-xs text-left text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              <Icon name="pen-to-square" size="s" />
            </span>
            <span className="type-small font-medium">New chat</span>
          </button>
        )}
      </div>

      {/* Primary navigation */}
      <nav
        aria-label="Workspace"
        className={cn("mt-l flex flex-col gap-px", collapsed && "items-center")}
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
                "group/nav relative flex h-8 items-center gap-xs rounded-control text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
                collapsed ? "w-8 justify-center" : "pr-s pl-xs",
                selected
                  ? "text-imagine-foreground"
                  : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
              )}
            >
              {selected ? (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-control bg-imagine-foreground/8"
                />
              ) : null}
              <span className="relative z-10 flex size-6 shrink-0 items-center justify-center">
                <Icon
                  name={item.icon}
                  size="s"
                  active={selected && item.key !== "agent"}
                />
              </span>
              {collapsed ? null : (
                <span
                  className={cn(
                    "relative z-10 type-small",
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

      {/* Recent chats. Collapsed keeps the spacer so the Help center stays pinned. */}
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
            key="chats"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade.base}
            className="mt-l flex min-h-0 flex-1 flex-col"
          >
            <div className="flex h-7 shrink-0 items-center px-xs">
              <span className="type-micro font-medium text-imagine-foreground-muted">
                Chats
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
                        "relative flex h-7 w-full items-center gap-xs rounded-control pr-s pl-xs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                        selected
                          ? "text-imagine-foreground"
                          : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
                      )}
                    >
                      {selected ? (
                        <motion.span
                          layoutId={threadIndicatorId}
                          aria-hidden="true"
                          transition={spring.snappy}
                          className="absolute inset-0 rounded-control bg-imagine-foreground/8"
                        />
                      ) : null}
                      <span className="relative z-10 flex size-6 shrink-0 items-center justify-center">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-1.5 rounded-full",
                            // Read is an outline; unread fills it pink.
                            thread.unread
                              ? "bg-imagine-secondary"
                              : "border border-imagine-foreground-faint/70",
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

      {/* Help center, pinned to the foot. Two hairlines: this one is the
          row's top edge and holds still; the menu carries its own above the
          items, so opening reads as a second line rising out of this one. */}
      {helpMenu}
      <span
        aria-hidden="true"
        className={cn(
          "mt-s mb-s h-px shrink-0 self-stretch bg-imagine-foreground/12",
          collapsed ? "-mx-m" : "-mx-s",
        )}
      />
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{helpTrigger}</TooltipTrigger>
          <TooltipContent side="right">Help center</TooltipContent>
        </Tooltip>
      ) : (
        helpTrigger
      )}
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
