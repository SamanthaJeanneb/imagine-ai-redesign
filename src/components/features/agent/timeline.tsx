"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { fade, spring, stagger } from "@/styles/motion";

export interface TimelineAction {
  /** Sent to the agent as the intent when pressed. */
  intent: string;
  label: string;
  primary?: boolean;
}

export interface TimelineEntry {
  id: string;
  /** What the agent did, e.g. "Drafted", "Published", "Needs a decision". */
  kind: string;
  /** Relative or absolute, already formatted. */
  when: string;
  title: string;
  /** Optional body preview, e.g. the first lines of a draft. */
  excerpt?: string;
  actions: readonly TimelineAction[];
  /** Happened since the user was last here. */
  unread?: boolean;
}

interface TimelineProps {
  entries: readonly TimelineEntry[];
  onAction: (entry: TimelineEntry, action: TimelineAction) => void;
  className?: string;
}

/**
 * "While you were away". A hairline with dots; each entry is a title, its
 * actions, and an optional excerpt. Acting on an entry collapses it.
 */
export function Timeline({ entries, onAction, className }: TimelineProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ol
      data-slot="timeline"
      className={cn("relative flex flex-col", className)}
    >
      <span
        aria-hidden="true"
        className="absolute top-2 bottom-2 left-[3px] w-px bg-imagine-foreground-faint/40"
      />
      <AnimatePresence initial={false}>
        {entries.map((entry, index) => (
          <motion.li
            key={entry.id}
            layout
            initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { ...fade.base, delay: index * stagger.list },
            }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0, marginBottom: 0, y: -4 }
            }
            transition={spring.soft}
            className="mb-m flex gap-m overflow-hidden last:mb-0"
          >
            <span
              aria-hidden="true"
              className={cn(
                "mt-[15px] size-[7px] shrink-0 rounded-full",
                entry.unread
                  ? "bg-imagine-secondary ring-4 ring-imagine-secondary-soft"
                  : "bg-imagine-foreground-faint/60 ring-2 ring-imagine-surface",
              )}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-m py-xs">
              <div className="flex items-start justify-between gap-l">
                <div className="flex min-w-0 flex-col gap-xxs">
                  <span className="type-small text-imagine-foreground-muted">
                    {entry.kind}
                    <span className="text-imagine-foreground-faint"> · </span>
                    {entry.when}
                  </span>
                  <span className="type-body font-medium">{entry.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-xs">
                  {entry.actions.map((action) => (
                    <Button
                      key={action.intent}
                      size="sm"
                      variant={action.primary ? "default" : "soft"}
                      onClick={() => {
                        onAction(entry, action);
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
              {entry.excerpt ? (
                <p className="line-clamp-3 rounded-control bg-imagine-surface-raised/80 px-m py-s type-body text-imagine-foreground-muted">
                  {entry.excerpt}
                </p>
              ) : null}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
