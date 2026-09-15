"use client";

import { useEffect, useEffectEvent, useState, type ReactNode } from "react";

import { useOptionalChat } from "@/components/features/agent/chat-provider";
import { PageEntrance, PageHandoff } from "@/components/motion/page-transition";

const FRAME = "flex min-h-0 flex-1 flex-col";

/**
 * Remounts per route, so each page fades and slides in — except when the page
 * is arriving because a composer preview was expanded into it, where the
 * morphing block carries the motion instead.
 */
export default function WorkspaceTemplate({
  children,
}: {
  children: ReactNode;
}) {
  const chat = useOptionalChat();
  // Read once, on mount: the handoff is for this arrival only.
  const [handoff] = useState(() => chat?.handoff ?? null);
  const land = useEffectEvent(() => {
    if (handoff !== null) chat?.landed();
  });

  useEffect(() => {
    land();
  }, []);

  if (handoff !== null) {
    return <PageHandoff className={FRAME}>{children}</PageHandoff>;
  }
  return <PageEntrance className={FRAME}>{children}</PageEntrance>;
}
