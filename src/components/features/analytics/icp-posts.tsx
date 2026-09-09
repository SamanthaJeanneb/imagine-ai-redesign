"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  type ScatterShapeProps,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { AskButton } from "@/components/features/analytics/ask-imagine";
import {
  CHART_ANIMATION,
  CHART_AXIS,
  CHART_COLOR,
  CHART_GRID,
  CHART_TICK,
  ChartSkeleton,
  ChartTooltip,
} from "@/components/features/analytics/chart-theme";
import { initials, Panel } from "@/components/features/analytics/panel";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import { Disclosure } from "@/components/motion/disclosure";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { type IcpCategory, ICP_THRESHOLD } from "@/entities/engagement";
import { formatCompact } from "@/lib/format";
import { spring } from "@/styles/motion";

/** Someone who reacted to or commented on a post, with their ICP read. */
export interface Engager {
  id: string;
  name: string;
  headline: string;
  avatarUrl?: string;
  category: IcpCategory;
  /** 0 to 100. */
  score: number;
  signals: readonly string[];
  action: "commented" | "reacted";
  /** The comment, when they left one. */
  excerpt?: string;
  commentId?: string;
}

export interface IcpPost {
  id: string;
  title: string;
  /** "2 Sep". */
  label: string;
  profileName: string;
  reach: number;
  engagers: readonly Engager[];
  /** Engagers at or above the ICP threshold. */
  icpCount: number;
  /** `icpCount / engagers`, 0 to 100. */
  icpShare: number;
  chip?: PostChipData;
}

export interface IcpData {
  posts: readonly IcpPost[];
}

/** What the user wants to do about an engager. */
export type EngageAction = "reply" | "outreach";

interface IcpPostsProps {
  data: IcpData;
  description?: string;
  loading?: boolean;
  /** Draft a reply to their comment, or a comment on their post. */
  onEngage?: (engager: Engager, post: IcpPost, action: EngageAction) => void;
  onAsk?: (prompt: string, intent?: string) => void;
  className?: string;
}

const CATEGORY_VARIANT: Record<
  IcpCategory,
  "accent" | "soft" | "outline" | "success"
> = {
  "Decision maker": "accent",
  Champion: "success",
  Practitioner: "soft",
  Peer: "soft",
  "Outside ICP": "outline",
};

const AVATAR_STACK = 4;

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

/** ICP share in words for the tooltip and the rows. */
function share(value: number): string {
  return `${String(Math.round(value))}% ICP`;
}

/**
 * A bubble per post. Area follows the engager count; the active post fills
 * solid, the rest stay translucent so overlaps read.
 */
function bubble(activeId: string | undefined) {
  return function Bubble(props: ScatterShapeProps) {
    const datum: unknown = props.payload;
    const id =
      typeof datum === "object" && datum !== null && "id" in datum
        ? text(datum.id)
        : "";
    const active = id === activeId;
    const r = Math.max(4, Math.sqrt(props.size / Math.PI));
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={r}
        fill={CHART_COLOR.secondary}
        fillOpacity={active ? 0.9 : 0.35}
        stroke={CHART_COLOR.secondary}
        strokeWidth={active ? 2 : 1}
        className="transition-[fill-opacity] duration-200"
      />
    );
  };
}

function EngagerAvatar({
  engager,
  size = "sm",
  className,
}: {
  engager: Engager;
  size?: "sm" | "default";
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      {engager.avatarUrl ? (
        <AvatarImage src={engager.avatarUrl} alt={engager.name} />
      ) : null}
      <AvatarFallback>{initials(engager.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Who this is and where they sit against the ICP. */
function EngagerCard({
  engager,
  post,
  onEngage,
}: {
  engager: Engager;
  post: IcpPost;
  onEngage?: (engager: Engager, post: IcpPost, action: EngageAction) => void;
}) {
  return (
    <div className="flex flex-col gap-m p-m">
      <div className="flex items-start gap-s">
        <EngagerAvatar engager={engager} size="default" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate type-small font-medium">
            {engager.name}
          </span>
          <span className="line-clamp-2 type-small text-imagine-foreground-muted">
            {engager.headline}
          </span>
        </div>
        <Badge
          variant={CATEGORY_VARIANT[engager.category]}
          className="shrink-0"
        >
          {engager.category}
        </Badge>
      </div>
      {engager.excerpt ? (
        <blockquote className="border-l-2 border-imagine-border pl-s type-small text-imagine-foreground-muted">
          “{engager.excerpt}”
        </blockquote>
      ) : null}
      {onEngage ? (
        <div className="flex items-center gap-s">
          {engager.action === "commented" ? (
            <Button
              size="sm"
              onClick={() => {
                onEngage(engager, post, "reply");
              }}
            >
              <Icon name="comment" size="s" data-icon="inline-start" />
              Draft a reply
            </Button>
          ) : null}
          <Button
            size="sm"
            variant={engager.action === "commented" ? "soft" : "default"}
            onClick={() => {
              onEngage(engager, post, "outreach");
            }}
          >
            <Icon name="pen" size="s" data-icon="inline-start" />
            Comment on their post
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function PostRow({
  post,
  active,
  onHover,
  onEngage,
}: {
  post: IcpPost;
  active: boolean;
  onHover: (id: string | null) => void;
  onEngage?: (engager: Engager, post: IcpPost, action: EngageAction) => void;
}) {
  const [open, setOpen] = useState(false);
  const stack = post.engagers.slice(0, AVATAR_STACK);
  const rest = post.engagers.length - stack.length;

  return (
    <StaggerItem
      className={cn(
        "-mx-xs rounded-control px-xs transition-colors",
        active && "bg-imagine-surface-raised/60",
      )}
      onMouseEnter={() => {
        onHover(post.id);
      }}
      onMouseLeave={() => {
        onHover(null);
      }}
    >
      <div className="flex items-center gap-m py-s">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate type-small font-medium">{post.title}</span>
          <span className="type-micro text-imagine-foreground-faint">
            {post.profileName} · {post.label}
          </span>
        </div>
        <div className="hidden w-28 shrink-0 flex-col gap-xxs sm:flex">
          <span className="type-micro text-imagine-foreground-faint">
            {share(post.icpShare)}
          </span>
          <span className="h-1.5 overflow-hidden bg-imagine-border/60">
            <motion.span
              className="block h-full origin-left bg-imagine-secondary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: post.icpShare / 100 }}
              transition={spring.soft}
            />
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          <div className="flex -space-x-2">
            {stack.map((engager) => (
              <HoverCard key={engager.id}>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    aria-label={engager.name}
                    className="rounded-full ring-2 ring-imagine-surface transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:ring-ring/40"
                  >
                    <EngagerAvatar engager={engager} />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-72 p-0">
                  <EngagerCard
                    engager={engager}
                    post={post}
                    onEngage={onEngage}
                  />
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
          <Button
            size="xs"
            variant="ghost"
            aria-expanded={open}
            onClick={() => {
              setOpen((current) => !current);
            }}
            className="ml-xs tabular-nums"
          >
            {rest > 0 ? `+${String(rest)}` : "All"}
            <Icon
              name="chevron-down"
              size="s"
              data-icon="inline-end"
              className={cn(
                "transition-transform duration-200",
                open && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>
      <Disclosure open={open}>
        <ul className="mb-s grid gap-xs border-t border-imagine-border pt-s @xl/panel:grid-cols-2">
          {post.engagers.map((engager) => (
            <li
              key={engager.id}
              className="flex items-center gap-s rounded-control bg-imagine-background px-s py-xs"
            >
              <EngagerAvatar engager={engager} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate type-small font-medium">
                  {engager.name}
                </span>
                <span className="truncate type-micro tracking-normal text-imagine-foreground-faint normal-case">
                  {engager.action === "commented" ? "Commented" : "Reacted"} ·{" "}
                  {engager.headline}
                </span>
              </span>
              <Badge
                variant={CATEGORY_VARIANT[engager.category]}
                className="hidden lg:inline-flex"
              >
                {engager.category}
              </Badge>
              {onEngage ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={
                    engager.action === "commented"
                      ? "Draft a reply"
                      : "Comment on their post"
                  }
                  onClick={() => {
                    onEngage(
                      engager,
                      post,
                      engager.action === "commented" ? "reply" : "outreach",
                    );
                  }}
                >
                  <Icon
                    name={engager.action === "commented" ? "comment" : "pen"}
                    size="s"
                  />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Disclosure>
    </StaggerItem>
  );
}

/**
 * Posts against the people they reached. The scatter puts reach on one axis
 * and ICP share on the other, so the posts worth repeating sit top right.
 * Each row carries the engagers: hover a face for who they are; open the row
 * for everyone. Every person is a way into the agent.
 */
export function IcpPosts({
  data,
  description,
  loading = false,
  onEngage,
  onAsk,
  className,
}: IcpPostsProps) {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<string | null>(null);
  const shape = bubble(activeId ?? undefined);
  const labelOf = new Map([
    ["reach", "Reach"],
    ["icpShare", "ICP share"],
    ["engagerCount", "Engagers"],
  ]);

  if (loading) {
    return (
      <Panel
        title="Posts and who they reached"
        description={description}
        className={className}
      >
        <div className="grid gap-l @3xl/panel:grid-cols-[18rem_minmax(0,1fr)]">
          <ChartSkeleton kind="line" height="h-52" header={false} />
          <ChartSkeleton kind="rows" height="h-52" header={false} />
        </div>
      </Panel>
    );
  }

  const points = data.posts.map((post) => ({
    id: post.id,
    title: post.title,
    reach: post.reach,
    icpShare: post.icpShare,
    engagerCount: post.engagers.length,
  }));
  return (
    <Panel
      title="Posts and who they reached"
      description={description}
      actions={
        onAsk ? (
          <AskButton
            prompt={`Which of these posts brought in the most decision makers, and what did they have in common? Threshold is ${String(ICP_THRESHOLD)}.`}
            onAsk={onAsk}
          />
        ) : null
      }
      className={className}
    >
      <div className="grid gap-l @3xl/panel:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="flex flex-col">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
                onMouseLeave={() => {
                  setActiveId(null);
                }}
              >
                <CartesianGrid {...CHART_GRID} />
                <XAxis
                  dataKey="reach"
                  type="number"
                  name="Reach"
                  {...CHART_AXIS}
                  tick={CHART_TICK}
                  tickMargin={8}
                  tickCount={4}
                  domain={[0, "auto"]}
                  tickFormatter={formatCompact}
                />
                <YAxis
                  dataKey="icpShare"
                  type="number"
                  name="ICP share"
                  {...CHART_AXIS}
                  tick={CHART_TICK}
                  tickMargin={6}
                  width={44}
                  domain={[0, 100]}
                  ticks={[0, 50, 100]}
                  tickFormatter={(value: number) => `${String(value)}%`}
                />
                <ZAxis dataKey="engagerCount" range={[80, 520]} />
                <Tooltip
                  isAnimationActive={false}
                  cursor={false}
                  content={(props) => {
                    const first: unknown = props.payload[0]?.payload;
                    const title =
                      typeof first === "object" &&
                      first !== null &&
                      "title" in first
                        ? text(first.title)
                        : "";
                    return (
                      <ChartTooltip
                        active={props.active}
                        payload={props.payload}
                        hideLabel
                        labelOf={labelOf}
                        format={(value, key) =>
                          key === "reach"
                            ? formatCompact(value)
                            : key === "icpShare"
                              ? `${String(Math.round(value))}%`
                              : String(value)
                        }
                        header={
                          title === "" ? undefined : (
                            <p className="mb-s max-w-56 border-b border-imagine-border pb-s type-small font-medium">
                              {title}
                            </p>
                          )
                        }
                      />
                    );
                  }}
                />
                <Scatter
                  data={points}
                  shape={shape}
                  isAnimationActive={!reduceMotion}
                  {...CHART_ANIMATION}
                  onMouseEnter={(point: { payload?: { id?: unknown } }) => {
                    const id = point.payload?.id;
                    if (typeof id === "string") setActiveId(id);
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Stagger
          kind="list"
          className="flex min-w-0 flex-col divide-y divide-imagine-border"
        >
          {data.posts.map((post) => (
            <PostRow
              key={post.id}
              post={post}
              active={post.id === activeId}
              onHover={setActiveId}
              onEngage={onEngage}
            />
          ))}
        </Stagger>
      </div>
    </Panel>
  );
}
