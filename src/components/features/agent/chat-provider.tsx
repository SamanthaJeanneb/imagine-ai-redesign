"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ComposerPreview } from "@/components/features/agent/composer";
import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { DraggableResource } from "@/components/features/files/resource-drag";
import type { AgentMessage, ScriptedReply } from "@/services/agent";
import type { PreviewChart } from "@/services/analytics";

/** A conversation started in the browser. It is never stored, so this is its id. */
export const NEW_THREAD_ID = "new";

/** What the composer's preview chips open. Static, read from the mock once. */
export interface PreviewData {
  calendar: readonly CalendarDay[];
  analytics: readonly PreviewChart[];
}

/** What the next message is about: a post, chart, workspace file, or asset. */
export type ChatAttachment =
  | { kind: "post"; post: PostChipData }
  | { kind: "chart"; chart: PreviewChart }
  | DraggableResource;

/** Every kind carries an id and title; this is what the chat speaks about. */
function subject(attachment: ChatAttachment): { id: string; title: string } {
  switch (attachment.kind) {
    case "post":
      return attachment.post;
    case "chart":
      return attachment.chart;
    case "file":
      return attachment.file;
    case "asset":
      return {
        id: attachment.asset.id,
        title: attachment.asset.caption ?? "Untitled asset",
      };
  }
}

interface Streaming {
  messageId: string;
  revealed: number;
  reply: ScriptedReply;
}

export interface ChatState {
  /** `null` is no conversation: the landing shows, the sidebar chat is empty. */
  threadId: string | null;
  messages: readonly AgentMessage[];
  /** The reply still arriving, if any. */
  thinking: boolean;
  thinkingStatuses: readonly string[] | undefined;
  draft: string;
  attached: readonly ChatAttachment[];
  /** Every attached id, in attachment order. */
  attachedIds: readonly string[];
  preview: ComposerPreview | null;
  /**
   * The preview last opened. The surface keeps showing it while it closes,
   * and both previews stay mounted behind it, so reopening is instant.
   */
  lastPreview: ComposerPreview;
  /**
   * The preview that was just expanded into its page. Set on expand, cleared
   * when the page lands, so the page can skip its entrance and let the block
   * morph in on its own.
   */
  handoff: ComposerPreview | null;
  previews: PreviewData;
}

export interface ChatActions {
  /** Say something. `intent` picks the scripted reply; a button in a reply passes its own. */
  send: (text: string, intent?: string) => void;
  /** A button in a reply, pressed: says the intent on the user's behalf. */
  sendIntent: (intent: string) => void;
  setDraft: (draft: string) => void;
  /** Add next-message context unless it is already attached. */
  attach: (next: ChatAttachment) => void;
  /** Attach context. Attaching the current subject again detaches it. */
  toggleAttached: (next: ChatAttachment) => void;
  /** Remove one attachment by id, or everything when no id is supplied. */
  clearAttached: (id?: string) => void;
  setPreview: (preview: ComposerPreview | null) => void;
  /** Show a stored thread. No-op when it is already the open one. */
  open: (threadId: string, messages: readonly AgentMessage[]) => void;
  /** Back to no conversation: the landing with an empty composer. */
  reset: () => void;
  /** Close the preview and mark the page it opens as arriving by morph. */
  expand: (preview: ComposerPreview) => void;
  landed: () => void;
}

const ChatContext = createContext<(ChatState & ChatActions) | null>(null);

/** What pressing a button in a reply says on the user's behalf. */
const INTENT_PROMPT: Record<string, string> = {
  schedule: "Schedule it.",
  edit: "I want to edit it first.",
  regenerate: "Try another angle.",
  move: "Move it to another day.",
  unschedule: "Take it off the calendar.",
  "browse-files": "Let me pick from the files.",
};

/** How long the thinking state holds, then the gap between parts. */
const THINK_MS = 1400;
const PART_MS = 700;

interface ChatProviderProps {
  /**
   * Played back part by part on every send, since there is no model here.
   * Scheduling confirms a slot; everything else drafts.
   */
  replies: { default: ScriptedReply; schedule: ScriptedReply };
  previews: PreviewData;
  children: ReactNode;
}

/**
 * The conversation, owned by the workspace shell rather than a page. That is
 * what lets the thread stay open while the user moves from `/agent` to the
 * calendar or analytics, where the same messages show in the right column.
 */
export function ChatProvider({
  replies,
  previews,
  children,
}: ChatProviderProps) {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<readonly AgentMessage[]>([]);
  const [streaming, setStreaming] = useState<Streaming | null>(null);
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<readonly ChatAttachment[]>([]);
  const [preview, setPreviewState] = useState<ComposerPreview | null>(null);
  const [lastPreview, setLastPreview] = useState<ComposerPreview>("calendar");
  const [handoff, setHandoff] = useState<ComposerPreview | null>(null);

  const setPreview = useCallback((next: ComposerPreview | null) => {
    setPreviewState(next);
    if (next !== null) setLastPreview(next);
  }, []);
  const [turns, setTurns] = useState(0);

  // The reply arrives a part at a time: the thinking state holds, then the rest.
  useEffect(() => {
    if (streaming === null) return;
    const { messageId, revealed, reply } = streaming;
    const next = revealed + 1;

    const timer = window.setTimeout(
      () => {
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId
              ? { ...message, parts: reply.parts.slice(0, next) }
              : message,
          ),
        );
        setStreaming(
          next < reply.parts.length
            ? { messageId, revealed: next, reply }
            : null,
        );
      },
      revealed === 0 ? THINK_MS : PART_MS,
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [streaming]);

  const send = useCallback(
    (text: string, intent = "default") => {
      const turn = String(turns + 1);
      const messageId = `reply-${turn}`;
      // What is attached rides along in the message, the way a person would say it.
      const about = attached.map(subject);
      const spoken =
        about.length === 0
          ? text
          : `About ${about.map((item) => `"${item.title}"`).join(", ")}: ${text}`;

      setTurns(turns + 1);
      setThreadId((current) => current ?? NEW_THREAD_ID);
      setMessages((current) => [
        ...current,
        {
          id: `user-${turn}`,
          role: "user",
          parts: [{ type: "text", text: spoken }],
        },
        { id: messageId, role: "assistant", parts: [] },
      ]);
      setStreaming({
        messageId,
        revealed: 0,
        reply:
          intent === "schedule" || intent === "approve"
            ? replies.schedule
            : replies.default,
      });
      setDraft("");
      setAttached([]);
    },
    [attached, replies, turns],
  );

  const toggleAttached = useCallback((next: ChatAttachment) => {
    const id = subject(next).id;
    setAttached((current) =>
      current.some((item) => subject(item).id === id)
        ? current.filter((item) => subject(item).id !== id)
        : [...current, next],
    );
  }, []);

  const attach = useCallback((next: ChatAttachment) => {
    const id = subject(next).id;
    setAttached((current) =>
      current.some((item) => subject(item).id === id)
        ? current
        : [...current, next],
    );
  }, []);

  const clearAttached = useCallback((id?: string) => {
    setAttached((current) =>
      id === undefined ? [] : current.filter((item) => subject(item).id !== id),
    );
  }, []);

  const sendIntent = useCallback(
    (intent: string) => {
      send(INTENT_PROMPT[intent] ?? "Go ahead.", intent);
    },
    [send],
  );

  const open = useCallback(
    (id: string, stored: readonly AgentMessage[]) => {
      if (threadId === id) return;
      setThreadId(id);
      setMessages(stored);
      setStreaming(null);
      setAttached([]);
    },
    [threadId],
  );

  const reset = useCallback(() => {
    setThreadId(null);
    setMessages([]);
    setStreaming(null);
    setDraft("");
    setAttached([]);
    setPreviewState(null);
  }, []);

  const expand = useCallback((next: ComposerPreview) => {
    setPreviewState(null);
    setHandoff(next);
  }, []);

  const landed = useCallback(() => {
    setHandoff(null);
  }, []);

  const value = useMemo<ChatState & ChatActions>(
    () => ({
      threadId,
      messages,
      thinking: streaming !== null,
      thinkingStatuses: streaming?.reply.statuses,
      draft,
      attached,
      attachedIds: attached.map((item) => subject(item).id),
      preview,
      lastPreview,
      handoff,
      previews,
      send,
      sendIntent,
      setDraft,
      attach,
      toggleAttached,
      clearAttached,
      setPreview,
      open,
      reset,
      expand,
      landed,
    }),
    [
      threadId,
      messages,
      streaming,
      draft,
      attached,
      preview,
      lastPreview,
      handoff,
      previews,
      send,
      sendIntent,
      attach,
      toggleAttached,
      clearAttached,
      setPreview,
      open,
      reset,
      expand,
      landed,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatState & ChatActions {
  const chat = useContext(ChatContext);
  if (chat === null) {
    throw new Error("useChat needs a ChatProvider above it");
  }
  return chat;
}

/** For pieces that may render outside the workspace, such as the page transition. */
export function useOptionalChat(): (ChatState & ChatActions) | null {
  return useContext(ChatContext);
}
