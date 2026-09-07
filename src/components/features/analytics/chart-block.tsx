"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  Rectangle,
  type RectangleProps,
  XAxis,
  YAxis,
} from "recharts";

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { fade } from "@/styles/motion";

export type ChartKind = "bar" | "area" | "hbar";

export interface ChartSeries {
  key: string;
  label: string;
}

export type ChartDatum = { label: string } & Record<string, string | number>;

interface ChartBlockProps {
  kind: ChartKind;
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  title?: string;
  description?: string;
  /** Pink fills for the agent and landing; neutral for the analytics page. */
  tone?: "accent" | "neutral";
  /** Index of the bar to draw solid (today, the selected post). */
  highlightIndex?: number;
  /** Show series toggles in the header. */
  legend?: boolean;
  /** Hide axes and padding for tiny inline charts. */
  dense?: boolean;
  /** No surface of its own. Use inside a container that already has one. */
  plain?: boolean;
  className?: string;
}

/** Series colors by position. The first series carries the block's tone. */
const ACCENT_SERIES = [
  "var(--color-imagine-secondary)",
  "var(--color-imagine-foreground-faint)",
  "var(--color-imagine-foreground-muted)",
] as const;
const NEUTRAL_SERIES = [
  "var(--color-imagine-foreground-faint)",
  "var(--color-imagine-secondary)",
  "var(--color-imagine-foreground-muted)",
] as const;

function seriesColor(index: number, tone: "accent" | "neutral"): string {
  const palette = tone === "accent" ? ACCENT_SERIES : NEUTRAL_SERIES;
  return palette[index] ?? palette[2];
}

type BarShapeProps = RectangleProps & {
  index?: number;
  payload?: { label?: string };
};

function numericMax(data: readonly ChartDatum[], key: string): number {
  let max = 0;
  for (const datum of data) {
    const value = datum[key];
    if (typeof value === "number" && value > max) max = value;
  }
  return max;
}

/** Draws one bar solid (today, the selected post) and the rest in the series color. */
function highlightShape(highlightLabel: string | undefined, color: string) {
  return function HighlightBar(props: BarShapeProps) {
    const { fill, payload, index: _index, ...rest } = props;
    const isHighlight =
      highlightLabel !== undefined && payload?.label === highlightLabel;
    return <Rectangle {...rest} fill={isHighlight ? color : fill} />;
  };
}

const AXIS_TICK = {
  fontSize: 11,
  fill: "var(--color-imagine-foreground-faint)",
} as const;

function formatAxisValue(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${thousands % 1 === 0 ? String(thousands) : thousands.toFixed(1)}k`;
  }
  return String(value);
}

/**
 * A chart on a soft raised block. Used in agent replies, the landing rail, and
 * the analytics page. Never a card with a border.
 */
export function ChartBlock({
  kind,
  data,
  series,
  title,
  description,
  tone = "neutral",
  highlightIndex,
  legend = false,
  dense = false,
  plain = false,
  className,
}: ChartBlockProps) {
  const gradientId = useId().replace(/:/g, "");
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const visible = series.filter((item) => !hidden.has(item.key));
  const primary = series[0];

  const config = Object.fromEntries(
    series.map((item, index) => [
      item.key,
      { label: item.label, color: seriesColor(index, tone) },
    ]),
  ) satisfies ChartConfig;

  const highlightColor =
    tone === "accent"
      ? "var(--color-imagine-foreground)"
      : "var(--color-imagine-secondary)";
  const highlightLabel =
    highlightIndex === undefined ? undefined : data[highlightIndex]?.label;

  const primaryMax = primary ? numericMax(data, primary.key) : 0;
  const restMax = Math.max(
    0,
    ...series.slice(1).map((item) => numericMax(data, item.key)),
  );
  const splitScale = restMax > 0 && primaryMax > restMax * 4;

  const mutable = data.map((datum) => ({ ...datum }));
  const barShape = highlightShape(highlightLabel, highlightColor);

  return (
    <motion.div
      data-slot="chart-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className={cn(
        "flex flex-col gap-m rounded-panel",
        plain ? "p-0" : dense ? "p-s" : "p-l",
        !plain && "bg-imagine-surface-raised",
        className,
      )}
    >
      {title || legend ? (
        <div className="flex items-start justify-between gap-l">
          <div className="flex flex-col gap-xxs">
            {title ? <span className="type-heading">{title}</span> : null}
            {description ? (
              <span className="type-small text-imagine-foreground-muted">
                {description}
              </span>
            ) : null}
          </div>
          {legend && series.length > 1 ? (
            <div className="flex flex-wrap items-center gap-xs">
              {series.map((item, index) => {
                const off = hidden.has(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={!off}
                    onClick={() => {
                      setHidden((current) => {
                        const next = new Set(current);
                        if (next.has(item.key)) next.delete(item.key);
                        else if (next.size < series.length - 1)
                          next.add(item.key);
                        return next;
                      });
                    }}
                    className={cn(
                      "inline-flex h-6 items-center gap-xs rounded-control px-s type-small transition-colors",
                      off
                        ? "text-imagine-foreground-faint"
                        : "text-imagine-foreground-muted hover:text-imagine-foreground",
                    )}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 8 8"
                      className={cn("size-2", off && "opacity-30")}
                    >
                      <rect
                        width="8"
                        height="8"
                        rx="2"
                        fill={seriesColor(index, tone)}
                      />
                    </svg>
                    {item.label}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      <ChartContainer
        config={config}
        className={cn("aspect-auto w-full", dense ? "h-20" : "h-48")}
      >
        {kind === "area" ? (
          <AreaChart
            data={mutable}
            margin={{ left: 4, right: splitScale ? 8 : 4, top: 8, bottom: 0 }}
          >
            {dense ? null : (
              <>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tick={AXIS_TICK}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={36}
                  tick={AXIS_TICK}
                  tickFormatter={formatAxisValue}
                />
                {splitScale ? (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                    width={28}
                    tick={AXIS_TICK}
                    tickFormatter={formatAxisValue}
                  />
                ) : null}
              </>
            )}
            <defs>
              {visible.map((item) => (
                <linearGradient
                  key={item.key}
                  id={`${gradientId}-${item.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={`var(--color-${item.key})`}
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="100%"
                    stopColor={`var(--color-${item.key})`}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>
            <ChartTooltip content={<ChartTooltipContent />} />
            {visible.map((item, index) => {
              const axis =
                splitScale && index > 0 && item.key !== primary?.key
                  ? "right"
                  : "left";
              if (axis === "right") {
                return (
                  <Line
                    key={item.key}
                    yAxisId="right"
                    dataKey={item.key}
                    type="monotone"
                    stroke={`var(--color-${item.key})`}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 2 }}
                    isAnimationActive
                  />
                );
              }
              return (
                <Area
                  key={item.key}
                  yAxisId={dense ? undefined : "left"}
                  dataKey={item.key}
                  type="monotone"
                  fill={`url(#${gradientId}-${item.key})`}
                  stroke={`var(--color-${item.key})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                  isAnimationActive
                />
              );
            })}
          </AreaChart>
        ) : kind === "hbar" ? (
          <BarChart
            data={mutable}
            layout="vertical"
            margin={{ left: 4, right: 8, top: 4, bottom: 4 }}
            barCategoryGap="28%"
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="label"
              type="category"
              tickLine={false}
              axisLine={false}
              width={dense ? 52 : 64}
              interval={0}
              tick={AXIS_TICK}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {visible.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={`var(--color-${item.key})`}
                radius={4}
                maxBarSize={16}
                shape={item.key === primary?.key ? barShape : undefined}
              />
            ))}
          </BarChart>
        ) : (
          <BarChart
            data={mutable}
            margin={{ left: 4, right: 4, top: 8, bottom: 0 }}
            barCategoryGap={dense ? "22%" : "30%"}
          >
            {dense ? null : (
              <>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  tick={AXIS_TICK}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={6}
                  width={36}
                  tick={AXIS_TICK}
                  tickFormatter={formatAxisValue}
                />
              </>
            )}
            <ChartTooltip content={<ChartTooltipContent />} />
            {visible.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={`var(--color-${item.key})`}
                radius={[4, 4, 0, 0]}
                maxBarSize={dense ? 22 : 32}
                shape={item.key === primary?.key ? barShape : undefined}
              />
            ))}
          </BarChart>
        )}
      </ChartContainer>
    </motion.div>
  );
}
