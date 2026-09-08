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
  /** What the press says on the user's behalf, opening a thread with it. */
  prompt?: string;
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
      {/* Starts at the first dot's centre so the rail reads as strung
          between the dots rather than passing behind them. */}
      <span
        aria-hidden="true"
        className="absolute top-3.5 bottom-2 left-m w-px -translate-x-1/2 bg-imagine-foreground-faint/40"
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
            <span className="flex w-xl shrink-0 justify-center">
              <span
                aria-hidden="true"
                className={cn(
                  // Centres on the first line of the entry: the content's
                  // top padding plus half a `type-small` line, less the dot.
                  "mt-2.5 size-2 rounded-full",
                  entry.unread
                    ? "bg-imagine-secondary shadow-[0_0_0_2px_var(--color-imagine-surface),0_0_0_6px_var(--color-imagine-secondary-soft)]"
                    : "bg-imagine-foreground-faint/60 ring-2 ring-imagine-surface",
                )}
              />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-s py-xs">
              <div className="flex items-center justify-between gap-l">
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
