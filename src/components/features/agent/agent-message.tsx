"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState } from "react";

import { AssetPicker } from "@/components/features/agent/asset-picker";
import {
  LinkedInPostDraft,
  type PostAuthor,
} from "@/components/features/agent/linkedin-post-draft";
import {
  type ScheduledChip,
  ScheduledGraphic,
} from "@/components/features/agent/scheduled-graphic";
import {
  ChartBlock,
  type ChartDatum,
  type ChartKind,
  type ChartSeries,
} from "@/components/features/analytics/chart-block";
import { AssetGrid } from "@/components/features/files/asset-grid";
import { type AssetTileData } from "@/components/features/files/asset-tile";
import { ThinkingIndicator } from "@/components/motion/thinking-indicator";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
      chips: readonly ScheduledChip[];
    }
  | { type: "asset_picker"; prompt: string; assets: readonly AssetTileData[] };

interface AgentMessageProps {
  parts: readonly MessagePart[];
  /** Streaming: show the thinking state under the last part. */
  thinking?: boolean;
  thinkingStatuses?: readonly string[];
  onIntent?: (intent: string, postId?: string) => void;
  className?: string;
}

const DEFAULT_STATUSES = ["Thinking"] as const;

function assertNever(value: never): never {
  throw new Error(`Unhandled message part: ${JSON.stringify(value)}`);
}

type DraftPartData = Extract<MessagePart, { type: "post_draft" }>;

/**
 * A draft in the thread. Edit opens the body in place; Done keeps the
 * change in this session. Schedule and another angle still go to the agent.
 */
function DraftPart({
  part,
  onIntent,
}: {
  part: DraftPartData;
  onIntent?: (intent: string, postId?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(part.body);

  return (
    <LinkedInPostDraft
      author={part.author}
      body={body}
      media={part.media}
      editing={editing}
      onBodyChange={setBody}
      footer={
        <>
          <Button
            size="sm"
            onClick={() => {
              setEditing(false);
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
          {editing ? null : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onIntent?.("regenerate", part.postId)}
            >
              <Icon name="arrows-rotate" size="s" data-icon="inline-start" />
              Try another angle
            </Button>
          )}
        </>
      }
    />
  );
}

function Part({
  part,
  onIntent,
}: {
  part: MessagePart;
  onIntent?: (intent: string, postId?: string) => void;
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
      return (
        <ChartBlock
          kind={part.kind}
          data={part.data}
          series={part.series}
          title={part.title}
          tone="accent"
          highlightIndex={part.highlightIndex}
          plain
          className="max-w-lg"
        />
      );
    case "post_draft":
      return <DraftPart part={part} onIntent={onIntent} />;
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
          chips={part.chips}
          onChip={(chip) => onIntent?.(chip.intent, part.postId)}
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
          <Part part={part} onIntent={onIntent} />
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
        <AssetGrid assets={attachments} className="w-48 grid-cols-2" />
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
