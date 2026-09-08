"use client";

import { motion, useReducedMotion } from "motion/react";
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
  const reduceMotion = useReducedMotion();
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages.at(-1);

  // Follows the reply as parts arrive, and the send that started it.
  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "end",
    });
  }, [messages.length, last?.parts.length, reduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-xxl pt-l"
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
