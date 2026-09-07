import type { MessagePart } from "@/components/features/agent/agent-message";
import type { ScheduledChip } from "@/components/features/agent/scheduled-graphic";
import type {
  TimelineAction,
  TimelineEntry,
} from "@/components/features/agent/timeline";
import type { SidebarThread } from "@/components/layout/sidebar";
import type { Client } from "@/entities/client";
import type { Post } from "@/entities/post";
import type { MessagePartRow } from "@/entities/rows";
import {
  formatMonthShort,
  formatRelative,
  formatTime,
  formatWhen,
  toTitle,
  weekdayIndex,
} from "@/lib/format";
import { getDb, getNow } from "@/mocks/db";
import { getClientImpressions } from "@/services/analytics";
import {
  getClientAssets,
  getPosts,
  indexAssetsByPath,
  indexClients,
  toAssetTile,
  toPostContent,
} from "@/services/posts";

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

/** `activity_type` read as a headline. Unknown types fall back to the raw value. */
const ACTIVITY_KIND: Record<string, string> = {
  post_drafted: "Drafted",
  post_scheduled: "Scheduled",
  post_published: "Published",
  post_failed: "Failed",
  comment_drafted: "Reply drafted",
  persona_updated: "Persona updated",
};

const SCHEDULED_CHIPS: readonly ScheduledChip[] = [
  { intent: "move", label: "Move it" },
  { intent: "edit", label: "Edit the post" },
  { intent: "unschedule", label: "Unschedule" },
];

/**
 * Timeline actions. `prompt` is what the user is taken to have said when they
 * press the button, so acting on an entry reads as the first message of a thread.
 */
function actionsFor(status: string, title: string): readonly TimelineAction[] {
  if (status === "needs_review") {
    return [
      {
        intent: "approve",
        label: "Approve",
        primary: true,
        prompt: `Approve this and send it: ${title}`,
      },
      { intent: "edit", label: "Edit", prompt: `Rework this: ${title}` },
    ];
  }
  if (status === "error") {
    return [
      {
        intent: "retry",
        label: "Retry",
        primary: true,
        prompt: `Try this one again: ${title}`,
      },
      { intent: "open", label: "Open", prompt: `Show me: ${title}` },
    ];
  }
  return [{ intent: "open", label: "Open", prompt: `Show me: ${title}` }];
}

/** Sidebar, Posts. Threads the org has with the agent, most recent first. */
export function getThreads(): readonly SidebarThread[] {
  return getDb()
    .mastra.mastra_threads.toSorted((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )
    .map((thread) => ({
      id: thread.id,
      title: thread.title ?? "Untitled",
      ...(thread.metadata.unread ? { unread: true } : {}),
    }));
}

/** The landing timeline: what the agent did while the user was away. */
export function getTimeline(): readonly TimelineEntry[] {
  const now = getNow();

  return getDb()
    .agent.activities.toSorted((a, b) =>
      b.created_at.localeCompare(a.created_at),
    )
    .map((activity) => ({
      id: activity.id,
      kind: ACTIVITY_KIND[activity.activity_type] ?? activity.activity_type,
      when: formatRelative(activity.created_at, now),
      title: activity.metadata.title,
      ...(activity.metadata.excerpt === undefined
        ? {}
        : { excerpt: activity.metadata.excerpt }),
      actions: actionsFor(activity.status, activity.metadata.title),
      ...(activity.status === "needs_review" ? { unread: true } : {}),
    }));
}

/** The "Scheduled" confirmation graphic: the day, and the week around it. */
function toScheduledPart(
  post: Post,
  client: Client,
  posts: readonly Post[],
): MessagePart | null {
  if (post.scheduledAt === null) return null;
  const index = weekdayIndex(post.scheduledAt);
  const day = new Date(post.scheduledAt);
  const weekStart = new Date(day.getTime() - index * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const weekEnd = new Date(day.getTime() + (7 - index) * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const occupied = posts.flatMap((other) =>
    other.id !== post.id &&
    other.scheduledAt !== null &&
    other.scheduledAt.slice(0, 10) >= weekStart &&
    other.scheduledAt.slice(0, 10) < weekEnd
      ? [weekdayIndex(other.scheduledAt)]
      : [],
  );

  return {
    type: "scheduled",
    postId: post.id,
    dayNumber: day.getUTCDate(),
    monthLabel: formatMonthShort(post.scheduledAt),
    timeLabel: formatTime(post.scheduledAt),
    whenLabel: formatWhen(post.scheduledAt),
    profileName: client.name,
    weekdayIndex: index,
    occupied,
    chips: SCHEDULED_CHIPS,
  };
}

/**
 * Resolves stored or scripted parts into something renderable: a post reference
 * becomes the draft itself, a client reference becomes their numbers or their
 * assets. Anything that cannot be resolved is dropped. The indexes are built
 * once per message set, so a long thread reads the tables once.
 */
function partResolver(): (row: MessagePartRow) => readonly MessagePart[] {
  const clients = indexClients();
  const assets = indexAssetsByPath();
  const posts = getPosts();

  return function resolvePart(row) {
    switch (row.type) {
      case "text":
        return row.text === undefined ? [] : [{ type: "text", text: row.text }];

      case "emphasis":
        return row.text === undefined
          ? []
          : [{ type: "emphasis", text: row.text }];

      case "chart": {
        if (row.clientId === undefined) return [];
        const chart = getClientImpressions(
          row.clientId,
          row.limit ?? 5,
          row.title,
        );
        return [{ type: "chart", kind: "bar", ...chart }];
      }

      case "asset_picker": {
        if (row.clientId === undefined || row.prompt === undefined) return [];
        return [
          {
            type: "asset_picker",
            prompt: row.prompt,
            assets: getClientAssets(row.clientId)
              .slice(0, row.limit ?? 3)
              .map(toAssetTile),
          },
        ];
      }

      case "post_draft":
      case "scheduled": {
        const post = posts.find((item) => item.id === row.postId);
        const client =
          post === undefined ? undefined : clients.get(post.clientId);
        if (post === undefined || client === undefined) return [];

        if (row.type === "scheduled") {
          const part = toScheduledPart(post, client, posts);
          return part === null ? [] : [part];
        }

        return [
          {
            type: "post_draft",
            postId: post.id,
            ...toPostContent(post, client, assets),
          },
        ];
      }

      default:
        return [];
    }
  };
}

/** One thread, with every stored part resolved. */
export function getThread(threadId: string): AgentThread | null {
  const db = getDb();
  const thread = db.mastra.mastra_threads.find((row) => row.id === threadId);
  if (thread === undefined) return null;

  const resolvePart = partResolver();
  const messages = db.mastra.mastra_messages
    .filter((message) => message.thread_id === threadId)
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map<AgentMessage>((message) => ({
      id: message.id,
      role: message.role === "user" ? "user" : "assistant",
      parts: message.content.parts.flatMap(resolvePart),
    }));

  return { id: thread.id, title: thread.title ?? "Untitled", messages };
}

/**
 * The reply a send plays back. `schedule` and `approve` confirm a slot;
 * everything else gets the drafting reply.
 */
export function getScriptedReply(intent = "default"): ScriptedReply {
  const replies = getDb().agent.canned_replies;
  const wanted =
    intent === "schedule" || intent === "approve" ? "schedule" : "default";
  const reply =
    replies.find((row) => row.intent === wanted) ??
    replies.find((row) => row.intent === "default");

  if (reply === undefined) return { statuses: ["Thinking"], parts: [] };

  return {
    statuses: reply.statuses,
    parts: reply.parts.flatMap(partResolver()),
  };
}

/** The title a new thread takes in the sidebar: the first thing the user said. */
export function toThreadTitle(message: string): string {
  return toTitle(message, 40);
}
