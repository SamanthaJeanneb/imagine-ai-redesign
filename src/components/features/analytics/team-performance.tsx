"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AskButton } from "@/components/features/analytics/ask-imagine";
import {
  CHART_ANIMATION,
  CHART_AXIS,
  CHART_COLOR,
  CHART_CURSOR_BAND,
  CHART_GRID,
  CHART_TICK,
  ChartSkeleton,
  ChartTooltip,
} from "@/components/features/analytics/chart-theme";
import { initials, Panel } from "@/components/features/analytics/panel";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCompact } from "@/lib/format";
import { fade, swapUp } from "@/styles/motion";

export type TeamMetric = "reach" | "rate";

export interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  isCompany: boolean;
  posts: number;
  /** Total impressions in the window. */
  reach: number;
  /** Mean engagement rate, percent. */
  rate: number;
  followers: number;
  /** The post label they do best in, by average reach. */
  bestCategory?: string;
}

/** One category, with a value per member id. */
export type TeamDatum = { label: string } & Record<string, string | number>;

export interface TeamData {
  members: readonly TeamMember[];
  /** Average reach per post, by category, one key per member. */
  reach: readonly TeamDatum[];
  /** Mean engagement rate (percent), by category, one key per member. */
  rate: readonly TeamDatum[];
}

interface TeamPerformanceProps {
  data: TeamData;
  description?: string;
  loading?: boolean;
  onAsk?: (prompt: string, intent?: string) => void;
  className?: string;
}

const METRIC: Record<
  TeamMetric,
  { label: string; format: (value: number) => string }
> = {
  reach: { label: "Avg reach per post", format: formatCompact },
  rate: {
    label: "Engagement rate",
    format: (value) => `${value.toFixed(1)}%`,
  },
};

/** One accent, stepped. Members are ranked, so the leader is the solid one. */
const OPACITY_STEPS = [1, 0.72, 0.52, 0.36, 0.24, 0.16] as const;

/** The same steps as utilities, for the leaderboard swatches. */
const OPACITY_CLASS = [
  "opacity-100",
  "opacity-70",
  "opacity-50",
  "opacity-35",
  "opacity-25",
  "opacity-15",
] as const;

function opacityFor(rank: number): number {
  return OPACITY_STEPS[rank] ?? OPACITY_STEPS[OPACITY_STEPS.length - 1] ?? 0.16;
}

function opacityClass(rank: number): string {
  return OPACITY_CLASS[rank] ?? OPACITY_CLASS[OPACITY_CLASS.length - 1] ?? "";
}

/** The stock rectangle with the member's opacity; dimmed when another member is hovered. */
function memberBar(opacity: number, dimmed: boolean) {
  return function MemberBar(props: BarShapeProps) {
    return (
      <Rectangle
        {...props}
        fill={CHART_COLOR.secondary}
        fillOpacity={dimmed ? opacity * 0.25 : opacity}
        className="transition-[fill-opacity] duration-200"
      />
    );
  };
}

/**
 * Who on the team gets what out of each kind of post. Grouped bars by
 * category, one accent stepped by rank so the palette stays one color; the
 * leaderboard beside it names the steps. Hover a person to isolate them.
 */
export function TeamPerformance({
  data,
  description,
  loading = false,
  onAsk,
  className,
}: TeamPerformanceProps) {
  const reduceMotion = useReducedMotion();
  const [metric, setMetric] = useState<TeamMetric>("reach");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const spec = METRIC[metric];

  const tabs = (
    <ToggleGroup
      size="sm"
      value={metric}
      onValueChange={(value) => {
        if (value === "reach" || value === "rate") setMetric(value);
      }}
      aria-label="Metric"
    >
      <ToggleGroupItem value="reach">Reach</ToggleGroupItem>
      <ToggleGroupItem value="rate">Eng. rate</ToggleGroupItem>
    </ToggleGroup>
  );

  if (loading) {
    return (
      <Panel
        title="Team"
        description={description}
        actions={tabs}
        className={className}
      >
        <div className="grid gap-l @2xl/panel:grid-cols-[minmax(0,1fr)_15rem]">
          <ChartSkeleton kind="bars" height="h-56" header={false} />
          <ChartSkeleton kind="rows" height="h-56" header={false} />
        </div>
      </Panel>
    );
  }

  const ranked = data.members.toSorted((a, b) => b[metric] - a[metric]);
  const rankOf = new Map(ranked.map((member, index) => [member.id, index]));
  const labelOf = new Map(
    data.members.map((member) => [member.id, member.name]),
  );
  const rows = data[metric].map((datum) => ({ ...datum }));

  return (
    <Panel
      title="Team"
      description={description}
      actions={
        <>
          {tabs}
          {onAsk ? (
            <AskButton
              compact
              prompt={`Who on the team should own which kind of post, going by ${spec.label.toLowerCase()} per category?`}
              onAsk={onAsk}
            />
          ) : null}
        </>
      }
      className={className}
    >
      <div className="grid gap-l @2xl/panel:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex min-w-0 flex-col">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
                barCategoryGap="22%"
                barGap={2}
              >
                <CartesianGrid vertical={false} {...CHART_GRID} />
                <XAxis
                  dataKey="label"
                  {...CHART_AXIS}
                  tickMargin={8}
                  interval={0}
                  tick={CHART_TICK}
                />
                <YAxis
                  {...CHART_AXIS}
                  tickMargin={6}
                  width={36}
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
                  cursor={CHART_CURSOR_BAND}
                  isAnimationActive={false}
                  content={
                    <ChartTooltip
                      labelOf={labelOf}
                      format={(value) => spec.format(value)}
                    />
                  }
                />
                {ranked.map((member) => (
                  <Bar
                    key={member.id}
                    dataKey={member.id}
                    name={member.name}
                    maxBarSize={22}
                    shape={memberBar(
                      opacityFor(rankOf.get(member.id) ?? 0),
                      hoverId !== null && hoverId !== member.id,
                    )}
                    isAnimationActive={!reduceMotion}
                    {...CHART_ANIMATION}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Stagger
          kind="list"
          className="flex flex-col gap-xxs lg:border-l lg:border-imagine-border lg:pl-l"
          onMouseLeave={() => {
            setHoverId(null);
          }}
        >
          {ranked.map((member, rank) => (
            <StaggerItem
              key={member.id}
              onMouseEnter={() => {
                setHoverId(member.id);
              }}
              className={cn(
                "-mx-xs flex items-center gap-s rounded-control px-xs py-xs transition-colors",
                hoverId === member.id && "bg-imagine-surface-raised",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-2 shrink-0 bg-imagine-secondary",
                  opacityClass(rank),
                )}
              />
              <Avatar size="sm" shape={member.isCompany ? "square" : "circle"}>
                {member.avatarUrl ? (
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                ) : null}
                <AvatarFallback>{initials(member.name)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate type-small font-medium">
                {member.name}
              </span>
              <span className="grid shrink-0 type-small font-semibold tabular-nums">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={metric}
                    {...swapUp}
                    transition={fade.fast}
                    className="col-start-1 row-start-1 text-right"
                  >
                    {spec.format(member[metric])}
                  </motion.span>
                </AnimatePresence>
              </span>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Panel>
  );
}
