"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";

import { Icon } from "@/components/ui/icon";
import { spring } from "@/styles/motion";

export interface EditorTab {
  id: string;
  label: string;
  /** Tabs the user opened can be closed; the thread tab cannot. */
  closable?: boolean;
  dirty?: boolean;
}

interface EditorTabStripProps {
  tabs: readonly EditorTab[];
  activeId: string;
  onActivate: (id: string) => void;
  onClose?: (id: string) => void;
  className?: string;
}

/**
 * The strip that appears above the thread when a document opens: "Current
 * post" plus one tab per open file. The active tab lifts to the surface
 * color with a shared indicator; closing collapses the tab width.
 */
export function EditorTabStrip({
  tabs,
  activeId,
  onActivate,
  onClose,
  className,
}: EditorTabStripProps) {
  const indicatorId = useId();

  return (
    <div
      role="tablist"
      data-slot="editor-tab-strip"
      className={cn(
        "flex items-end gap-xxs rounded-t-panel bg-imagine-surface-raised px-xs pt-xs",
        className,
      )}
    >
      <AnimatePresence initial={false}>
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={spring.soft}
              className="relative overflow-hidden"
            >
              {active ? (
                <motion.span
                  layoutId={indicatorId}
                  aria-hidden="true"
                  transition={spring.snappy}
                  className="absolute inset-0 rounded-t-control bg-imagine-surface shadow-control"
                />
              ) : null}
              <div
                className={cn(
                  "relative z-10 flex h-8 items-center gap-s pr-xs pl-m",
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
                  className="flex items-center gap-xs type-small font-medium whitespace-nowrap outline-none focus-visible:underline"
                >
                  {tab.dirty ? (
                    <span
                      aria-label="Unsaved changes"
                      className="size-1.5 rounded-full bg-imagine-secondary"
                    />
                  ) : null}
                  {tab.label}
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
  );
}
