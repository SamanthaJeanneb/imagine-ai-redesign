"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade } from "@/styles/motion";

/** The header's right end swaps between the account and the chat's controls. */
const HEADER_SWAP = {
  initial: { opacity: 0, y: -4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: fade.fast,
} as const;

/**
 * The page header row: what the shell puts in it is assembled in
 * `WorkspaceFrame`. The space below the divider is the page, not this row.
 */
export function WorkspaceHeaderBar({ children }: { children: ReactNode }) {
  return (
    <div className="relative mt-m mb-m flex h-8 min-w-0 shrink-0 items-center gap-s overflow-x-clip px-l after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-m after:border-b after:border-imagine-border md:px-xxl">
      {children}
    </div>
  );
}

/** The way into the phone's nav sheet. */
export function MobileNavButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="Open menu"
      aria-expanded={open}
      onClick={onClick}
      className="-ml-2.5 text-imagine-foreground-faint hover:text-imagine-foreground md:hidden"
    >
      <Icon name="sidebar" />
    </Button>
  );
}

/** The open conversation's name, sliding in after the profile faces. */
export function WorkspaceHeaderTitle({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{
        opacity: 1,
        x: 0,
        transition: { ...fade.base, delay: 0.1 },
      }}
      exit={{ opacity: 0, x: -8, transition: fade.fast }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  );
}

/**
 * The header's right end. Render one keyed cluster inside an
 * `AnimatePresence mode="wait"`: the account, or the chat's controls. Both end
 * on the same glyph edge, pulled in by the icon button's own padding.
 */
export function WorkspaceHeaderEnd({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      {...HEADER_SWAP}
      className={cn("-mr-s ml-auto flex shrink-0", className)}
    >
      {children}
    </motion.div>
  );
}

/** The way into the docked chat where it overlays the page. */
export function ChatOverlayToggle({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label={open ? "Hide chat" : "Open chat"}
      aria-pressed={open}
      onClick={() => {
        onOpenChange(!open);
      }}
      className={cn(
        "xl:hidden",
        open
          ? "bg-imagine-surface-raised text-imagine-foreground"
          : "text-imagine-foreground-muted hover:text-imagine-foreground",
      )}
    >
      <Icon name="message" />
    </Button>
  );
}
