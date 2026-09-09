"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

import {
  AgentMessage,
  type MessagePart,
  UserMessage,
} from "@/components/features/agent/agent-message";
import type { AgentMessage as AgentMessageData } from "@/services/agent";
import { fade } from "@/styles/motion";

/** A user turn is only ever text, whatever else the part list allows. */
function userText(parts: readonly MessagePart[]): string {
  return parts
    .flatMap((part) =>
      part.type === "text" || part.type === "emphasis" ? [part.text] : [],
    )
    .join("\n");
}

interface AgentThreadProps {
  messages: readonly AgentMessageData[];
  /** Rotating lines under the last reply while it is still arriving. */
  thinking?: boolean;
  thinkingStatuses?: readonly string[];
  onIntent?: (intent: string, postId?: string) => void;
}

/** The overflow box that actually scrolls the thread, page or column. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  let current = node.parentElement;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === "auto" || overflowY === "scroll") return current;
    current = current.parentElement;
  }
  return null;
}

/**
 * The conversation. The user speaks in a flat bubble on the right, the agent
 * on the surface. The view follows the last part as the reply arrives.
 */
export function AgentThread({
  messages,
  thinking = false,
  thinkingStatuses,
  onIntent,
}: AgentThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);

  // Scroll the overflow parent to its end, not the sentinel into view: the
  // dock sits after the thread and is sticky, so aligning the sentinel to the
  // viewport bottom tucks the last card under the composer. Follow height as
  // the reply streams in; a one-shot smooth scroll stops short of the final
  // card.
  useEffect(() => {
    const end = endRef.current;
    if (end === null) return;
    const scroller = scrollParent(end);
    const thread = end.parentElement;
    if (scroller === null || thread === null) return;

    const pin = () => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "auto" });
    };

    pin();
    const observer = new ResizeObserver(pin);
    observer.observe(thread);
    return () => {
      observer.disconnect();
    };
  }, [messages.length, last?.parts.length, thinking]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-xxl pt-l pb-xl"
    >
      {messages.map((message, index) =>
        message.role === "user" ? (
          <UserMessage key={message.id} text={userText(message.parts)} />
        ) : (
          <AgentMessage
            key={message.id}
            parts={message.parts}
            thinking={thinking && index === messages.length - 1}
            {...(thinkingStatuses === undefined ? {} : { thinkingStatuses })}
            {...(onIntent === undefined ? {} : { onIntent })}
          />
        ),
      )}
      <div ref={endRef} aria-hidden="true" className="h-px shrink-0" />
    </motion.div>
  );
}
