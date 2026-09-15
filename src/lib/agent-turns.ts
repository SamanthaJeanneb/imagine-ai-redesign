import type {
  AgentMessage,
  MessagePart,
  ScriptedReply,
} from "@/entities/agent";
import type { PostChipData } from "@/entities/post";

/**
 * How a turn of the conversation is put together: which canned reply answers
 * an intent, what a button says on the user's behalf, and the shape of the
 * pair of messages a send produces. Pure, and kept out of the service so the
 * browser does not pull the mock database in to format a message.
 */

/** Which canned reply answers an intent. Anything unlisted drafts a post. */
const REPLY_FOR_INTENT: Record<string, string> = {
  schedule: "schedule",
  approve: "schedule",
  comment: "comment",
  reply: "comment",
  outreach: "outreach",
};

/** Every reply intent the mock can answer. */
export const REPLY_INTENTS = [
  "default",
  "schedule",
  "comment",
  "outreach",
] as const;

export type ReplyIntent = (typeof REPLY_INTENTS)[number];

/** Narrow any intent to the reply that answers it. */
export function toReplyIntent(intent: string): ReplyIntent {
  const wanted = REPLY_FOR_INTENT[intent];
  return wanted === "schedule" || wanted === "comment" || wanted === "outreach"
    ? wanted
    : "default";
}

/** The reply that answers an intent, out of the set the chat was given. */
export function replyFor(
  replies: Record<ReplyIntent, ScriptedReply>,
  intent: string,
): ScriptedReply {
  return replies[toReplyIntent(intent)];
}

/** The intents that have something to say on the user's behalf. */
const INTENT_PROMPT: Record<string, string> = {
  schedule: "Schedule it.",
  "browse-files": "Let me pick from the files.",
  comment: "Draft a reply to this comment.",
  reply: "Draft a reply to this comment.",
  "post-comment": "Post it.",
  outreach: "Draft a comment on their latest post.",
};

/** What pressing a button in a reply says on the user's behalf. */
export function toIntentPrompt(intent: string): string {
  return INTENT_PROMPT[intent] ?? "Go ahead.";
}

/** A complete post, as the thread shows it: the draft, ready to edit. */
export function toPostDraftPart(post: PostChipData): MessagePart {
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

/** Anything the chat can speak about carries an id and a title. */
export interface ChatSubject {
  id: string;
  title: string;
}

export interface AgentTurn {
  /** The empty assistant message the reply streams into. */
  replyId: string;
  /** What the user said, then the shell the reply fills. */
  messages: readonly AgentMessage[];
}

/**
 * One turn of the conversation. What is attached rides along in the message,
 * the way a person would say it, rather than travelling beside it.
 */
export function toTurn(
  turn: number,
  text: string,
  about: readonly ChatSubject[],
): AgentTurn {
  const count = String(turn);
  const replyId = `reply-${count}`;
  const spoken =
    about.length === 0
      ? text
      : `About ${about.map((item) => `"${item.title}"`).join(", ")}: ${text}`;

  return {
    replyId,
    messages: [
      {
        id: `user-${count}`,
        role: "user",
        parts: [{ type: "text", text: spoken }],
      },
      { id: replyId, role: "assistant", parts: [] },
    ],
  };
}
