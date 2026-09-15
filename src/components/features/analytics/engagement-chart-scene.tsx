"use client";

import { motion, useReducedMotion } from "motion/react";
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

import {
  CHART_ANIMATION,
  CHART_AXIS,
  CHART_COLOR,
  CHART_CURSOR_LINE,
  CHART_GRID,
  CHART_TICK,
  ChartTooltip,
  ChartTooltipLabel,
  ChartTooltipSeries,
  valueText,
} from "@/components/features/analytics/chart-theme";
import { useEngagementExplorer } from "@/components/features/analytics/engagement-explorer-provider";
import type { ExplorerPost } from "@/entities/engagement";
import { formatCompact } from "@/lib/format";
import { initials } from "@/lib/initials";
import { fade, stagger } from "@/styles/motion";

/** Marker radius in pixels, and how far two on the same day sit apart. */
const MARKER_R = 10;
const MARKER_GAP = 22;
/** Room above the plot for the markers. */
const MARKER_TOP = 32;

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

/**
 * The curve for the chosen metric with the posts of the window marked above
 * it. Scrubbing the plot reports the day under the cursor; the markers report
 * the post under it.
 */
export function EngagementChartScene() {
  const {
    data,
    metric,
    spec,
    clipId,
    pinned,
    pinnedIndex,
    activePost,
    selectedPostId,
    scrub,
    pin,
    select,
  } = useEngagementExplorer();
  const reduceMotion = useReducedMotion();
  const labelOf = new Map<string, string>([[metric, spec.label]]);

  return (
    <div
      className="h-72 w-full"
      onMouseLeave={() => {
        scrub(null);
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data.points.map((point) => ({ ...point }))}
          margin={{ left: 0, right: 0, top: MARKER_TOP, bottom: 0 }}
          onMouseMove={(state) => {
            scrub(
              state.activeLabel === undefined
                ? null
                : valueText(state.activeLabel),
            );
          }}
        >
          <defs>
            <linearGradient id={`${clipId}-fill`} x1="0" y1="0" x2="0" y2="1">
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
              metric === "rate" ? `${String(value)}%` : formatCompact(value)
            }
          />
          <Tooltip
            cursor={CHART_CURSOR_LINE}
            isAnimationActive={false}
            active={pinned === null ? undefined : true}
            defaultIndex={pinnedIndex}
            content={(props) => {
              const posts = data.postsByLabel.get(valueText(props.label)) ?? [];
              return (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload}
                  label={props.label}
                >
                  {posts.length > 0 ? (
                    <p className="mb-s max-w-56 border-b border-imagine-border pb-s type-small font-medium">
                      {posts.length === 1
                        ? posts[0]?.title
                        : `${String(posts.length)} posts`}
                    </p>
                  ) : null}
                  <ChartTooltipLabel />
                  <ChartTooltipSeries
                    labelOf={labelOf}
                    format={(value) => spec.format(value)}
                  />
                </ChartTooltip>
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
            onHover={pin}
            onPick={(post) => select?.(post)}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
