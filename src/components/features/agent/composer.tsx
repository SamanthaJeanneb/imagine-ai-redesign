"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { fade, spring } from "@/styles/motion";

export type ComposerPreview = "calendar" | "analytics";

const PREVIEW_OPTIONS: readonly {
  key: ComposerPreview;
  label: string;
  icon: IconName;
}[] = [
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "analytics", label: "Analytics", icon: "chart-simple" },
];

interface ComposerProps {
  /** `hero` is the landing prompt; `dock` is the thread's bottom bar. */
  variant?: "hero" | "dock";
  value: string;
  onValueChange: (value: string) => void;
  onSend: (value: string) => void;
  placeholder?: string;
  /** Which preview is open above the input. Dock only. */
  preview?: ComposerPreview | null;
  onPreviewChange?: (preview: ComposerPreview | null) => void;
  /** The open preview surface, rendered above the input. */
  children?: React.ReactNode;
  /** Context attached to the next message (e.g. `PostContext`). Sits above the input. */
  attachments?: React.ReactNode;
  onAttach?: () => void;
  /** Shared layout id so the hero can morph into the dock. */
  layoutId?: string;
  className?: string;
}

/**
 * The prompt box. One component, two shapes: the landing hero and the thread
 * dock with its Calendar and Analytics preview chips.
 */
export function Composer({
  variant = "dock",
  value,
  onValueChange,
  onSend,
  placeholder = "Ask about your LinkedIn, or describe a post",
  preview = null,
  onPreviewChange,
  children,
  attachments,
  onAttach,
  layoutId,
  className,
}: ComposerProps) {
  const [focused, setFocused] = useState(false);
  const canSend = value.trim().length > 0;
  const isDock = variant === "dock";

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
  }

  return (
    <motion.div
      layoutId={layoutId}
      layout
      transition={spring.soft}
      data-slot="composer"
      data-variant={variant}
      className={cn(
        "flex w-full flex-col rounded-panel bg-imagine-surface shadow-floating transition-shadow",
        isDock ? "p-xs" : "p-s",
        focused && "ring-2 ring-imagine-secondary-soft",
        className,
      )}
    >
      {isDock ? (
        <div className="flex items-center gap-xs px-xs pt-xxs pb-xs">
          <AnimatePresence initial={false} mode="popLayout">
            {PREVIEW_OPTIONS.filter(
              (option) => preview === null || option.key === preview,
            ).map((option) => {
              const active = option.key === preview;
              return (
                <motion.div
                  key={option.key}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={spring.snappy}
                >
                  <Button
                    size="xs"
                    variant={active ? "soft" : "ghost"}
                    aria-pressed={active}
                    className={cn(
                      active &&
                        "bg-imagine-secondary-soft text-imagine-secondary shadow-none hover:bg-imagine-secondary-soft",
                    )}
                    onClick={() => {
                      onPreviewChange?.(active ? null : option.key);
                    }}
                  >
                    <Icon
                      name={option.icon}
                      size="s"
                      data-icon="inline-start"
                    />
                    {option.label}
                    {active ? (
                      <Icon name="xmark" size="s" data-icon="inline-end" />
                    ) : null}
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : null}

      {children}

      {attachments ? (
        <div
          className={cn("empty:hidden", isDock ? "px-xs pt-xs" : "px-s pt-s")}
        >
          {attachments}
        </div>
      ) : null}

      <div
        className={cn("flex items-end gap-xs", isDock ? "p-xs" : "p-xs pl-s")}
      >
        {isDock ? (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label="Attach"
            onClick={onAttach}
          >
            <Icon name="paperclip" />
          </Button>
        ) : (
          <span
            aria-hidden="true"
            className="mb-1 flex size-7 shrink-0 items-center justify-center text-imagine-secondary"
          >
            <Icon name="sparkles" active />
          </span>
        )}
        <textarea
          rows={1}
          value={value}
          placeholder={placeholder}
          aria-label="Message the agent"
          onChange={(event) => {
            onValueChange(event.target.value);
          }}
          onFocus={() => {
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          className={cn(
            "field-sizing-content max-h-40 min-h-7 flex-1 resize-none bg-transparent px-xs py-xs type-body outline-none placeholder:text-imagine-foreground-faint",
            !isDock && "min-h-9 py-2 type-heading font-normal",
          )}
        />
        {/* Sits back at rest and springs forward once there is something to send. */}
        <motion.span
          className="flex"
          animate={{ scale: canSend ? 1 : 0.88, opacity: canSend ? 1 : 0.45 }}
          transition={spring.snappy}
        >
          <Button
            size={isDock ? "icon-sm" : "icon"}
            aria-label="Send"
            disabled={!canSend}
            onClick={submit}
            className="disabled:opacity-100"
          >
            <Icon name="arrow-up" />
          </Button>
        </motion.span>
      </div>
      <AnimatePresence initial={false}>
        {isDock ? null : (
          <motion.p
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fade.fast}
            className="px-s pt-xs pb-xxs type-small text-imagine-foreground-faint"
          >
            Enter to send, Shift + Enter for a new line
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
