"use client";

import { cn } from "cn";

import { AskButton } from "@/components/features/analytics/ask-imagine";
import { ChartSkeleton } from "@/components/features/analytics/chart-theme";
import { initials, Panel } from "@/components/features/analytics/panel";
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
import type { IcpCategory } from "@/entities/engagement";

/** Someone did something to one of your posts. */
export interface Interaction {
  id: string;
  kind: "comment" | "reaction";
  profileId: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  category: IcpCategory;
  /** In the ICP: the row gets the accent and the reply is worth drafting. */
  icp: boolean;
  postId: string;
  postTitle: string;
  /** "2h ago". */
  when: string;
  /** The comment, or the reaction type ("insightful"). */
  excerpt: string;
  commentId?: string;
}

export type InteractionAction = "reply" | "outreach";

interface InteractionFeedProps {
  items: readonly Interaction[];
  description?: string;
  loading?: boolean;
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
 * Who interacted with your posts, newest first. Every row is a way into the
 * agent: draft a reply to what they said, or go and comment on their post.
 * ICP matches are marked so the ones worth the time stand out.
 */
export function InteractionFeed({
  items,
  description,
  loading = false,
  onAct,
  onAsk,
  className,
}: InteractionFeedProps) {
  if (loading) {
    return (
      <Panel
        title="Interactions"
        description={description}
        className={className}
      >
        <ChartSkeleton kind="rows" height="h-64" header={false} />
      </Panel>
    );
  }

  return (
    <Panel
      title="Interactions"
      description={description}
      actions={
        onAsk ? (
          <AskButton
            compact
            prompt="Who from this week's engagers should we reply to first, and what should we say?"
            onAsk={onAsk}
          />
        ) : null
      }
      className={className}
    >
      <Stagger kind="list" className="-mx-xs flex flex-col">
        {items.map((item) => (
          <StaggerItem
            key={item.id}
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
              {item.kind === "comment" ? (
                <blockquote className="mt-xxs line-clamp-2 border-l-2 border-imagine-border pl-s type-small text-imagine-foreground-muted">
                  {item.excerpt}
                </blockquote>
              ) : (
                <p className="type-small text-imagine-foreground-muted">
                  <Icon
                    name="thumbs-up"
                    size="s"
                    className="mr-xs text-imagine-foreground-faint"
                  />
                  {item.excerpt}
                </p>
              )}
            </div>
            {onAct ? (
              <div className="flex shrink-0 items-center gap-xxs text-imagine-foreground-faint transition-colors group-hover/row:text-imagine-foreground-muted">
                {item.kind === "comment" ? (
                  <RowAction
                    label="Draft a reply"
                    icon="comment"
                    emphasis={item.icp}
                    onClick={() => {
                      onAct(item, "reply");
                    }}
                  />
                ) : null}
                <RowAction
                  label="Comment on their post"
                  icon="pen"
                  emphasis={item.icp && item.kind === "reaction"}
                  onClick={() => {
                    onAct(item, "outreach");
                  }}
                />
              </div>
            ) : null}
          </StaggerItem>
        ))}
      </Stagger>
    </Panel>
  );
}
