"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useId, type ReactNode } from "react";

import { Icon, type IconName } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

export interface EditorTab {
  id: string;
  label: string;
  icon?: IconName;
  dirty?: boolean;
}

interface EditorTabStripProps {
  /**
   * The tab the documents sit in front of — the thread, or the calendar. It
   * leads the strip and has no close control, because closing it would leave
   * the sheet with nothing behind it. Omitted by a strip of documents alone.
   */
  home?: EditorTab;
  /** The documents the user opened. Each closes; an empty list hides the strip. */
  tabs: readonly EditorTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose: (id: string) => void;
  /**
   * The page that sits behind the tabs. Shares the raised sheet. Wrap it in
   * `EditorSheetInset` when it needs the page inset above it; a page that
   * frames itself, like the calendar, renders it bare.
   */
  children?: ReactNode;
  className?: string;
}

/**
 * One tab: its name, and whatever the strip puts at its end. The end slot
 * keeps its room whether or not anything fills it, so a tab that cannot be
 * closed lines up with one that can.
 */
function Tab({
  label,
  icon,
  dirty = false,
  active,
  onActivate,
  children,
}: {
  label: string;
  icon?: IconName;
  dirty?: boolean;
  active: boolean;
  onActivate: () => void;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex h-8 items-center gap-s overflow-hidden pr-xs pl-m",
        active ? "text-imagine-foreground" : "text-imagine-foreground-muted",
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onActivate}
        className="flex min-h-8 min-w-0 flex-1 items-center gap-xs type-small font-medium whitespace-nowrap outline-none focus-visible:underline"
      >
        {icon === undefined ? null : (
          <Icon name={icon} size="s" aria-hidden="true" />
        )}
        {dirty ? (
          <span
            aria-label="Unsaved changes"
            className="size-1.5 rounded-full bg-imagine-secondary"
          />
        ) : null}
        <span className="truncate">{label}</span>
      </button>
      <span className="flex size-5">{children}</span>
    </div>
  );
}

/**
 * A tab in the strip: its own entrance, and the sheet-colored indicator that
 * slides between tabs as the active one changes. Whatever sits at its end —
 * a close control, or nothing on the home tab — arrives as a child.
 */
function TabItem({
  tab,
  active,
  indicatorId,
  activeId,
  onActivate,
  children,
}: {
  tab: EditorTab;
  active: boolean;
  indicatorId: string;
  activeId: string;
  onActivate: () => void;
  children?: ReactNode;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 2 }}
      transition={fade.fast}
      className="group/tab relative z-[1] max-w-56 shrink-0"
    >
      {active ? (
        <motion.span
          layoutId={indicatorId}
          layoutDependency={activeId}
          aria-hidden="true"
          transition={spring.snappy}
          className="pointer-events-none absolute inset-x-0 top-0 -bottom-px rounded-t-control border-x border-t border-imagine-border bg-imagine-surface"
        />
      ) : (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 bottom-px rounded-t-control transition-colors group-hover/tab:bg-imagine-surface-raised"
        />
      )}
      <Tab
        label={tab.label}
        {...(tab.icon === undefined ? {} : { icon: tab.icon })}
        {...(tab.dirty === undefined ? {} : { dirty: tab.dirty })}
        active={active}
        onActivate={onActivate}
      >
        {children}
      </Tab>
    </motion.div>
  );
}

/** Closes a tab the user opened. Omitted on the home tab, which has to stay. */
function TabCloseAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={`Close ${label}`}
      onClick={onPress}
      className="flex size-5 items-center justify-center rounded-xs text-imagine-foreground-faint transition-colors outline-none hover:bg-imagine-surface-raised hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <Icon name="xmark" size="s" />
    </button>
  );
}

/**
 * The strip that appears above the thread when a document opens: "Current
 * post" plus one tab per open file. Sits on the page background. The active
 * tab is the page color and joins the page with no line under its name;
 * side and top borders section it off from the neighbors. Closing
 * collapses the tab width.
 */
export function EditorTabStrip({
  home,
  tabs,
  activeId,
  onActivate,
  onClose,
  children,
  className,
}: EditorTabStripProps) {
  const indicatorId = useId();

  return (
    <div
      data-slot="editor-tab-strip"
      className={cn("flex flex-col", className)}
    >
      <AnimatePresence initial={false}>
        {tabs.length > 0 ? (
          <motion.div
            key="tab-strip"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 36, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={spring.settle}
            className="relative z-20 shrink-0 overflow-hidden"
          >
            {/* Tabs start past the page's corner radius so the active tab meets
                a flat edge. The rule sits behind the tabs; the open tab paints
                over it so its name is not underlined. */}
            <div
              role="tablist"
              className="relative flex h-9 min-w-0 items-end gap-xxs overflow-x-auto overflow-y-hidden pt-xs pr-xs pl-l"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-px bg-imagine-border"
              />
              <AnimatePresence initial={false}>
                {home === undefined ? null : (
                  <TabItem
                    key={home.id}
                    tab={home}
                    active={home.id === activeId}
                    indicatorId={indicatorId}
                    activeId={activeId}
                    onActivate={() => {
                      onActivate(home.id);
                    }}
                  />
                )}
                {tabs.map((tab) => (
                  <TabItem
                    key={tab.id}
                    tab={tab}
                    active={tab.id === activeId}
                    indicatorId={indicatorId}
                    activeId={activeId}
                    onActivate={() => {
                      onActivate(tab.id);
                    }}
                  >
                    <TabCloseAction
                      label={tab.label}
                      onPress={() => {
                        onClose(tab.id);
                      }}
                    />
                  </TabItem>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* The page. A flat top under the tabs so the open tab joins it with no
          line. Padding is in flow so the document title is not clipped.
          Omitted when the thread is showing, so an empty pane cannot cover it. */}
      {children == null ? null : (
        <div
          className={cn(
            "relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden bg-imagine-surface",
            tabs.length > 0 ? "rounded-b-panel" : "rounded-panel",
          )}
        >
          <motion.div
            key={activeId}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={fade.fast}
            className="flex min-h-0 flex-1 flex-col"
          >
            {children}
          </motion.div>
        </div>
      )}
    </div>
  );
}

/**
 * The page inset above a document in the sheet, so its title clears the
 * tabs. Documents want it; a page that frames itself does not.
 */
export function EditorSheetInset({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col pt-xl", className)}>
      {children}
    </div>
  );
}
