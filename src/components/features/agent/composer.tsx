"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  hasComposerDrag,
  readComposerDrop,
  type DraggableResource,
} from "@/components/features/files/resource-drag";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { fitsOneLine } from "@/lib/measure-text";
import { fade, spring } from "@/styles/motion";

export type ComposerPreview = "calendar" | "analytics";

const PREVIEW_OPTIONS: Record<
  ComposerPreview,
  { label: string; icon: IconName }
> = {
  calendar: { label: "Calendar", icon: "calendar" },
  analytics: { label: "Analytics", icon: "chart-simple" },
};

export const ALL_PREVIEWS: readonly ComposerPreview[] = [
  "calendar",
  "analytics",
];

const DEFAULT_PLACEHOLDER = "Ask about your LinkedIn, or describe a post";
const COMPACT_PLACEHOLDER = "Ask Imagine";

type ButtonSize = ButtonProps["size"];

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

interface ComposerContextValue {
  value: string;
  setValue: (next: string) => void;
  /** Sends the trimmed draft; a no-op while there is nothing to send. */
  submit: () => void;
  canSend: boolean;
  /** Present when dropped files and assets attach to the next message. */
  attach: ((resource: DraggableResource) => void) | undefined;
  focused: boolean;
  setFocused: (next: boolean) => void;
  dropActive: boolean;
  setDropActive: (next: boolean) => void;
  /** Off for reduced motion and while the shell is mid-layout. */
  layoutActive: boolean;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

function useComposer(): ComposerContextValue {
  const context = useContext(ComposerContext);
  if (context === null) {
    throw new Error("Composer parts must render inside <ComposerProvider>.");
  }
  return context;
}

interface ComposerProviderProps {
  value: string;
  onValueChange: (value: string) => void;
  onSend: (value: string) => void;
  /** Files and assets can be dropped onto the frame. */
  onResourceDrop?: (resource: DraggableResource) => void;
  children: ReactNode;
}

/**
 * The prompt box's state. The draft itself is controlled — the chat owns it
 * so a post opened from the calendar can fill it — while focus and the drop
 * highlight are ephemeral and live here.
 */
export function ComposerProvider({
  value,
  onValueChange,
  onSend,
  onResourceDrop,
  children,
}: ComposerProviderProps) {
  const [focused, setFocused] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const layoutLocked = useLayoutLocked();
  // The hero should not slide into the dock for a reader who asked for less
  // motion, and nothing should animate mid-resize.
  const reduceMotion = useReducedMotion();
  const canSend = value.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSend(value.trim());
  }

  return (
    <ComposerContext.Provider
      value={{
        value,
        setValue: onValueChange,
        submit,
        canSend,
        attach: onResourceDrop,
        focused,
        setFocused,
        dropActive,
        setDropActive,
        layoutActive: !reduceMotion && !layoutLocked,
      }}
    >
      {children}
    </ComposerContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Frame                                                                       */
/* -------------------------------------------------------------------------- */

interface ComposerFrameProps {
  /** Shared with the other dock, so the box morphs when the chat changes column. */
  layoutId?: string;
  /** Re-measure only when this changes, not every time a sidebar resizes. */
  layoutDependency?: unknown;
  className?: string;
  children: ReactNode;
}

/** The floating box: focus ring, drop target, and the layout morph. */
export function ComposerFrame({
  layoutId,
  layoutDependency,
  className,
  children,
}: ComposerFrameProps) {
  const { attach, focused, dropActive, setDropActive, layoutActive } =
    useComposer();
  const dragDepth = useRef(0);

  return (
    <motion.div
      layout={layoutActive ? "position" : false}
      layoutId={layoutActive ? layoutId : undefined}
      layoutDependency={layoutDependency}
      transition={spring.soft}
      data-slot="composer"
      data-drop-active={dropActive ? "true" : "false"}
      onDragEnter={(event) => {
        if (
          attach === undefined ||
          !hasComposerDrag(Array.from(event.dataTransfer.types))
        ) {
          return;
        }
        event.preventDefault();
        dragDepth.current += 1;
        setDropActive(true);
      }}
      onDragOver={(event) => {
        if (
          attach === undefined ||
          !hasComposerDrag(Array.from(event.dataTransfer.types))
        ) {
          return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(event) => {
        if (!hasComposerDrag(Array.from(event.dataTransfer.types))) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDropActive(false);
      }}
      onDrop={(event) => {
        if (attach === undefined) return;
        const resources = readComposerDrop(event.dataTransfer);
        if (resources.length === 0) return;
        event.preventDefault();
        dragDepth.current = 0;
        setDropActive(false);
        for (const resource of resources) attach(resource);
      }}
      className={cn(
        "relative isolate flex w-full max-w-full min-w-0 flex-col rounded-panel bg-imagine-surface shadow-floating transition-shadow",
        focused && "ring-2 ring-imagine-secondary-soft",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/** The "Drop to attach" overlay while a file is held over the frame. */
export function ComposerDropZone() {
  const { dropActive } = useComposer();
  return (
    <AnimatePresence initial={false}>
      {dropActive ? (
        <motion.div
          key="drop-target"
          initial={{ opacity: 0, transform: "scale(0.98)" }}
          animate={{ opacity: 1, transform: "scale(1)" }}
          exit={{ opacity: 0, transform: "scale(0.98)" }}
          transition={spring.snappy}
          aria-live="polite"
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-panel border-2 border-imagine-secondary bg-imagine-surface shadow-floating"
        >
          <span className="flex items-center gap-s rounded-control bg-imagine-secondary px-m py-s type-small font-medium text-imagine-secondary-foreground shadow-control">
            <Icon name="paperclip" size="s" />
            Drop to attach
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview chips                                                               */
/* -------------------------------------------------------------------------- */

interface ComposerPreviewChipsProps {
  /** Which previews to offer. The calendar page's chat has no use for a calendar chip. */
  previews?: readonly ComposerPreview[];
  value: ComposerPreview | null;
  onValueChange: (preview: ComposerPreview | null) => void;
  /** Trailing content on the row, e.g. `ComposerExpandAction`. */
  children?: ReactNode;
}

/**
 * Calendar / Analytics toggles under the preview. Once one is open the others
 * step aside so the open chip reads as the thing to dismiss.
 */
export function ComposerPreviewChips({
  previews = ALL_PREVIEWS,
  value,
  onValueChange,
  children,
}: ComposerPreviewChipsProps) {
  const { layoutActive } = useComposer();
  const offered = previews.filter(
    (preview) => value === null || preview === value,
  );

  return (
    <div className="flex items-center gap-xs px-xs pt-xxs pb-xs">
      <AnimatePresence initial={false} mode="popLayout">
        {offered.map((preview) => {
          const option = PREVIEW_OPTIONS[preview];
          const active = preview === value;
          return (
            <motion.div
              key={preview}
              layout={layoutActive ? "position" : false}
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
                  onValueChange(active ? null : preview);
                }}
              >
                <Icon name={option.icon} size="s" data-icon="inline-start" />
                {option.label}
                {active ? (
                  <Icon name="xmark" size="s" data-icon="inline-end" />
                ) : null}
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {children}
    </div>
  );
}

interface ComposerExpandActionProps {
  onClick: () => void;
  children: ReactNode;
}

/** "Open calendar" / "Open analytics", trailing on the chip row. */
export function ComposerExpandAction({
  onClick,
  children,
}: ComposerExpandActionProps) {
  return (
    <Button
      size="xs"
      variant="link"
      onClick={onClick}
      className="ml-auto px-0 text-imagine-secondary hover:text-imagine-secondary-strong"
    >
      {children}
      <Icon name="up-right-from-square" size="s" data-icon="inline-end" />
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Attachments                                                                 */
/* -------------------------------------------------------------------------- */

interface ComposerAttachmentsProps {
  /** Inset around the strip; the hero and the dock use different paddings. */
  className?: string;
  /** Context attached to the next message. Nothing here collapses the slot. */
  children?: ReactNode;
}

/** The row of attached posts, charts, and files above the input. */
export function ComposerAttachments({
  className,
  children,
}: ComposerAttachmentsProps) {
  return (
    <AnimatePresence initial={false}>
      {children ? (
        <motion.div
          key="attachments"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={fade.fast}
          className="overflow-hidden"
        >
          <div className={className}>{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */
/* Input row                                                                   */
/* -------------------------------------------------------------------------- */

interface ComposerInputRowProps {
  className?: string;
  children: ReactNode;
}

/** The bottom row: attach, the field, send. */
export function ComposerInputRow({
  className,
  children,
}: ComposerInputRowProps) {
  return (
    <div className={cn("flex min-w-0 items-end gap-xs", className)}>
      {children}
    </div>
  );
}

interface ComposerAttachButtonProps {
  size?: ButtonSize;
  onClick?: () => void;
}

export function ComposerAttachButton({
  size = "icon-sm",
  onClick,
}: ComposerAttachButtonProps) {
  return (
    <Button size={size} variant="ghost" aria-label="Attach" onClick={onClick}>
      <Icon name="paperclip" />
    </Button>
  );
}

interface ComposerInputProps {
  placeholder?: string;
  className?: string;
}

/**
 * The field. Enter sends, Shift+Enter breaks the line. The default placeholder
 * shortens itself when the box is too narrow to hold it on one line.
 */
export function ComposerInput({
  placeholder = DEFAULT_PLACEHOLDER,
  className,
}: ComposerInputProps) {
  const { value, setValue, submit, setFocused } = useComposer();
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [compactPlaceholder, setCompactPlaceholder] = useState(false);
  const isDefaultPlaceholder = placeholder === DEFAULT_PLACEHOLDER;

  useLayoutEffect(() => {
    if (!isDefaultPlaceholder) return;
    const field = fieldRef.current;
    if (field === null) return;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      setCompactPlaceholder(!fitsOneLine(field, DEFAULT_PLACEHOLDER));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(field);
    void document.fonts.ready.then(measure);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [isDefaultPlaceholder]);

  return (
    <textarea
      ref={fieldRef}
      rows={1}
      value={value}
      placeholder={
        isDefaultPlaceholder && compactPlaceholder
          ? COMPACT_PLACEHOLDER
          : placeholder
      }
      aria-label="Message the agent"
      onChange={(event) => {
        setValue(event.target.value);
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
        "field-sizing-content max-h-40 min-h-7 min-w-0 flex-1 resize-none bg-transparent px-xs py-xs type-body outline-none placeholder:text-imagine-foreground-faint",
        className,
      )}
    />
  );
}

interface ComposerSendButtonProps {
  size?: ButtonSize;
}

/** Sits back at rest and springs forward once there is something to send. */
export function ComposerSendButton({
  size = "icon-sm",
}: ComposerSendButtonProps) {
  const { canSend, submit } = useComposer();
  return (
    <motion.span
      className="flex shrink-0"
      animate={{ scale: canSend ? 1 : 0.88, opacity: canSend ? 1 : 0.45 }}
      transition={spring.snappy}
    >
      <Button
        size={size}
        aria-label="Send"
        disabled={!canSend}
        onClick={submit}
        className="disabled:opacity-100"
      >
        <Icon name="arrow-up" />
      </Button>
    </motion.span>
  );
}
