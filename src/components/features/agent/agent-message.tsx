"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState } from "react";

import { AssetPicker } from "@/components/features/agent/asset-picker";
import {
  CommentDraft,
  type CommentDraftContent,
} from "@/components/features/agent/comment-draft";
import {
  LinkedInPostDraft,
  type PostAuthor,
} from "@/components/features/agent/linkedin-post-draft";
import { ScheduledGraphic } from "@/components/features/agent/scheduled-graphic";
import {
  CHART_PLOT_BY_KIND,
  type ChartDatum,
  ChartHeader,
  ChartHeadline,
  ChartKey,
  type ChartKind,
  ChartProvider,
  type ChartSeries,
} from "@/components/features/analytics/chart-block";
import {
  AssetGrid,
  AssetGridItem,
} from "@/components/features/files/asset-grid";
import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { ThinkingIndicator } from "@/components/motion/thinking-indicator";
import { Button } from "@/components/ui/button";
import { fade, stagger } from "@/styles/motion";

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

interface AgentMessageProps {
  parts: readonly MessagePart[];
  /** Streaming: show the thinking state under the last part. */
  thinking?: boolean;
  thinkingStatuses?: readonly string[];
  onIntent?: (intent: string, postId?: string) => void;
  /** Posts the agent has already put on the calendar in this thread. */
  scheduledPostIds?: ReadonlySet<string>;
  className?: string;
}

const DEFAULT_STATUSES = ["Thinking"] as const;

function assertNever(value: never): never {
  throw new Error(`Unhandled message part: ${JSON.stringify(value)}`);
}

type DraftPartData = Extract<MessagePart, { type: "post_draft" }>;
type ChartPartData = Extract<MessagePart, { type: "chart" }>;

/**
 * A chart in the reply. The message is the frame, so the parts stack in
 * their own column; the header carries the total, or the key when there is
 * more than one series to name.
 */
function ChartPart({ part }: { part: ChartPartData }) {
  const Plot = CHART_PLOT_BY_KIND[part.kind];
  return (
    <ChartProvider data={part.data} series={part.series} tone="accent">
      <div className="flex max-w-lg flex-col gap-l">
        <ChartHeader title={part.title}>
          {part.series.length > 1 ? <ChartKey /> : <ChartHeadline />}
        </ChartHeader>
        <Plot highlightIndex={part.highlightIndex} />
      </div>
    </ChartProvider>
  );
}

/**
 * A draft in the thread. Edit opens the body in place; Done keeps the
 * change in this session. Schedule still goes to the agent. Once that post
 * is on the calendar, the actions go away so the confirmation stands alone.
 */
function DraftPart({
  part,
  onIntent,
  scheduled = false,
}: {
  part: DraftPartData;
  onIntent?: (intent: string, postId?: string) => void;
  scheduled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(part.body);
  const [justScheduled, setJustScheduled] = useState(false);
  const hideActions = scheduled || justScheduled;

  return (
    <LinkedInPostDraft
      author={part.author}
      body={body}
      media={part.media}
      you
      editing={editing}
      onBodyChange={setBody}
      foldControl={!hideActions}
      footer={
        hideActions ? undefined : (
          <>
            <Button
              size="sm"
              onClick={() => {
                setEditing(false);
                setJustScheduled(true);
                onIntent?.("schedule", part.postId);
              }}
            >
              Schedule
            </Button>
            <Button
              size="sm"
              variant="soft"
              aria-pressed={editing}
              onClick={() => {
                setEditing((current) => !current);
              }}
            >
              {editing ? "Done" : "Edit"}
            </Button>
          </>
        )
      }
    />
  );
}

function Part({
  part,
  onIntent,
  scheduledPostIds,
}: {
  part: MessagePart;
  onIntent?: (intent: string, postId?: string) => void;
  scheduledPostIds?: ReadonlySet<string>;
}) {
  switch (part.type) {
    case "text":
      return (
        <p className="max-w-prose type-body whitespace-pre-line">{part.text}</p>
      );
    case "emphasis":
      return (
        <p className="max-w-prose type-heading font-semibold">{part.text}</p>
      );
    case "chart":
      return <ChartPart part={part} />;
    case "post_draft":
      return (
        <DraftPart
          part={part}
          onIntent={onIntent}
          scheduled={scheduledPostIds?.has(part.postId) ?? false}
        />
      );
    case "scheduled":
      return (
        <ScheduledGraphic
          dayNumber={part.dayNumber}
          monthLabel={part.monthLabel}
          timeLabel={part.timeLabel}
          whenLabel={part.whenLabel}
          profileName={part.profileName}
          weekdayIndex={part.weekdayIndex}
          occupied={part.occupied}
        />
      );
    case "asset_picker":
      return (
        <AssetPicker
          prompt={part.prompt}
          assets={part.assets}
          onConfirm={(asset) => onIntent?.(`use-asset:${asset.id}`)}
          onBrowse={() => onIntent?.("browse-files")}
        />
      );
    case "comment_draft":
      return (
        <CommentDraft
          target={part.target}
          author={part.author}
          body={part.body}
          onPost={() => onIntent?.("post-comment", part.commentId)}
        />
      );
    default:
      return assertNever(part);
  }
}

/**
 * One agent turn: parts stream in one after another. No avatar and no
 * bubble; the agent speaks on the surface, the user speaks in a flat bubble.
 */
export function AgentMessage({
  parts,
  thinking = false,
  thinkingStatuses = DEFAULT_STATUSES,
  onIntent,
  scheduledPostIds,
  className,
}: AgentMessageProps) {
  return (
    <div
      data-slot="agent-message"
      className={cn("flex w-full min-w-0 flex-col gap-l", className)}
    >
      {parts.map((part, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...fade.base, delay: index * stagger.list }}
        >
          <Part
            part={part}
            onIntent={onIntent}
            scheduledPostIds={scheduledPostIds}
          />
        </motion.div>
      ))}
      {thinking ? <ThinkingIndicator statuses={thinkingStatuses} /> : null}
    </div>
  );
}

interface UserMessageProps {
  text: string;
  attachments?: readonly AssetTileData[];
  className?: string;
}

/** The user's turn: a flat bubble on the right, attachments above it. */
export function UserMessage({
  text,
  attachments,
  className,
}: UserMessageProps) {
  return (
    <div
      data-slot="user-message"
      className={cn("flex w-full flex-col items-end gap-s", className)}
    >
      {attachments && attachments.length > 0 ? (
        <AssetGrid className="w-48 grid-cols-2">
          {attachments.map((asset) => (
            <AssetGridItem key={asset.id} asset={asset}>
              <AssetTile asset={asset} />
            </AssetGridItem>
          ))}
        </AssetGrid>
      ) : null}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.base}
        className="max-w-[80%] rounded-panel bg-imagine-background px-l py-m type-body text-imagine-foreground"
      >
        {text}
      </motion.p>
    </div>
  );
}
