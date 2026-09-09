"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { fade, spring } from "@/styles/motion";

interface PanelProps {
  title: string;
  /** The cut: the window, or what is being compared. */
  description?: string;
  /** Controls on the header's right: tabs, a filter, an ask button. */
  actions?: ReactNode;
  children: ReactNode;
  /** Shared with a composer preview, so the panel can morph in from it. */
  layoutId?: string;
  className?: string;
}

/**
 * The analytics page's unit: a hairline frame on the surface with one header
 * line and whatever the section needs below it. Sections fade in as a whole;
 * what is inside animates on its own. The frame is a container (`@.../panel`)
 * so a section lays itself out by the width it actually has, which depends on
 * the chat dock and the page grid, not the viewport.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  layoutId,
  className,
}: PanelProps) {
  return (
    <motion.section
      data-slot="panel"
      {...(layoutId === undefined
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: fade.base,
          }
        : { layoutId, transition: spring.soft })}
      className={cn(
        "@container/panel flex min-w-0 flex-col gap-l border border-imagine-border bg-imagine-surface p-l",
        className,
      )}
    >
      <header className="flex min-h-8 flex-wrap items-center justify-between gap-m">
        <div className="flex min-w-0 items-baseline gap-s">
          <h2 className="type-heading whitespace-nowrap">{title}</h2>
          {description ? (
            <span className="truncate type-small text-imagine-foreground-faint">
              {description}
            </span>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-s">{actions}</div>
        ) : null}
      </header>
      {children}
    </motion.section>
  );
}

export function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
