"use client";

import { cn } from "cn";
import {
  AnimatePresence,
  motion,
  stagger as staggerChildren,
  type Transition,
  type Variants,
} from "motion/react";
import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

import { searchThreads } from "@/components/layout/chat-search";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { SearchBox } from "@/components/ui/search-box";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResizable } from "@/lib/use-resizable";
import { fade, spring, stagger } from "@/styles/motion";

/** The rail's width when open, and how far it can be dragged. */
const RAIL_WIDTH = { default: 224, min: 184, max: 360 } as const;
/** Left pad + icon + matching right pad. Labels collapse to zero width. */
const RAIL_COLLAPSED = 48;
const LABEL_MAX_WIDTH = 280;

interface SidebarRailContextValue {
  /** The rail is an icon strip. Width follows this immediately. */
  collapsed: boolean;
  /**
   * The collapse has finished. Icon-only chrome — tooltips, the chats section
   * standing down — waits for it, so it does not appear mid-spring.
   */
  iconsOnly: boolean;
  /** The rail's own spring, so labels and chevrons clip in step with it. */
  transition: Transition;
}

const SidebarRailContext = createContext<SidebarRailContextValue | null>(null);

function useSidebarRail(): SidebarRailContextValue {
  const rail = useContext(SidebarRailContext);
  if (rail === null) {
    throw new Error("Sidebar parts must render inside <Sidebar>.");
  }
  return rail;
}

/** Clips with the rail and fades as it collapses, so labels aren't covered. */
function SidebarLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { collapsed, transition } = useSidebarRail();
  const visible = !collapsed;
  return (
    <motion.span
      initial={false}
      animate={{
        opacity: visible ? 1 : 0,
        maxWidth: visible ? LABEL_MAX_WIDTH : 0,
      }}
      transition={transition}
      aria-hidden={visible ? undefined : true}
      className={cn(
        "min-w-0 overflow-hidden whitespace-nowrap",
        !visible && "pointer-events-none",
        className,
      )}
    >
      {children}
    </motion.span>
  );
}

/**
 * A rail row's name. It reads as a label while the rail is open; once the rail
 * is an icon strip the name has nowhere to sit, so it becomes the row's
 * tooltip instead.
 */
function SidebarRowTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { iconsOnly } = useSidebarRail();
  if (!iconsOnly) return children;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

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
  /** Message text, so search can match more than the title. */
  preview?: string;
}

export const SIDEBAR_NAV: readonly SidebarNavItem[] = [
  { key: "agent", label: "Agent", icon: "message" },
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "analytics", label: "Analytics", icon: "chart-simple" },
  { key: "files", label: "Files", icon: "folder" },
];

interface SidebarProps {
  orgName: string;
  /** The organization's mark. Falls back to the Imagine mark. */
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
  const resize = useResizable({
    defaultWidth: RAIL_WIDTH.default,
    min: RAIL_WIDTH.min,
    max: RAIL_WIDTH.max,
    edge: "end",
  });

  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const helpId = useId();
  // Width follows `collapsed` immediately. Labels stay mounted so they can
  // clip and fade with the rail; icon-only chrome (tooltips, no chats)
  // waits until the spring finishes.
  const [iconsOnly, setIconsOnly] = useState(collapsed);
  if (!collapsed && iconsOnly) {
    setIconsOnly(false);
  }
  if (collapsed && searchOpen) {
    setSearchOpen(false);
    setSearch("");
  }
  const targetWidth = collapsed ? RAIL_COLLAPSED : resize.width;
  const rail: SidebarRailContextValue = {
    collapsed,
    iconsOnly,
    transition: resize.transition,
  };

  const helpTrigger = (
    <button
      type="button"
      aria-expanded={helpOpen}
      aria-controls={helpId}
      onClick={() => {
        setHelpOpen((current) => !current);
      }}
      className={cn(
        "flex h-8 shrink-0 items-center rounded-control text-left text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        helpOpen && "text-imagine-foreground",
        "w-full overflow-hidden pr-s pl-xs",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon name="circle-info" size="s" active={helpOpen} />
      </span>
      <SidebarLabel className="flex-1 pl-xs type-small font-medium">
        Help center
      </SidebarLabel>
      <motion.span
        aria-hidden="true"
        animate={{
          rotate: helpOpen ? 180 : 0,
          opacity: collapsed ? 0 : 1,
          maxWidth: collapsed ? 0 : 24,
        }}
        transition={resize.transition}
        className="flex shrink-0 overflow-hidden text-imagine-foreground-faint"
      >
        <Icon name="chevron-up" size="s" />
      </motion.span>
    </button>
  );

  const newChatButton = (
    <button
      type="button"
      aria-label="New chat"
      onClick={onNewPost}
      className="flex h-8 w-full items-center overflow-hidden rounded-control pr-s pl-xs text-left text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon name="pen-to-square" size="s" />
      </span>
      <SidebarLabel className="pl-xs type-small font-medium">
        New chat
      </SidebarLabel>
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
          className="flex shrink-0 flex-col justify-end overflow-hidden"
        >
          <div className="flex flex-col gap-px pt-s">
            {/* The menu's own top edge. It rides up with the items and is the
                last thing to surface, so the group arrives capped. */}
            <motion.span
              aria-hidden="true"
              variants={HELP_ITEM}
              className="-mx-s mb-s h-px shrink-0 self-stretch bg-imagine-foreground/12"
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
                    "flex h-7 items-center rounded-control text-left text-imagine-foreground-muted transition-colors outline-none select-none hover:bg-imagine-foreground/5 hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
                    "w-full overflow-hidden pr-s pl-xs",
                  )}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center">
                    <Icon name={item.icon} size="s" />
                  </span>
                  <SidebarLabel className="pl-xs type-small">
                    {item.label}
                  </SidebarLabel>
                </motion.button>
              );

              return (
                <SidebarRowTooltip key={item.key} label={item.label}>
                  {row}
                </SidebarRowTooltip>
              );
            })}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  return (
    <SidebarRailContext.Provider value={rail}>
      <motion.aside
        initial={false}
        animate={{ width: targetWidth }}
        transition={resize.transition}
        onAnimationComplete={() => {
          if (resize.dragging) return;
          setIconsOnly(collapsed);
        }}
        data-collapsed={iconsOnly || undefined}
        className={cn(
          "relative h-full min-w-0 shrink-0 overflow-x-hidden bg-imagine-background text-imagine-foreground",
          className,
        )}
      >
        {collapsed ? null : (
          <ResizeHandle
            edge="end"
            binding={resize.handle}
            dragging={resize.dragging}
            label="Resize sidebar"
          />
        )}
        <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-x-hidden px-s py-m">
          <div className="flex flex-col gap-m">
            {/* Organization */}
            <div className="flex h-8 items-center overflow-hidden px-xs">
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
                  <Icon name="imagine" size="s" active />
                </span>
              )}
              <SidebarLabel className="flex-1 pl-s type-small font-semibold">
                {orgName}
              </SidebarLabel>
              {/* Only while expanded. Collapsed, the rail is icons alone and the
              page carries the control; see `SidebarExpandButton`. */}
              {onCollapsedChange && !iconsOnly ? (
                <motion.span
                  initial={false}
                  animate={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? 0 : 32,
                  }}
                  transition={resize.transition}
                  className="ml-auto flex shrink-0 overflow-hidden"
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
            </div>

            <SidebarRowTooltip label="New chat">
              {newChatButton}
            </SidebarRowTooltip>
          </div>

          {/* Primary navigation */}
          <nav aria-label="Workspace" className="mt-l flex flex-col gap-px">
            {SIDEBAR_NAV.map((item) => {
              const selected = item.key === active;
              const button = (
                <button
                  key={item.key}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  onClick={() => onNavigate?.(item.key)}
                  className={cn(
                    "group/nav relative flex h-8 w-full items-center overflow-hidden rounded-control pr-s pl-xs text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
                    selected
                      ? "text-imagine-foreground"
                      : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
                  )}
                >
                  {selected ? (
                    <motion.span
                      layoutId={indicatorId}
                      layoutDependency={item.key}
                      aria-hidden="true"
                      transition={spring.snappy}
                      className="absolute inset-0 rounded-control bg-imagine-foreground/8"
                    />
                  ) : null}
                  <span className="relative z-10 flex size-6 shrink-0 items-center justify-center">
                    <Icon
                      name={item.icon}
                      size="s"
                      active={
                        selected &&
                        item.key !== "agent" &&
                        item.key !== "analytics"
                      }
                    />
                  </span>
                  <SidebarLabel
                    className={cn(
                      "relative z-10 pl-xs type-small",
                      selected ? "font-semibold" : "font-medium",
                    )}
                  >
                    {item.label}
                  </SidebarLabel>
                </button>
              );

              return (
                <SidebarRowTooltip key={item.key} label={item.label}>
                  {button}
                </SidebarRowTooltip>
              );
            })}
          </nav>

          {/* Recent chats. Collapsed keeps the spacer so the Help center stays pinned. */}
          <AnimatePresence initial={false} mode="popLayout">
            {iconsOnly ? (
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
                initial={false}
                animate={{ opacity: collapsed ? 0 : 1 }}
                exit={{ opacity: 0 }}
                transition={resize.transition}
                className="group/chats mt-l flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div className="flex h-7 shrink-0 items-center overflow-hidden px-xs">
                  <SidebarLabel className="type-micro font-medium text-imagine-foreground-muted">
                    Chats
                  </SidebarLabel>
                  <Popover
                    open={searchOpen}
                    onOpenChange={(open) => {
                      setSearchOpen(open);
                      if (!open) setSearch("");
                    }}
                  >
                    <Tooltip open={searchOpen ? false : undefined}>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            aria-label="Search chats"
                            className={cn(
                              "ml-auto text-imagine-foreground-muted opacity-0 transition-opacity group-hover/chats:opacity-100 hover:text-imagine-foreground focus-visible:opacity-100",
                              searchOpen && "opacity-100",
                            )}
                          >
                            <Icon name="magnifying-glass" size="s" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">Search chats</TooltipContent>
                    </Tooltip>
                    <PopoverContent
                      align="start"
                      side="right"
                      sideOffset={8}
                      className="w-80 overflow-visible p-s"
                    >
                      <SearchBox
                        value={search}
                        onValueChange={setSearch}
                        results={searchThreads(threads, search)}
                        onSelect={(id) => {
                          onOpenThread?.(id);
                          setSearchOpen(false);
                          setSearch("");
                        }}
                        placeholder="Search chats"
                        emptyLabel={`No chats match “${search.trim()}”`}
                        listLabel="Chats"
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
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
                            "relative flex h-7 w-full items-center gap-xs overflow-hidden rounded-control pr-s pl-xs text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                            selected
                              ? "text-imagine-foreground"
                              : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
                          )}
                        >
                          {selected ? (
                            <motion.span
                              layoutId={threadIndicatorId}
                              layoutDependency={thread.id}
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
            className="-mx-s mt-s mb-s h-px shrink-0 self-stretch bg-imagine-foreground/12"
          />
          <SidebarRowTooltip label="Help center">
            {helpTrigger}
          </SidebarRowTooltip>
        </div>
      </motion.aside>
    </SidebarRailContext.Provider>
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
