import type { MessagePart } from "@/components/features/agent/agent-message";
import type {
  TimelineAction,
  TimelineEntry,
} from "@/components/features/agent/timeline";
import type { SidebarThread } from "@/components/layout/sidebar";
import { formatRelative } from "@/lib/format";
import { getDb, getNow } from "@/mocks/db";
import { getClientImpressions } from "@/services/analytics";
import {
  getPosts,
  indexAssetsByPath,
  indexClients,
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

/** `activity_type` read as a headline. Unknown types fall back to the raw value. */
const ACTIVITY_KIND: Record<string, string> = {
  post_drafted: "Drafted",
  post_scheduled: "Scheduled",
  post_published: "Published",
  post_failed: "Failed",
  comment_drafted: "Reply drafted",
  persona_updated: "Persona updated",
};

const REVIEW_ACTIONS: readonly TimelineAction[] = [
  { intent: "approve", label: "Approve", primary: true },
  { intent: "edit", label: "Edit" },
];

const ERROR_ACTIONS: readonly TimelineAction[] = [
  { intent: "retry", label: "Retry", primary: true },
  { intent: "open", label: "Open" },
];

const DONE_ACTIONS: readonly TimelineAction[] = [
  { intent: "open", label: "Open" },
];

function actionsFor(status: string): readonly TimelineAction[] {
  if (status === "needs_review") return REVIEW_ACTIONS;
  if (status === "error") return ERROR_ACTIONS;
  return DONE_ACTIONS;
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
    .agent.activities.toSorted((a, b) => b.created_at.localeCompare(a.created_at))
    .map((activity) => ({
      id: activity.id,
      kind: ACTIVITY_KIND[activity.activity_type] ?? activity.activity_type,
      when: formatRelative(activity.created_at, now),
      title: activity.metadata.title,
      ...(activity.metadata.excerpt === undefined
        ? {}
        : { excerpt: activity.metadata.excerpt }),
      actions: actionsFor(activity.status),
      ...(activity.status === "needs_review" ? { unread: true } : {}),
    }));
}

/**
 * One thread, with `content.parts` resolved into renderable parts: a post
 * reference becomes the draft itself, a chart reference becomes its data.
 */
export function getThread(threadId: string): AgentThread | null {
  const db = getDb();
  const thread = db.mastra.mastra_threads.find((row) => row.id === threadId);
  if (thread === undefined) return null;

  const clients = indexClients();
  const assets = indexAssetsByPath();
  const posts = new Map(getPosts().map((post) => [post.id, post]));

  const messages = db.mastra.mastra_messages
    .filter((message) => message.thread_id === threadId)
    .toSorted((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map<AgentMessage>((message) => ({
      id: message.id,
      role: message.role === "user" ? "user" : "assistant",
      parts: message.content.parts.flatMap<MessagePart>((part) => {
        if (part.text !== undefined) {
          return [
            part.type === "emphasis"
              ? { type: "emphasis", text: part.text }
              : { type: "text", text: part.text },
          ];
        }

        if (part.clientId !== undefined) {
          const chart = getClientImpressions(
            part.clientId,
            part.limit ?? 5,
            part.title,
          );
          return [{ type: "chart", kind: "bar", ...chart }];
        }

        const post = part.postId === undefined ? undefined : posts.get(part.postId);
        const client =
          post === undefined ? undefined : clients.get(post.clientId);
        if (post === undefined || client === undefined) return [];

        return [
          {
            type: "post_draft",
            postId: post.id,
            ...toPostContent(post, client, assets),
          },
        ];
      }),
    }));

  return { id: thread.id, title: thread.title ?? "Untitled", messages };
}
