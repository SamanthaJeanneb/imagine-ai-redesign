"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useState } from "react";

import { Shimmer } from "@/components/motion/shimmer";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, pressRow, swapUp } from "@/styles/motion";

/** One thing the agent noticed, and what to say to follow it up. */
export interface Insight {
  id: string;
  text: string;
  /** What pressing the insight says on the user's behalf. */
  prompt: string;
  /** Which scripted reply answers it. Default `default`. */
  intent?: string;
}

interface AskImagineProps {
  insights: readonly Insight[];
  /** Ask something: the strip's own field, or the insight itself. */
  onAsk: (prompt: string, intent?: string) => void;
  className?: string;
}

/** How long each insight holds before the next slides in. */
const ROTATE_MS = 6000;

/**
 * The strip both states share: the agent's mark, whatever it has to say in
 * the middle, and a field on the right that takes any other question about
 * what is on screen.
 */
function AskImagineStrip({
  onAsk,
  className,
  children,
}: {
  onAsk: (prompt: string, intent?: string) => void;
  className?: string;
  children: ReactNode;
}) {
  const [question, setQuestion] = useState("");

  return (
    <motion.div
      data-slot="ask-imagine"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
      className={cn(
        "@container/ask flex flex-col gap-m border border-imagine-secondary/30 bg-imagine-secondary-soft/40 p-m @4xl/ask:flex-row @4xl/ask:items-center @4xl/ask:gap-l",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-m">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-imagine-secondary text-imagine-secondary-foreground">
          <Icon name="imagine" size="l" />
        </span>
        {children}
      </div>

      <form
        className="flex min-w-0 items-center gap-s @4xl/ask:shrink-0"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = question.trim();
          if (trimmed === "") return;
          onAsk(trimmed);
          setQuestion("");
        }}
      >
        <label className="flex h-control-sm min-w-0 flex-1 items-center gap-s rounded-control border border-imagine-border bg-imagine-surface px-s focus-within:ring-2 focus-within:ring-ring/40 @4xl/ask:min-w-56 @4xl/ask:flex-none">
          <Icon
            name="magnifying-glass"
            size="s"
            className="text-imagine-foreground-faint"
          />
          <input
            value={question}
            onChange={(event) => {
              setQuestion(event.target.value);
            }}
            aria-label="Ask Imagine about these numbers"
            placeholder="Ask Imagine about these numbers"
            className="min-w-0 flex-1 bg-transparent type-small outline-none placeholder:text-imagine-foreground-faint"
          />
        </label>
      </form>
    </motion.div>
  );
}

/**
 * The agent's presence on the analytics page: a strip that reads the numbers
 * out loud. One insight shows at a time and rotates; pressing it asks about
 * it. The field still takes any other question while it rotates.
 */
export function AskImagine({ insights, onAsk, className }: AskImagineProps) {
  const [index, setIndex] = useState(0);
  const current = insights[index % Math.max(insights.length, 1)];

  useEffect(() => {
    if (insights.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % insights.length);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [insights.length]);

  // Nothing noticed in the window: there is no insight to read out, so the
  // strip says it is still reading rather than showing an empty line.
  if (current === undefined) {
    return <AskImaginePending onAsk={onAsk} className={className} />;
  }

  return (
    <AskImagineStrip onAsk={onAsk} className={className}>
      <div className="relative grid min-w-0 flex-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.button
            key={current.id}
            type="button"
            {...swapUp}
            whileTap={pressRow.whileTap}
            transition={fade.base}
            onClick={() => {
              onAsk(current.prompt, current.intent);
            }}
            className="col-start-1 row-start-1 -mx-xs truncate rounded-control px-xs text-left type-small text-imagine-foreground transition-colors hover:bg-imagine-secondary/10"
          >
            {current.text}
            <Icon
              name="arrow-right"
              size="s"
              className="ml-s text-imagine-secondary"
            />
          </motion.button>
        </AnimatePresence>
      </div>
      {insights.length > 1 ? (
        <span className="flex shrink-0 items-center gap-xxs">
          {insights.map((insight, dot) => (
            <button
              key={insight.id}
              type="button"
              aria-label={`Insight ${String(dot + 1)}`}
              onClick={() => {
                setIndex(dot);
              }}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                dot === index % insights.length
                  ? "bg-imagine-secondary"
                  : "bg-imagine-secondary/30 hover:bg-imagine-secondary/60",
              )}
            />
          ))}
        </span>
      ) : null}
    </AskImagineStrip>
  );
}

/**
 * The same strip while the insights are still being computed: the field is
 * live, and the line shimmers in place of the insight that will land there.
 */
export function AskImaginePending({
  onAsk,
  className,
}: {
  onAsk: (prompt: string, intent?: string) => void;
  className?: string;
}) {
  return (
    <AskImagineStrip onAsk={onAsk} className={className}>
      <div className="relative grid min-w-0 flex-1">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.p
            key="loading"
            {...swapUp}
            transition={fade.base}
            className="col-start-1 row-start-1 type-small"
          >
            <Shimmer>Reading this week&apos;s numbers</Shimmer>
          </motion.p>
        </AnimatePresence>
      </div>
    </AskImagineStrip>
  );
}

interface AskButtonProps {
  /** What pressing it says. */
  prompt: string;
  intent?: string;
  onAsk: (prompt: string, intent?: string) => void;
  className?: string;
}

const ASK_BUTTON_CLASS = "text-imagine-secondary hover:text-imagine-secondary";

/** A panel's own way in to the agent: the icon and its name. Sits in the panel header. */
export function AskButton({
  prompt,
  intent,
  onAsk,
  className,
}: AskButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => {
        onAsk(prompt, intent);
      }}
      className={cn(ASK_BUTTON_CLASS, className)}
    >
      <Icon name="imagine" size="s" data-icon="inline-start" />
      Ask Imagine
    </Button>
  );
}

/** The same way in as just the icon, for headers that are already full. */
export function AskIconButton({
  prompt,
  intent,
  onAsk,
  className,
}: AskButtonProps) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label="Ask Imagine"
      onClick={() => {
        onAsk(prompt, intent);
      }}
      className={cn(ASK_BUTTON_CLASS, className)}
    >
      <Icon name="imagine" size="s" />
    </Button>
  );
}
