"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { AskButton } from "@/components/features/analytics/ask-imagine";
import {
  CHART_ANIMATION,
  CHART_COLOR,
  CHART_TICK,
  ChartSkeletonRadar,
  ChartSkeletonRows,
  ChartTooltip,
  ChartTooltipLabel,
  ChartTooltipSeries,
} from "@/components/features/analytics/chart-theme";
import { Panel } from "@/components/features/analytics/panel";
import { Badge } from "@/components/ui/badge";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { BENCHMARK_AXES } from "@/lib/benchmark";
import type { BenchmarkView } from "@/entities/competitor";
import {
  fade,
  pressRow,
  spring,
  stagger,
  staggerVariants,
} from "@/styles/motion";

interface BenchmarkPanelProps {
  data: BenchmarkView;
  onAsk?: (prompt: string, intent?: string) => void;
  className?: string;
}

/**
 * The accounts you watch against you. A radar puts both shapes on the same
 * axes so the difference is one glance; the rows carry the numbers; the
 * bottom says what the selected account posts about.
 */
export function BenchmarkPanel({
  data,
  onAsk,
  className,
}: BenchmarkPanelProps) {
  const reduceMotion = useReducedMotion();
  const rows = staggerVariants(reduceMotion ? 0 : stagger.list);
  const [selectedId, setSelectedId] = useState(data.competitors[0]?.id);
  const them =
    data.competitors.find((item) => item.id === selectedId) ??
    data.competitors[0];

  // Nobody to compare against: there are no two shapes to put on the axes,
  // so the frame stands empty rather than drawing half a radar.
  if (them === undefined) {
    return <BenchmarkPanelSkeleton className={className} />;
  }

  const you = data.you;
  const radar = data.radar[them.id] ?? [];
  const labelOf = new Map([
    ["you", you.name],
    ["them", them.name],
  ]);

  return (
    <Panel
      title="Benchmark"
      actions={
        onAsk ? (
          <AskButton
            prompt={`Compare ${you.name} with ${them.name}: what are they doing that we should try, and what should we not copy?`}
            onAsk={onAsk}
          />
        ) : null
      }
      className={className}
    >
      <div className="grid gap-l @3xl/panel:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-s">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={radar}
                margin={{ top: 8, right: 36, bottom: 8, left: 36 }}
                outerRadius="72%"
              >
                <PolarGrid stroke={CHART_COLOR.border} />
                <PolarAngleAxis dataKey="axis" tick={CHART_TICK} />
                <Tooltip
                  isAnimationActive={false}
                  content={
                    <ChartTooltip>
                      <ChartTooltipLabel />
                      <ChartTooltipSeries
                        labelOf={labelOf}
                        format={(value, key, datum) => {
                          const raw =
                            datum?.[key === "you" ? "youRaw" : "themRaw"];
                          return typeof raw === "string" ? raw : String(value);
                        }}
                      />
                    </ChartTooltip>
                  }
                />
                <Radar
                  dataKey="them"
                  stroke={CHART_COLOR.muted}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill={CHART_COLOR.muted}
                  fillOpacity={0.08}
                  dot={false}
                  isAnimationActive={!reduceMotion}
                  {...CHART_ANIMATION}
                />
                <Radar
                  dataKey="you"
                  stroke={CHART_COLOR.secondary}
                  strokeWidth={2}
                  fill={CHART_COLOR.secondary}
                  fillOpacity={0.22}
                  dot={{ r: 3, strokeWidth: 0, fill: CHART_COLOR.secondary }}
                  isAnimationActive={!reduceMotion}
                  {...CHART_ANIMATION}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-l type-small text-imagine-foreground-muted">
            <span className="flex items-center gap-xs">
              <span className="size-2 bg-imagine-secondary" />
              {you.name}
            </span>
            <span className="flex items-center gap-xs">
              <span className="size-2 border border-dashed border-imagine-foreground-muted" />
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={them.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={fade.fast}
                >
                  {them.name}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-l">
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[28rem] border-separate border-spacing-0 type-small">
              <thead>
                <tr className="text-left type-micro text-imagine-foreground-faint">
                  <th className="pb-s font-medium">Account</th>
                  <th className="pb-s text-right font-medium">Cadence</th>
                  <th className="pb-s text-right font-medium">Reactions</th>
                  <th className="pb-s text-right font-medium">Comments</th>
                  <th className="pb-s text-right font-medium">Shares</th>
                </tr>
              </thead>
              <motion.tbody
                variants={rows.container}
                initial="hidden"
                animate="show"
              >
                <motion.tr
                  variants={rows.item}
                  className="bg-imagine-secondary-soft/40 text-imagine-foreground"
                >
                  <td className="rounded-l-control py-xs pl-xs">
                    <span className="flex items-center gap-s">
                      <PersonAvatar
                        name={you.name}
                        avatarUrl={you.avatarUrl}
                        shape={you.isCompany ? "square" : "circle"}
                        size="sm"
                      />
                      <span className="truncate font-medium">{you.name}</span>
                    </span>
                  </td>
                  {BENCHMARK_AXES.map((axis) => (
                    <td
                      key={axis.key}
                      className="py-xs text-right font-medium tabular-nums last:rounded-r-control last:pr-xs"
                    >
                      {axis.format(you[axis.key])}
                    </td>
                  ))}
                </motion.tr>
                {data.competitors.map((item) => {
                  const active = item.id === them.id;
                  return (
                    <motion.tr
                      key={item.id}
                      variants={rows.item}
                      className={cn(
                        "cursor-pointer transition-colors",
                        active
                          ? "bg-imagine-surface-raised"
                          : "hover:bg-imagine-surface-raised/60",
                      )}
                      onClick={() => {
                        setSelectedId(item.id);
                      }}
                    >
                      <td className="rounded-l-control py-xs pl-xs">
                        <span className="flex items-center gap-s">
                          <PersonAvatar
                            name={item.name}
                            avatarUrl={item.avatarUrl}
                            shape={item.isCompany ? "square" : "circle"}
                            size="sm"
                          />
                          <span className="truncate font-medium">
                            {item.name}
                          </span>
                        </span>
                      </td>
                      {BENCHMARK_AXES.map((axis) => (
                        <td
                          key={axis.key}
                          className="py-xs text-right font-medium tabular-nums last:rounded-r-control last:pr-xs"
                        >
                          {axis.format(item[axis.key])}
                        </td>
                      ))}
                    </motion.tr>
                  );
                })}
              </motion.tbody>
            </table>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={them.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={fade.fast}
              className="flex flex-col gap-s border-t border-imagine-border pt-l"
            >
              <div className="flex flex-wrap items-center gap-s">
                <span className="type-small font-medium">
                  What {them.name} posts
                </span>
                {them.topics.map((topic) => (
                  <Badge key={topic} variant="soft">
                    {topic}
                  </Badge>
                ))}
              </div>
              {onAsk ? (
                <motion.button
                  type="button"
                  whileTap={pressRow.whileTap}
                  transition={spring.snappy}
                  onClick={() => {
                    onAsk(
                      `${them.name} keeps posting about ${them.topics.slice(0, 2).join(" and ").toLowerCase()}. Draft a post from ${you.name} that takes a different angle on it.`,
                    );
                  }}
                  className="self-start type-small text-imagine-secondary hover:underline"
                >
                  Draft our answer to this →
                </motion.button>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Panel>
  );
}

/** The panel's frame while the accounts you watch are still being read. */
export function BenchmarkPanelSkeleton({ className }: { className?: string }) {
  return (
    <Panel title="Benchmark" className={className}>
      <div className="grid gap-l @3xl/panel:grid-cols-[16rem_minmax(0,1fr)]">
        <ChartSkeletonRadar height="h-56" />
        <ChartSkeletonRows height="h-56" />
      </div>
    </Panel>
  );
}
