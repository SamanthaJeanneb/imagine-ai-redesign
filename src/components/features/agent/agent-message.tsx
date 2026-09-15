"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";

import { AssetPicker } from "@/components/features/agent/asset-picker";
import {
  CommentDraft,
  type CommentDraftContent,
} from "@/components/features/agent/comment-draft";
import {
  LinkedInPostActions,
  LinkedInPostActor,
  LinkedInPostBody,
  LinkedInPostCard,
  LinkedInPostDraft,
  LinkedInPostDraftActions,
  LinkedInPostField,
  LinkedInPostFoldButton,
  LinkedInPostMedia,
  LinkedInPostProvider,
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
  onIntent?: (intent: string) => void;
  /** Posts the agent has already put on the calendar in this thread. */
  scheduledPostIds?: ReadonlySet<string>;
  /** Trails the parts, in the message's own column: the thinking state while the reply is still arriving. */
  children?: ReactNode;
  className?: string;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled message part: ${JSON.stringify(value)}`);
}

/**
 * A part's identity in the message. A draft keys on its post, since the body
 * it seeds its field with only reaches that field on a fresh instance.
 */
function partKey(part: MessagePart, index: number): string {
  return part.type === "post_draft"
    ? `post_draft:${part.postId}`
    : `${part.type}:${String(index)}`;
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
 * What a draft's card and the row under it share. The provider sits above
 * both, so the row can turn the body into a field it does not itself render.
 */
interface DraftContextValue {
  editing: boolean;
  setEditing: (editing: boolean) => void;
  setBody: (body: string) => void;
}

const DraftContext = createContext<DraftContextValue | null>(null);

function useDraft(): DraftContextValue {
  const draft = useContext(DraftContext);
  if (draft === null) {
    throw new Error("Draft parts need a <DraftPart>.");
  }
  return draft;
}

/** The card, with the body swapped for a field while it is being edited. */
function DraftCard() {
  const { editing, setBody } = useDraft();

  return (
    <LinkedInPostCard className={editing ? "ring-2 ring-ring/30" : undefined}>
      <LinkedInPostActor you />
      {editing ? (
        <LinkedInPostField onBodyChange={setBody} />
      ) : (
        <LinkedInPostBody />
      )}
      <LinkedInPostMedia />
      <LinkedInPostActions />
    </LinkedInPostCard>
  );
}

/**
 * A draft in the thread: the card, and whatever acts on it under it. The
 * edited body keeps for this session, so the card holds what was typed
 * whether or not there is still a row beneath it.
 */
function DraftPart({
  part,
  children,
}: {
  part: DraftPartData;
  children?: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(part.body);

  return (
    <DraftContext.Provider value={{ editing, setEditing, setBody }}>
      <LinkedInPostProvider
        author={part.author}
        body={body}
        media={part.media}
        defaultExpanded
      >
        <LinkedInPostDraft>
          <DraftCard />
          {children}
        </LinkedInPostDraft>
      </LinkedInPostProvider>
    </DraftContext.Provider>
  );
}

/**
 * Edit opens the body in place; Done keeps the change in this session.
 * Schedule still goes to the agent, and the row leaves with it so the
 * confirmation that follows stands alone.
 */
function DraftPartActions({
  onIntent,
}: {
  onIntent?: (intent: string) => void;
}) {
  const { editing, setEditing } = useDraft();
  const [scheduled, setScheduled] = useState(false);
  if (scheduled) return null;

  return (
    <LinkedInPostDraftActions>
      <Button
        size="sm"
        onClick={() => {
          setEditing(false);
          setScheduled(true);
          onIntent?.("schedule");
        }}
      >
        Schedule
      </Button>
      <Button
        size="sm"
        variant="soft"
        aria-pressed={editing}
        onClick={() => {
          setEditing(!editing);
        }}
      >
        {editing ? "Done" : "Edit"}
      </Button>
      {editing ? null : <LinkedInPostFoldButton />}
    </LinkedInPostDraftActions>
  );
}

function Part({
  part,
  onIntent,
  scheduledPostIds,
}: {
  part: MessagePart;
  onIntent?: (intent: string) => void;
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
      // Already on the calendar: the agent's confirmation stands for it, so
      // the draft keeps showing with nothing left to act on.
      return scheduledPostIds?.has(part.postId) === true ? (
        <DraftPart part={part} />
      ) : (
        <DraftPart part={part}>
          <DraftPartActions onIntent={onIntent} />
        </DraftPart>
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
          onPost={() => onIntent?.("post-comment")}
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
  onIntent,
  scheduledPostIds,
  children,
  className,
}: AgentMessageProps) {
  return (
    <div
      data-slot="agent-message"
      className={cn("flex w-full min-w-0 flex-col gap-l", className)}
    >
      {parts.map((part, index) => (
        <motion.div
          key={partKey(part, index)}
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
      {children}
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
