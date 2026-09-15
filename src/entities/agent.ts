/**
 * The agent thread as the chat column reads it: the threads in the sidebar, the
 * content parts of a reply, and the timeline of what the agent has already
 * done. Built by `services/agent` from `mastra_messages`.
 */
import type { ChartDatum, ChartKind, ChartSeries } from "@/entities/analytics";
import type { AssetTileData } from "@/entities/asset";
import type { PostAuthor } from "@/entities/post";

/** What the agent is replying to: their comment on your post, or their own post. */
interface CommentTarget {
  author: PostAuthor;
  /** The comment, or the opening of their post. */
  text: string;
  /** "on your post 'The roadmap review…'" or "their latest post". */
  context: string;
}

export interface CommentDraftContent {
  target: CommentTarget;
  /** Who the reply is written as. */
  author: PostAuthor;
  body: string;
}

/**
 * Discriminated content parts, mirroring `mastra_messages.content`. Built by
 * `services/agent`; the renderer is exhaustive.
 */
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "emphasis"; text: string }
  | {
      type: "chart";
      kind: ChartKind;
      data: readonly ChartDatum[];
      series: readonly ChartSeries[];
      title?: string;
      highlightIndex?: number;
    }
  | {
      type: "post_draft";
      postId: string;
      author: PostAuthor;
      body: string;
      media?: readonly AssetTileData[];
    }
  | {
      type: "scheduled";
      postId: string;
      dayNumber: number;
      monthLabel: string;
      timeLabel: string;
      whenLabel: string;
      profileName: string;
      weekdayIndex: number;
      occupied?: readonly number[];
    }
  | { type: "asset_picker"; prompt: string; assets: readonly AssetTileData[] }
  | ({ type: "comment_draft"; commentId?: string } & CommentDraftContent);

export interface TimelineAction {
  /** Sent to the agent as the intent when pressed. */
  intent: string;
  label: string;
  primary?: boolean;
  /** What the press says on the user's behalf, opening a thread with it. */
  prompt?: string;
}

/** What the agent did. `activity` stands in for anything newer than this list. */
export type TimelineKind =
  | "drafted"
  | "scheduled"
  | "published"
  | "failed"
  | "reply_drafted"
  | "persona_updated"
  | "activity";

export interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  /** Relative or absolute, already formatted. */
  when: string;
  title: string;
  /** Optional body preview, e.g. the first lines of a draft. */
  excerpt?: string;
  actions: readonly TimelineAction[];
  /** Happened since the user was last here. */
  unread?: boolean;
}

export interface SidebarThread {
  id: string;
  title: string;
  /** Unread activity since the user last opened it. */
  unread?: boolean;
  /** Message text, so search can match more than the title. */
  preview?: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  parts: readonly MessagePart[];
}

export interface AgentThread {
  id: string;
  title: string;
  messages: readonly AgentMessage[];
}

/** What the agent plays back when there is no real model to answer. */
export interface ScriptedReply {
  statuses: readonly string[];
  parts: readonly MessagePart[];
}
