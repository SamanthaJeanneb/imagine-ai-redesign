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
  /** Tabs the user opened can be closed; the thread tab cannot. */
  closable?: boolean;
  dirty?: boolean;
}

interface EditorTabStripProps {
  tabs: readonly EditorTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose?: (id: string) => void;
  /** The page that sits behind the tabs. Shares the raised sheet. */
  children?: ReactNode;
  className?: string;
}

/**
 * The strip that appears above the thread when a document opens: "Current
 * post" plus one tab per open file. Sits on the page background. The active
 * tab is the page color and joins the page with no seam; its drop shadow
 * sections it off from the neighbors. Closing collapses the tab width.
 */
export function EditorTabStrip({
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
            className="shrink-0 overflow-hidden"
          >
            {/* Tabs start past the page's corner radius so the active tab meets
                a flat edge. The active tab drops under the page to hide the seam. */}
            <div
              role="tablist"
              className="flex h-9 min-w-0 items-end gap-xxs overflow-x-auto overflow-y-hidden border-b border-imagine-border pt-xs pr-xs pl-l"
            >
              <AnimatePresence initial={false}>
                {tabs.map((tab) => {
                  const active = tab.id === activeId;
                  return (
                    <motion.div
                      key={tab.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 2 }}
                      transition={fade.fast}
                      className="group/tab relative -mb-px max-w-56 shrink-0"
                    >
                      {active ? (
                        <motion.span
                          layoutId={indicatorId}
                          aria-hidden="true"
                          transition={spring.snappy}
                          className="absolute inset-0 rounded-t-control bg-imagine-surface shadow-floating ring-1 ring-imagine-border"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 bottom-px rounded-t-control transition-colors group-hover/tab:bg-imagine-surface-raised"
                        />
                      )}
                      <div
                        className={cn(
                          "relative z-10 flex h-8 items-center gap-s overflow-hidden pr-xs pl-m",
                          active
                            ? "text-imagine-foreground"
                            : "text-imagine-foreground-muted",
                        )}
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => {
                            onActivate(tab.id);
                          }}
                          className="flex min-w-0 items-center gap-xs type-small font-medium whitespace-nowrap outline-none focus-visible:underline"
                        >
                          {tab.icon === undefined ? null : (
                            <Icon name={tab.icon} size="s" aria-hidden="true" />
                          )}
                          {tab.dirty ? (
                            <span
                              aria-label="Unsaved changes"
                              className="size-1.5 rounded-full bg-imagine-secondary"
                            />
                          ) : null}
                          <span className="truncate">{tab.label}</span>
                        </button>
                        {tab.closable && onClose ? (
                          <button
                            type="button"
                            aria-label={`Close ${tab.label}`}
                            onClick={() => {
                              onClose(tab.id);
                            }}
                            className="flex size-5 items-center justify-center rounded-xs text-imagine-foreground-faint transition-colors outline-none hover:bg-imagine-surface-raised hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <Icon name="xmark" size="s" />
                          </button>
                        ) : (
                          <span className="size-5" aria-hidden="true" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* The page. Sits above the tabs so it covers the active tab's bottom
          shadow, leaving the shadow on its sides and top. */}
      <div className="relative z-10 min-h-0 flex-1 overflow-hidden rounded-panel bg-imagine-surface">
        <motion.div
          key={activeId}
          initial={{
            opacity: 0,
            x: activeId === "calendar" ? -6 : 8,
          }}
          animate={{ opacity: 1, x: 0 }}
          transition={fade.fast}
          className="absolute inset-0 flex min-h-0"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
