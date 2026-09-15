"use client";

import { cn } from "cn";

import { AskIconButton } from "@/components/features/analytics/ask-imagine";
import { ChartSkeletonRows } from "@/components/features/analytics/chart-theme";
import { Panel } from "@/components/features/analytics/panel";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Interaction } from "@/entities/engagement";
import { initials } from "@/lib/initials";

type InteractionAction = "reply" | "outreach";

interface InteractionFeedProps {
  items: readonly Interaction[];
  /** Draft a reply to their comment, or a comment on their latest post. */
  onAct?: (item: Interaction, action: InteractionAction) => void;
  onAsk?: (prompt: string, intent?: string) => void;
  className?: string;
}

const VERB: Record<Interaction["kind"], string> = {
  comment: "commented on",
  reaction: "reacted to",
};

/** One always-visible way into the agent; the label lives in the tooltip so
 *  the row keeps its width for what was said. */
function RowAction({
  label,
  icon,
  emphasis = false,
  onClick,
}: {
  label: string;
  icon: IconName;
  emphasis?: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={label}
          onClick={onClick}
          className={cn(
            emphasis && "text-imagine-secondary hover:text-imagine-secondary",
          )}
        >
          <Icon name={icon} size="s" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A row's frame: who it was and what they did it to, then whatever the kind
 * of interaction has to show under it. `actions` sits outside the text column
 * so it stays pinned to the row's right edge.
 */
function InteractionRow({
  item,
  actions,
  children,
}: {
  item: Interaction;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <StaggerItem
      className={cn(
        "group/row flex items-start gap-m rounded-control px-xs py-s transition-colors hover:bg-imagine-surface-raised/60",
      )}
    >
      <Avatar className="mt-xxs">
        {item.avatarUrl ? (
          <AvatarImage src={item.avatarUrl} alt={item.name} />
        ) : null}
        <AvatarFallback>{initials(item.name)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-xxs">
        <p className="type-small">
          <span className="font-medium">{item.name}</span>{" "}
          <span className="text-imagine-foreground-muted">
            {VERB[item.kind]}
          </span>{" "}
          <span className="font-medium">“{item.postTitle}”</span>
          {item.icp ? (
            <Badge variant="accent" className="ml-s h-5 align-middle">
              {item.category}
            </Badge>
          ) : null}
        </p>
        <p className="truncate type-micro tracking-normal text-imagine-foreground-faint normal-case">
          {item.headline} · {item.when}
        </p>
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-xxs text-imagine-foreground-faint transition-colors group-hover/row:text-imagine-foreground-muted">
          {actions}
        </div>
      ) : null}
    </StaggerItem>
  );
}

interface InteractionRowProps {
  item: Interaction;
  onAct?: (item: Interaction, action: InteractionAction) => void;
}

/** What they said, and the two ways to answer it. */
function CommentInteractionRow({ item, onAct }: InteractionRowProps) {
  return (
    <InteractionRow
      item={item}
      actions={
        onAct ? (
          <>
            <RowAction
              label="Draft a reply"
              icon="comment"
              emphasis={item.icp}
              onClick={() => {
                onAct(item, "reply");
              }}
            />
            <RowAction
              label="Comment on their post"
              icon="pen"
              onClick={() => {
                onAct(item, "outreach");
              }}
            />
          </>
        ) : null
      }
    >
      <blockquote className="mt-xxs line-clamp-2 border-l-2 border-imagine-border pl-s type-small text-imagine-foreground-muted">
        {item.excerpt}
      </blockquote>
    </InteractionRow>
  );
}

/** A reaction carries no words, so the only way on is their own post. */
function ReactionInteractionRow({ item, onAct }: InteractionRowProps) {
  return (
    <InteractionRow
      item={item}
      actions={
        onAct ? (
          <RowAction
            label="Comment on their post"
            icon="pen"
            emphasis={item.icp}
            onClick={() => {
              onAct(item, "outreach");
            }}
          />
        ) : null
      }
    >
      <p className="type-small text-imagine-foreground-muted">
        <Icon
          name="thumbs-up"
          size="s"
          className="mr-xs text-imagine-foreground-faint"
        />
        {item.excerpt}
      </p>
    </InteractionRow>
  );
}

const ROW_BY_KIND: Record<
  Interaction["kind"],
  (props: InteractionRowProps) => React.ReactNode
> = {
  comment: CommentInteractionRow,
  reaction: ReactionInteractionRow,
};

/**
 * Who interacted with your posts, newest first. Every row is a way into the
 * agent: draft a reply to what they said, or go and comment on their post.
 * ICP matches are marked so the ones worth the time stand out.
 */
export function InteractionFeed({
  items,
  onAct,
  onAsk,
  className,
}: InteractionFeedProps) {
  return (
    <Panel
      title="Interactions"
      actions={
        onAsk ? (
          <AskIconButton
            prompt="Who from this week's engagers should we reply to first, and what should we say?"
            onAsk={onAsk}
          />
        ) : null
      }
      className={className}
    >
      <Stagger kind="list" className="-mx-xs flex flex-col">
        {items.map((item) => {
          const Row = ROW_BY_KIND[item.kind];
          return <Row key={item.id} item={item} onAct={onAct} />;
        })}
      </Stagger>
    </Panel>
  );
}

/** The feed's frame while this week's interactions are still coming in. */
export function InteractionFeedSkeleton({ className }: { className?: string }) {
  return (
    <Panel title="Interactions" className={className}>
      <ChartSkeletonRows height="h-64" />
    </Panel>
  );
}
