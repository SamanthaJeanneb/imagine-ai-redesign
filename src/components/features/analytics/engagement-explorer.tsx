"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  usePlotArea,
  useXAxisScale,
  XAxis,
  YAxis,
} from "recharts";

import { AskButton } from "@/components/features/analytics/ask-imagine";
import {
  CHART_ANIMATION,
  CHART_AXIS,
  CHART_COLOR,
  CHART_CURSOR_LINE,
  CHART_GRID,
  CHART_TICK,
  ChartSkeleton,
  ChartTooltip,
} from "@/components/features/analytics/chart-theme";
import { initials, Panel } from "@/components/features/analytics/panel";
import type { PostChipData } from "@/components/features/calendar/post-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCompact } from "@/lib/format";
import { fade, spring, stagger } from "@/styles/motion";

export type ExplorerMetric = "reach" | "rate" | "followers" | "posts";

export const EXPLORER_METRICS: readonly ExplorerMetric[] = [
  "reach",
  "rate",
  "followers",
  "posts",
];

/** One day in the window. Rates are percentages, already × 100. */
export interface ExplorerPoint {
  /** Axis text, e.g. "2 Sep". */
  label: string;
  /** `YYYY-MM-DD`, what posts join on. */
  day: string;
  reach: number;
  rate: number;
  followers: number;
  posts: number;
  /** Running count of CRM contacts who came in through a post. */
  pipeline: number;
}

/** A post published inside the window, placed on the chart by `label`. */
export interface ExplorerPost {
  id: string;
  day: string;
  label: string;
  title: string;
  profileName: string;
  avatarUrl?: string;
  isCompany: boolean;
  category?: string;
  reach: number;
  rate: number;
  followers: number;
  comments: number;
  /** Lets the post be attached to the conversation. */
  chip?: PostChipData;
}

export interface ExplorerData {
  points: readonly ExplorerPoint[];
  posts: readonly ExplorerPost[];
  /** Which labels get an axis tick. */
  xTicks: readonly string[];
  totals: Record<ExplorerMetric, number>;
  pipeline: {
    /** Contacts attributed to content at the end of the window. */
    contacts: number;
    /** Open or won deals with one of those contacts on them. */
    opportunities: number;
    /** Their value, summed. */
    amount: number;
  };
}

interface EngagementExplorerProps {
  data: ExplorerData;
  /** The window, e.g. "Last 30 days". */
  description?: string;
  loading?: boolean;
  /** The post attached to the conversation, if any. */
  selectedPostId?: string;
  /** Pressing a post, on the chart or in the rail. */
  onSelectPost?: (post: ExplorerPost) => void;
  onAsk?: (prompt: string, intent?: string) => void;
  /** Shared with the composer's analytics preview, for the morph. */
  layoutId?: string;
  className?: string;
}

interface MetricSpec {
  label: string;
  short: string;
  format: (value: number) => string;
}

const METRIC: Record<ExplorerMetric, MetricSpec> = {
  reach: { label: "Reach", short: "Reach", format: formatCompact },
  rate: {
    label: "Engagement rate",
    short: "Eng. rate",
    format: (value) => `${value.toFixed(1)}%`,
  },
  followers: {
    label: "Followers gained",
    short: "+ Followers",
    format: (value) => (value > 0 ? `+${formatCompact(value)}` : "0"),
  },
  posts: { label: "Posts", short: "Posts", format: (value) => String(value) },
};

/** Marker radius in pixels, and how far two on the same day sit apart. */
const MARKER_R = 10;
const MARKER_GAP = 22;
/** Room above the plot for the markers. */
const MARKER_TOP = 32;

function text(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

/**
 * Post avatars pinned over the day they went out, hanging a faint rule down
 * to the baseline. Lives inside the chart so it reads the real x scale.
 */
function PostMarkers({
  posts,
  activeId,
  selectedId,
  clipId,
  onHover,
  onPick,
}: {
  posts: readonly ExplorerPost[];
  activeId: string | undefined;
  selectedId: string | undefined;
  clipId: string;
  onHover: (post: ExplorerPost | null) => void;
  onPick: (post: ExplorerPost) => void;
}) {
  const scale = useXAxisScale();
  const plot = usePlotArea();
  const reduceMotion = useReducedMotion();
  if (scale === undefined || plot === undefined) return null;

  const perLabel = new Map<string, number>();
  const cy = plot.y - MARKER_TOP / 2;

  return (
    <g data-slot="post-markers">
      {posts.map((post, index) => {
        const base = scale(post.label);
        if (base === undefined) return null;
        const seen = perLabel.get(post.label) ?? 0;
        perLabel.set(post.label, seen + 1);
        const cx = base + seen * MARKER_GAP;
        const active = post.id === activeId;
        const selected = post.id === selectedId;
        const id = `${clipId}-${post.id}`;
        return (
          <motion.g
            key={post.id}
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...fade.base, delay: index * stagger.list }}
            className="cursor-pointer"
            onMouseEnter={() => {
              onHover(post);
            }}
            onMouseLeave={() => {
              onHover(null);
            }}
            onClick={() => {
              onPick(post);
            }}
          >
            <line
              x1={cx}
              x2={cx}
              y1={cy + MARKER_R}
              y2={plot.y + plot.height}
              stroke={active ? CHART_COLOR.secondary : CHART_COLOR.border}
              strokeDasharray={active ? undefined : "2 3"}
              strokeWidth={1}
            />
            <clipPath id={id}>
              <circle cx={cx} cy={cy} r={MARKER_R} />
            </clipPath>
            <circle
              cx={cx}
              cy={cy}
              r={MARKER_R + 2}
              fill={CHART_COLOR.surface}
              stroke={
                active || selected ? CHART_COLOR.secondary : CHART_COLOR.border
              }
              strokeWidth={active || selected ? 2 : 1}
            />
            {post.avatarUrl ? (
              <image
                href={post.avatarUrl}
                x={cx - MARKER_R}
                y={cy - MARKER_R}
                width={MARKER_R * 2}
                height={MARKER_R * 2}
                preserveAspectRatio="xMidYMid slice"
                clipPath={`url(#${id})`}
              />
            ) : (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={MARKER_R}
                  fill={CHART_COLOR.secondarySoft}
                />
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight={600}
                  fill={CHART_COLOR.secondary}
                >
                  {initials(post.profileName)}
                </text>
              </>
            )}
            {/* A wider hit target than the avatar itself. */}
            <circle cx={cx} cy={cy} r={MARKER_R + 6} fill="transparent" />
          </motion.g>
        );
      })}
    </g>
  );
}

/** The post under the cursor, the pinned one, or the latest. */
function PostDetail({
  post,
  selected,
  onSelect,
}: {
  post: ExplorerPost;
  selected: boolean;
  onSelect?: (post: ExplorerPost) => void;
}) {
  return (
    <motion.article
      key={post.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.fast}
      className="flex flex-col gap-m"
    >
      <div className="flex items-center gap-s">
        <Avatar size="sm" shape={post.isCompany ? "square" : "circle"}>
          {post.avatarUrl ? (
            <AvatarImage src={post.avatarUrl} alt={post.profileName} />
          ) : null}
          <AvatarFallback>{initials(post.profileName)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate type-small text-imagine-foreground-muted">
          {post.profileName} · {post.label}
        </span>
      </div>
      <p className="line-clamp-2 type-small font-medium">{post.title}</p>
      <Button
        size="sm"
        variant={selected ? "default" : "soft"}
        onClick={() => onSelect?.(post)}
        disabled={onSelect === undefined || post.chip === undefined}
        className="self-start"
      >
        <Icon
          name={selected ? "check" : "paperclip"}
          size="s"
          data-icon="inline-start"
        />
        {selected ? "Attached" : "Attach to chat"}
      </Button>
    </motion.article>
  );
}

/**
 * Engagement over the window and the posts behind it. One metric shows at a
 * time (the tabs). Hovering the chart scrubs through days and the detail rail
 * follows; hovering a post in the rail pins the chart to its day. Pressing a
 * post, on the chart or in the rail, attaches it.
 */
export function EngagementExplorer({
  data,
  description,
  loading = false,
  selectedPostId,
  onSelectPost,
  onAsk,
  layoutId,
  className,
}: EngagementExplorerProps) {
  const reduceMotion = useReducedMotion();
  const clipId = useId().replace(/:/g, "");
  const [metric, setMetric] = useState<ExplorerMetric>("reach");
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [pinned, setPinned] = useState<ExplorerPost | null>(null);

  const spec = METRIC[metric];
  const postsByLabel = useMemo(() => {
    const map = new Map<string, ExplorerPost[]>();
    for (const post of data.posts) {
      const list = map.get(post.label);
      if (list) list.push(post);
      else map.set(post.label, [post]);
    }
    return map;
  }, [data.posts]);
  const labelIndex = useMemo(
    () => new Map(data.points.map((point, index) => [point.label, index])),
    [data.points],
  );

  const scrubbed =
    hoverLabel === null ? undefined : postsByLabel.get(hoverLabel)?.[0];
  const activePost =
    pinned ??
    scrubbed ??
    data.posts.find((post) => post.id === selectedPostId) ??
    data.posts.at(-1);
  const pinnedIndex =
    pinned === null ? undefined : labelIndex.get(pinned.label);
  const labelOf = useMemo(
    () => new Map<string, string>([[metric, spec.label]]),
    [metric, spec.label],
  );

  const tabs = (
    <ToggleGroup
      size="sm"
      value={metric}
      onValueChange={(value) => {
        if (EXPLORER_METRICS.includes(value as ExplorerMetric)) {
          setMetric(value as ExplorerMetric);
        }
      }}
      aria-label="Metric"
    >
      {EXPLORER_METRICS.map((key) => (
        <ToggleGroupItem key={key} value={key}>
          {METRIC[key].short}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );

  if (loading) {
    return (
      <Panel
        title="Engagement"
        description={description}
        actions={tabs}
        className={className}
      >
        <ChartSkeleton kind="line" height="h-72" />
      </Panel>
    );
  }

  return (
    <Panel
      title="Engagement"
      description={description}
      actions={
        <>
          {tabs}
          {onAsk ? (
            <AskButton
              prompt={`Walk me through ${spec.label.toLowerCase()} over ${(description ?? "this window").toLowerCase()} and what drove it.`}
              onAsk={onAsk}
            />
          ) : null}
        </>
      }
      layoutId={layoutId}
      className={className}
    >
      <div className="grid min-w-0 gap-l @2xl/panel:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-col gap-m">
          <div
            className="h-72 w-full"
            onMouseLeave={() => {
              setHoverLabel(null);
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data.points.map((point) => ({ ...point }))}
                margin={{ left: 0, right: 0, top: MARKER_TOP, bottom: 0 }}
                onMouseMove={(state) => {
                  setHoverLabel(
                    state.activeLabel === undefined
                      ? null
                      : text(state.activeLabel),
                  );
                }}
              >
                <defs>
                  <linearGradient
                    id={`${clipId}-fill`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={CHART_COLOR.secondary}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor={CHART_COLOR.secondary}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} {...CHART_GRID} />
                <XAxis
                  dataKey="label"
                  {...CHART_AXIS}
                  tickMargin={8}
                  interval={0}
                  ticks={[...data.xTicks]}
                  tick={CHART_TICK}
                />
                <YAxis
                  {...CHART_AXIS}
                  tickMargin={6}
                  width={40}
                  tickCount={5}
                  domain={[0, "auto"]}
                  tick={CHART_TICK}
                  tickFormatter={(value: number) =>
                    metric === "rate"
                      ? `${String(value)}%`
                      : formatCompact(value)
                  }
                />
                <Tooltip
                  cursor={CHART_CURSOR_LINE}
                  isAnimationActive={false}
                  active={pinned === null ? undefined : true}
                  defaultIndex={pinnedIndex}
                  content={(props) => {
                    const posts = postsByLabel.get(text(props.label)) ?? [];
                    return (
                      <ChartTooltip
                        active={props.active}
                        payload={props.payload}
                        label={props.label}
                        labelOf={labelOf}
                        format={(value) => spec.format(value)}
                        header={
                          posts.length > 0 ? (
                            <p className="mb-s max-w-56 border-b border-imagine-border pb-s type-small font-medium">
                              {posts.length === 1
                                ? posts[0]?.title
                                : `${String(posts.length)} posts`}
                            </p>
                          ) : undefined
                        }
                      />
                    );
                  }}
                />
                <Area
                  dataKey={metric}
                  type="monotone"
                  stroke={CHART_COLOR.secondary}
                  strokeWidth={2}
                  fill={`url(#${clipId}-fill)`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  isAnimationActive={!reduceMotion}
                  {...CHART_ANIMATION}
                />
                <PostMarkers
                  posts={data.posts}
                  activeId={activePost?.id}
                  selectedId={selectedPostId}
                  clipId={clipId}
                  onHover={setPinned}
                  onPick={(post) => onSelectPost?.(post)}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <aside
          className="flex min-w-0 flex-col gap-l xl:border-l xl:border-imagine-border xl:pl-l"
          onMouseLeave={() => {
            setPinned(null);
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {activePost ? (
              <PostDetail
                key={activePost.id}
                post={activePost}
                selected={activePost.id === selectedPostId}
                onSelect={onSelectPost}
              />
            ) : (
              <p
                key="empty"
                className="type-small text-imagine-foreground-faint"
              >
                No posts in this window.
              </p>
            )}
          </AnimatePresence>
          {data.posts.length > 0 ? (
            <ul className="-mx-xs flex max-h-40 flex-col overflow-y-auto border-t border-imagine-border pt-s">
              {data.posts
                .slice()
                .reverse()
                .map((post) => {
                  const active = post.id === activePost?.id;
                  return (
                    <li key={post.id}>
                      <motion.button
                        type="button"
                        onMouseEnter={() => {
                          setPinned(post);
                        }}
                        onFocus={() => {
                          setPinned(post);
                        }}
                        onClick={() => onSelectPost?.(post)}
                        whileTap={{ scale: 0.985 }}
                        transition={spring.snappy}
                        className={cn(
                          "flex w-full items-center gap-s rounded-control px-xs py-xxs text-left transition-colors",
                          active
                            ? "bg-imagine-surface-raised"
                            : "hover:bg-imagine-surface-raised/60",
                        )}
                      >
                        <span className="w-12 shrink-0 type-small text-imagine-foreground-faint tabular-nums">
                          {post.label}
                        </span>
                        <span className="min-w-0 flex-1 truncate type-small">
                          {post.title}
                        </span>
                        <span className="shrink-0 type-small font-medium tabular-nums">
                          {metric === "posts"
                            ? String(post.comments)
                            : spec.format(post[metric])}
                        </span>
                      </motion.button>
                    </li>
                  );
                })}
            </ul>
          ) : null}
        </aside>
      </div>
    </Panel>
  );
}
