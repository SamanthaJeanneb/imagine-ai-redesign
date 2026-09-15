"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import type { ComposerPreview } from "@/components/features/agent/composer";
import type { MessagePart } from "@/components/features/agent/agent-message";
import type { CalendarDay } from "@/components/features/calendar/calendar-grid";
import type { EventChipData } from "@/components/features/calendar/event-chip";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import type { DraggableResource } from "@/components/features/files/resource-drag";
import type {
  AgentMessage,
  ReplyIntent,
  ScriptedReply,
} from "@/services/agent";
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
  /** Just the attached posts, in attachment order. */
  attachedPosts: readonly PostChipData[];
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
  /** Fill the composer with a post about a calendar event, ready to send. */
  draftFromEvent: (event: EventChipData) => void;
  /** Add next-message context unless it is already attached. */
  attach: (next: ChatAttachment) => void;
  /** Attach context. Attaching the current subject again detaches it. */
  toggleAttached: (next: ChatAttachment) => void;
  /** Remove one attachment by id, or everything when no id is supplied. */
  clearAttached: (id?: string) => void;
  setPreview: (preview: ComposerPreview | null) => void;
  /** Show a stored thread. No-op when it is already the open one. */
  open: (threadId: string, messages: readonly AgentMessage[]) => void;
  /**
   * A fresh, empty conversation that already counts as open: it takes a row
   * in the sidebar as "New chat" and the landing keeps showing until the
   * first message names it.
   */
  startNew: () => void;
  /** Start a fresh conversation with a complete, editable post in the thread. */
  startPostChat: (post: PostChipData) => void;
  /** Close the preview and mark the page it opens as arriving by morph. */
  expand: (preview: ComposerPreview) => void;
  landed: () => void;
}

const ChatContext = createContext<(ChatState & ChatActions) | null>(null);

function postDraftPart(post: PostChipData): MessagePart {
  return {
    type: "post_draft",
    postId: post.id,
    author: post.preview?.author ?? {
      name: post.profile,
      headline: "LinkedIn",
    },
    body: post.preview?.body ?? post.title,
    ...(post.preview?.media === undefined ? {} : { media: post.preview.media }),
  };
}

/** The intents that have something to say on the user's behalf. */
type PromptIntent =
  | "schedule"
  | "browse-files"
  | "comment"
  | "reply"
  | "post-comment"
  | "outreach";

/** What pressing a button in a reply says on the user's behalf. */
const INTENT_PROMPT = {
  schedule: "Schedule it.",
  "browse-files": "Let me pick from the files.",
  comment: "Draft a reply to this comment.",
  reply: "Draft a reply to this comment.",
  "post-comment": "Post it.",
  outreach: "Draft a comment on their latest post.",
} as const satisfies Record<PromptIntent, string>;

function isPromptIntent(value: string): value is PromptIntent {
  return Object.hasOwn(INTENT_PROMPT, value);
}

/**
 * Which canned reply answers an intent. Mirrors `toReplyIntent` in
 * `services/agent`, kept here so the provider stays free of server imports.
 */
type ScriptedIntent = "schedule" | "approve" | "comment" | "reply" | "outreach";

const REPLY_FOR_INTENT = {
  schedule: "schedule",
  approve: "schedule",
  comment: "comment",
  reply: "comment",
  outreach: "outreach",
} as const satisfies Record<ScriptedIntent, ReplyIntent>;

function isScriptedIntent(value: string): value is ScriptedIntent {
  return Object.hasOwn(REPLY_FOR_INTENT, value);
}

/** How long the thinking state holds, then the gap between parts. */
const THINK_MS = 1400;
const PART_MS = 700;

/**
 * The landings whose first send becomes a thread. There is no navigation on
 * that send — the composer has to survive the morph — so the URL catches up
 * instead, and a reload of the live thread lands back on it. Sending from a
 * page that has a URL of its own, the calendar or analytics, leaves it alone.
 */
const LANDING_PATHS = new Set(["/agent", "/new-chat"]);

interface ChatProviderProps {
  /**
   * Played back part by part on every send, since there is no model here.
   * Scheduling confirms a slot, the comment intents draft a comment,
   * everything else drafts a post.
   */
  replies: Record<ReplyIntent, ScriptedReply>;
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

  function setPreview(next: ComposerPreview | null) {
    setPreviewState(next);
    if (next !== null) setLastPreview(next);
  }
  // Only ever read to mint the next pair of message ids, never rendered.
  const turns = useRef(0);

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

  function send(text: string, intent = "default") {
    turns.current += 1;
    const turn = String(turns.current);
    const messageId = `reply-${turn}`;
    // What is attached rides along in the message, the way a person would say it.
    const about = attached.map(subject);
    const spoken =
      about.length === 0
        ? text
        : `About ${about.map((item) => `"${item.title}"`).join(", ")}: ${text}`;

    if (threadId === null && LANDING_PATHS.has(window.location.pathname)) {
      window.history.replaceState(null, "", `/agent/${NEW_THREAD_ID}`);
    }
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
        replies[
          isScriptedIntent(intent) ? REPLY_FOR_INTENT[intent] : "default"
        ],
    });
    setDraft("");
    setAttached([]);
  }

  function toggleAttached(next: ChatAttachment) {
    const id = subject(next).id;
    setAttached((current) =>
      current.some((item) => subject(item).id === id)
        ? current.filter((item) => subject(item).id !== id)
        : [...current, next],
    );
  }

  function attach(next: ChatAttachment) {
    const id = subject(next).id;
    setAttached((current) =>
      current.some((item) => subject(item).id === id)
        ? current
        : [...current, next],
    );
  }

  function clearAttached(id?: string) {
    setAttached((current) =>
      id === undefined ? [] : current.filter((item) => subject(item).id !== id),
    );
  }

  function sendIntent(intent: string) {
    send(isPromptIntent(intent) ? INTENT_PROMPT[intent] : "Go ahead.", intent);
  }

  function draftFromEvent(event: EventChipData) {
    const where = event.location === undefined ? "" : ` at ${event.location}`;
    setDraft(
      `Write a LinkedIn post about ${event.title}${where} (${event.whenLabel}).`,
    );
  }

  function open(id: string, stored: readonly AgentMessage[]) {
    if (threadId === id) return;
    setThreadId(id);
    setMessages(stored);
    setStreaming(null);
    setAttached([]);
  }

  function startNew() {
    setThreadId(NEW_THREAD_ID);
    setMessages([]);
    setStreaming(null);
    setDraft("");
    setAttached([]);
    setPreviewState(null);
  }

  function startPostChat(post: PostChipData) {
    setThreadId(NEW_THREAD_ID);
    setMessages([
      {
        id: `post-${post.id}`,
        role: "assistant",
        parts: [postDraftPart(post)],
      },
    ]);
    setStreaming(null);
    setDraft("");
    setAttached([{ kind: "post", post }]);
    setPreviewState(null);
  }

  function expand(next: ComposerPreview) {
    setPreviewState(null);
    setHandoff(next);
  }

  function landed() {
    setHandoff(null);
  }

  const value: ChatState & ChatActions = {
    threadId,
    messages,
    thinking: streaming !== null,
    thinkingStatuses: streaming?.reply.statuses,
    draft,
    attached,
    attachedIds: attached.map((item) => subject(item).id),
    attachedPosts: attached.flatMap((item) =>
      item.kind === "post" ? [item.post] : [],
    ),
    preview,
    lastPreview,
    handoff,
    previews,
    send,
    sendIntent,
    setDraft,
    draftFromEvent,
    attach,
    toggleAttached,
    clearAttached,
    setPreview,
    open,
    startNew,
    startPostChat,
    expand,
    landed,
  };

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
