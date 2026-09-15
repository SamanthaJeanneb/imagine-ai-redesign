"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

/**
 * The pill for an attachment that fits on one line: a post or a chart. The
 * taller pill in `resource-context` carries a note under the name instead, and
 * each family owns its own frame because they animate differently — a chart
 * springs in on its own, posts spring inside the strip's `AnimatePresence`.
 */
export const CONTEXT_CHIP_LINE =
  "flex h-8 items-center gap-s rounded-control bg-imagine-surface-raised py-xxs pr-xxs pl-xs shadow-control";

/** The chip's square: a thumbnail where there is one, an icon otherwise. */
export function ContextChipGlyph({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-xs bg-imagine-surface text-imagine-foreground-muted">
      {children}
    </span>
  );
}

/** A name over what kind of thing it is. */
export function ContextChipStack({
  title,
  note,
}: {
  title: string;
  note: string;
}) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate type-small [line-height:1.15] font-medium">
        {title}
      </span>
      <span className="type-caption [line-height:1.15] text-imagine-foreground-muted">
        {note}
      </span>
    </span>
  );
}

/** A name with its detail trailing on the same baseline. */
export function ContextChipInline({
  title,
  detail,
}: {
  title: string;
  detail: ReactNode;
}) {
  return (
    <span className="flex min-w-0 items-baseline gap-xs">
      <span className="max-w-48 truncate type-small font-medium">{title}</span>
      <span className="shrink-0 type-small text-imagine-foreground-muted">
        {detail}
      </span>
    </span>
  );
}

/** Takes the thing back off the message. Omitted where it cannot be removed. */
export function ContextChipRemove({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label={`Remove ${label}`}
      onClick={onClick}
      className="text-imagine-foreground-faint hover:text-imagine-foreground"
    >
      <Icon name="xmark" size="s" />
    </Button>
  );
}
