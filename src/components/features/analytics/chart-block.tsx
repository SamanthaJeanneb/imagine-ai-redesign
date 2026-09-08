"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Line,
  Rectangle,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { fade } from "@/styles/motion";

export type ChartKind = "bar" | "area" | "hbar" | "composed";

export type ChartMark = "bar" | "line" | "step";

export interface ChartSeries {
  key: string;
  label: string;
  /** Composed charts only. How the series is drawn. Default `line`. */
  mark?: ChartMark;
  /** Composed charts only. `right` gets its own scale. Default `left`. */
  axis?: "left" | "right";
  /** Composed charts only. Mark the last point and print its value. */
  endLabel?: boolean;
}

/** A vertical rule through one category, captioned above the plot. */
export interface ChartAnnotation {
  /** The `label` of the datum to mark. */
  at: string;
  label: string;
}

export type ChartDatum = { label: string } & Record<string, string | number>;

type Tone = "accent" | "neutral";

interface ChartBlockProps {
  kind: ChartKind;
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  title?: string;
  description?: string;
  /** Pink fills for the agent and landing; neutral for the analytics page. */
  tone?: Tone;
  /** Index of the bar to draw solid (today, the selected post). */
  highlightIndex?: number;
  /** Let the reader toggle series in the key. */
  legend?: boolean;
  /** Compact: a one-line header and a short plot with a baseline only. */
  dense?: boolean;
  /** No frame of its own. Use inside a container that already has one. */
  plain?: boolean;
  /** Show the primary series total beside the title. Off for composed charts. */
  headline?: boolean;
  /** Composed charts only. Events to mark along the x axis. */
  annotations?: readonly ChartAnnotation[];
  /** Which category labels get an axis tick. Default: all of them. */
  xTicks?: readonly string[];
  className?: string;
}

/*
 * Colors are token variables passed straight to SVG attributes. Recharts needs
 * them as values, so this is the one place they appear as strings.
 */
const COLOR = {
  foreground: "var(--color-imagine-foreground)",
  muted: "var(--color-imagine-foreground-muted)",
  faint: "var(--color-imagine-foreground-faint)",
  border: "var(--color-imagine-border)",
  surface: "var(--color-imagine-surface)",
  secondary: "var(--color-imagine-secondary)",
} as const;

/** Series colors by position. The first series carries the block's tone. */
const PALETTE: Record<Tone, readonly string[]> = {
  accent: [COLOR.secondary, COLOR.muted, COLOR.faint],
  neutral: [COLOR.muted, COLOR.secondary, COLOR.faint],
};

function seriesColor(index: number, tone: Tone): string {
  const palette = PALETTE[tone];
  return palette[index] ?? palette[palette.length - 1] ?? COLOR.muted;
}

/**
 * Composed charts color by mark: bars recede so the lines can carry the story,
 * the first line takes the accent, the next the foreground.
 */
const COMPOSED_LINES = [
  COLOR.secondary,
  COLOR.foreground,
  COLOR.muted,
] as const;

function composedColors(series: readonly ChartSeries[]): Map<string, string> {
  const colors = new Map<string, string>();
  let lines = 0;
  for (const item of series) {
    if ((item.mark ?? "line") === "bar") {
      colors.set(item.key, COLOR.border);
      continue;
    }
    colors.set(item.key, COMPOSED_LINES[lines] ?? COLOR.muted);
    lines += 1;
  }
  return colors;
}

/* Recharts defaults, themed. Everything below is a stock prop on a stock part. */
const TICK = { fontSize: 11, fill: COLOR.muted } as const;
const LABEL = { fontSize: 10, fill: COLOR.muted } as const;
const GRID = { stroke: COLOR.border, strokeDasharray: "3 3" } as const;
const AXIS = { tickLine: false, axisLine: false } as const;
const TOOLTIP_STYLE = {
  contentStyle: {
    background: COLOR.surface,
    border: `1px solid ${COLOR.border}`,
    borderRadius: 0,
    padding: "6px 10px",
    fontSize: 12,
  },
  labelStyle: { color: COLOR.muted, marginBottom: 2 },
  itemStyle: { color: COLOR.foreground, padding: 0 },
} as const;
/** Room to the right of the plot for the mean rule's label. Pixels. */
const MEAN_GUTTER = 44;

/** 1240 → 1.2k, 51000 → 51k, 1200000 → 1.2M. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return trim(value / 1_000_000) + "M";
  if (abs >= 1_000) return trim(value / 1_000) + "k";
  return String(value);
}

function trim(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

/** Text for a value Recharts hands back untyped. Anything else renders empty. */
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function formatFull(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString();
  return text(value);
}

function labelFormatter(value: unknown): string {
  return typeof value === "number" ? formatCompact(value) : text(value);
}

function seriesStats(
  data: readonly ChartDatum[],
  key: string,
): { total: number; max: number; mean: number; last: number } {
  let total = 0;
  let max = 0;
  let count = 0;
  let last = 0;
  for (const datum of data) {
    const value = datum[key];
    if (typeof value !== "number") continue;
    total += value;
    count += 1;
    last = value;
    if (value > max) max = value;
  }
  return { total, max, mean: count > 0 ? total / count : 0, last };
}

/**
 * The stock Recharts area gradient: the series color near the line, clear at
 * the baseline. One per series, keyed off the block's id so several charts
 * can share a page.
 */
function AreaGradients({
  blockId,
  colors,
}: {
  blockId: string;
  colors: ReadonlyMap<string, string>;
}) {
  return (
    <defs>
      {[...colors].map(([key, color]) => (
        <linearGradient
          key={key}
          id={`${blockId}-${key}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="5%" stopColor={color} stopOpacity={0.6} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      ))}
    </defs>
  );
}

/**
 * The Recharts way to color one bar differently (the `Cell` replacement): a
 * `shape` that draws the stock `Rectangle` and swaps the fill by index.
 */
function highlightBar(highlightIndex: number | undefined, color: string) {
  return function HighlightBar(props: BarShapeProps) {
    return (
      <Rectangle
        {...props}
        fill={props.index === highlightIndex ? color : props.fill}
      />
    );
  };
}

/** Key swatch shaped like the mark it stands for. */
function Swatch({
  mark = "bar",
  color,
  off = false,
}: {
  mark?: ChartMark;
  color: string | undefined;
  off?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 8"
      className={cn("h-2 w-3", off && "opacity-30")}
    >
      {mark === "bar" ? (
        <rect width="12" height="8" fill={color} />
      ) : (
        <rect
          y={mark === "step" ? 3 : 3.25}
          width="12"
          height={mark === "step" ? 2 : 1.5}
          fill={color}
        />
      )}
    </svg>
  );
}

/**
 * A chart in a hairline frame. One header line carries the title and either
 * the total or a key with per-series numbers; the plot is stock Recharts with
 * the palette applied. Used in agent replies, the landing rail, and the
 * analytics page.
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
  headline = kind !== "composed",
  annotations = [],
  xTicks,
  className,
}: ChartBlockProps) {
  const reduceMotion = useReducedMotion();
  // `useId` puts colons in the id; `url(#…)` fragments are happier without.
  const blockId = useId().replace(/:/g, "");
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const visible = series.filter((item) => !hidden.has(item.key));
  const primary = series[0];
  const composed = kind === "composed";

  const colorOf = composed
    ? composedColors(series)
    : new Map(
        series.map((item, index) => [item.key, seriesColor(index, tone)]),
      );
  const labelOf = new Map(series.map((item) => [item.key, item.label]));
  const stats = new Map(
    series.map((item) => [item.key, seriesStats(data, item.key)]),
  );
  const primaryStats = primary ? stats.get(primary.key) : undefined;
  /* Composed series are usually running counts, so the key shows where each
     one ended up rather than a sum of the whole line. */
  const summaryOf = (key: string): number => {
    const stat = stats.get(key);
    if (!stat) return 0;
    return composed ? stat.last : stat.total;
  };

  const highlightColor = tone === "accent" ? COLOR.foreground : COLOR.secondary;

  const restMax = Math.max(
    0,
    ...series.slice(1).map((item) => stats.get(item.key)?.max ?? 0),
  );
  const splitScale = restMax > 0 && (primaryStats?.max ?? 0) > restMax * 4;

  /* Value labels on bars only, when there is one series to read and room to
     read it. Lines carry their values in the tooltip. */
  const showValues =
    !dense && kind !== "area" && visible.length === 1 && data.length <= 12;
  /* Every category gets a tick while they fit; past that Recharts thins them
     evenly, keeping the first. */
  const tickInterval = data.length <= 7 ? 0 : "equidistantPreserveStart";
  const showMean =
    !dense &&
    !composed &&
    kind !== "hbar" &&
    primary !== undefined &&
    data.length > 2;
  const hasRightAxis = composed && series.some((item) => item.axis === "right");
  const last = data[data.length - 1];

  const mutable = data.map((datum) => ({ ...datum }));
  const animate = !reduceMotion;

  const tooltip = (
    <Tooltip
      {...TOOLTIP_STYLE}
      cursor={
        kind === "area" || composed
          ? { stroke: COLOR.faint, strokeDasharray: "3 3" }
          : { fill: COLOR.foreground, fillOpacity: 0.05 }
      }
      isAnimationActive={false}
      formatter={(value: unknown, name: unknown) => [
        formatFull(value),
        labelOf.get(text(name)) ?? text(name),
      ]}
    />
  );

  const barShape =
    highlightIndex === undefined
      ? undefined
      : highlightBar(highlightIndex, highlightColor);

  return (
    <motion.div
      data-slot="chart-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className={cn(
        "flex flex-col",
        dense ? "gap-s" : "gap-l",
        !plain && "border border-imagine-border bg-imagine-surface",
        !plain && (dense ? "p-m" : "p-l"),
        className,
      )}
    >
      {/* One line: what this is on the left, the number(s) on the right. Where
          the block is narrow the description drops to a second line whole. */}
      <div className="flex items-baseline justify-between gap-l">
        <span className="min-w-0 type-small font-medium text-imagine-foreground-muted">
          <span className="whitespace-nowrap">{title ?? primary?.label}</span>
          {description ? (
            <>
              {" "}
              <span className="whitespace-nowrap text-imagine-foreground-faint">
                · {description}
              </span>
            </>
          ) : null}
        </span>
        {series.length > 1 ? (
          <dl className="flex min-w-0 flex-wrap items-center justify-end gap-x-l gap-y-xxs">
            {series.map((item) => {
              const off = hidden.has(item.key);
              const row = (
                <>
                  <dt className="flex items-center gap-xs type-small text-imagine-foreground-muted">
                    <Swatch
                      mark={composed ? (item.mark ?? "line") : "bar"}
                      color={colorOf.get(item.key)}
                      off={off}
                    />
                    {item.label}
                  </dt>
                  <dd
                    className={cn(
                      "type-small font-medium tabular-nums",
                      off && "text-imagine-foreground-faint",
                    )}
                  >
                    {formatCompact(summaryOf(item.key))}
                  </dd>
                </>
              );
              if (!legend) {
                return (
                  <div key={item.key} className="flex items-center gap-s">
                    {row}
                  </div>
                );
              }
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
                    "-mx-xs flex items-center gap-s px-xs transition-colors hover:bg-imagine-foreground/5",
                    off && "text-imagine-foreground-faint",
                  )}
                >
                  {row}
                </button>
              );
            })}
          </dl>
        ) : headline && primaryStats ? (
          <span className="shrink-0 type-small font-semibold tabular-nums">
            {formatCompact(primaryStats.total)}
          </span>
        ) : null}
      </div>

      <div
        className={cn("w-full", dense ? "h-16" : composed ? "h-64" : "h-48")}
      >
        <ResponsiveContainer width="100%" height="100%">
          {composed ? (
            <ComposedChart
              data={mutable}
              margin={{
                left: 0,
                right: hasRightAxis ? 0 : 12,
                top: annotations.length > 0 ? 20 : 12,
                bottom: 0,
              }}
            >
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis
                dataKey="label"
                {...AXIS}
                tickMargin={8}
                interval={xTicks ? 0 : "preserveStartEnd"}
                ticks={xTicks ? [...xTicks] : undefined}
                tick={TICK}
              />
              <YAxis
                yAxisId="left"
                {...AXIS}
                tickMargin={6}
                width={36}
                tickCount={5}
                domain={[0, "auto"]}
                tick={TICK}
                tickFormatter={formatCompact}
              />
              {hasRightAxis ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  {...AXIS}
                  tickMargin={6}
                  width={32}
                  tickCount={5}
                  domain={[0, "auto"]}
                  tick={TICK}
                  tickFormatter={formatCompact}
                />
              ) : null}
              {tooltip}
              {annotations.map((note) => (
                <ReferenceLine
                  key={note.at}
                  yAxisId="left"
                  x={note.at}
                  stroke={COLOR.faint}
                  strokeDasharray="3 3"
                  label={{
                    value: note.label.toUpperCase(),
                    position: "top",
                    ...LABEL,
                  }}
                />
              ))}
              {visible.map((item) => {
                const color = colorOf.get(item.key) ?? COLOR.muted;
                const mark = item.mark ?? "line";
                const axis = item.axis ?? "left";
                if (mark === "bar") {
                  return (
                    <Bar
                      key={item.key}
                      yAxisId={axis}
                      dataKey={item.key}
                      fill={color}
                      maxBarSize={24}
                      isAnimationActive={animate}
                    />
                  );
                }
                return (
                  <Line
                    key={item.key}
                    yAxisId={axis}
                    dataKey={item.key}
                    type={mark === "step" ? "stepAfter" : "monotone"}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={animate}
                  />
                );
              })}
              {/* The end marker is a reference dot on the last datum. */}
              {visible.map((item) => {
                const value = last?.[item.key];
                if (!item.endLabel || typeof value !== "number" || !last) {
                  return null;
                }
                const color = colorOf.get(item.key) ?? COLOR.muted;
                return (
                  <ReferenceDot
                    key={`${item.key}-end`}
                    yAxisId={item.axis ?? "left"}
                    x={last.label}
                    y={value}
                    r={4}
                    fill={color}
                    stroke="none"
                    label={{
                      value: formatCompact(value),
                      position: "top",
                      fontSize: 12,
                      fontWeight: 600,
                      fill: COLOR.foreground,
                    }}
                  />
                );
              })}
            </ComposedChart>
          ) : kind === "area" ? (
            <AreaChart
              data={mutable}
              margin={{
                left: 0,
                right: splitScale ? 0 : showMean ? MEAN_GUTTER : 8,
                top: 12,
                bottom: 0,
              }}
            >
              <AreaGradients blockId={blockId} colors={colorOf} />
              <CartesianGrid vertical={false} {...GRID} />
              <XAxis
                dataKey="label"
                {...AXIS}
                tickMargin={8}
                interval={dense ? "preserveStartEnd" : tickInterval}
                tick={dense ? false : TICK}
                height={dense ? 1 : undefined}
              />
              <YAxis
                yAxisId="left"
                hide={dense}
                {...AXIS}
                tickMargin={6}
                width={36}
                tickCount={5}
                domain={[0, "auto"]}
                tick={TICK}
                tickFormatter={formatCompact}
              />
              {splitScale ? (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide={dense}
                  {...AXIS}
                  tickMargin={6}
                  width={32}
                  tickCount={5}
                  domain={[0, "auto"]}
                  tick={TICK}
                  tickFormatter={formatCompact}
                />
              ) : null}
              {tooltip}
              {showMean && primaryStats ? (
                <ReferenceLine
                  yAxisId="left"
                  y={primaryStats.mean}
                  stroke={COLOR.faint}
                  strokeDasharray="3 3"
                  label={{
                    value: `avg ${formatCompact(Math.round(primaryStats.mean))}`,
                    position: splitScale ? "insideBottomLeft" : "right",
                    ...LABEL,
                  }}
                />
              ) : null}
              {visible.map((item, index) => {
                const color = colorOf.get(item.key) ?? COLOR.muted;
                const isPrimary = item.key === primary?.key;
                const axis =
                  splitScale && !isPrimary && index > 0 ? "right" : "left";
                return (
                  <Area
                    key={item.key}
                    yAxisId={axis}
                    dataKey={item.key}
                    type="monotone"
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${blockId}-${item.key})`}
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={animate}
                  />
                );
              })}
            </AreaChart>
          ) : kind === "hbar" ? (
            <BarChart
              data={mutable}
              layout="vertical"
              margin={{ left: 0, right: 44, top: 0, bottom: 0 }}
              barCategoryGap="34%"
            >
              <CartesianGrid horizontal={false} {...GRID} />
              <XAxis type="number" hide domain={[0, "auto"]} />
              <YAxis
                dataKey="label"
                type="category"
                {...AXIS}
                width={dense ? 56 : 76}
                interval={0}
                tick={{ fontSize: 12, fill: COLOR.foreground }}
              />
              {tooltip}
              {visible.map((item) => {
                const color = colorOf.get(item.key) ?? COLOR.muted;
                const isPrimary = item.key === primary?.key;
                return (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    fill={color}
                    maxBarSize={dense ? 10 : 14}
                    shape={isPrimary ? barShape : undefined}
                    isAnimationActive={animate}
                  >
                    {isPrimary ? (
                      <LabelList
                        dataKey={item.key}
                        position="right"
                        offset={8}
                        formatter={labelFormatter}
                        fontSize={11}
                        fill={COLOR.foreground}
                      />
                    ) : null}
                  </Bar>
                );
              })}
            </BarChart>
          ) : (
            <BarChart
              data={mutable}
              margin={{
                left: 0,
                right: showMean ? MEAN_GUTTER : 0,
                top: showValues ? 16 : 8,
                bottom: 0,
              }}
              barCategoryGap={dense ? "16%" : "24%"}
              barGap={2}
            >
              {dense ? null : <CartesianGrid vertical={false} {...GRID} />}
              <XAxis
                dataKey="label"
                {...AXIS}
                tickMargin={8}
                interval={dense ? "preserveStartEnd" : tickInterval}
                tick={dense ? false : TICK}
                height={dense ? 1 : undefined}
              />
              <YAxis
                hide={dense}
                {...AXIS}
                tickMargin={6}
                width={36}
                tickCount={5}
                domain={[0, "auto"]}
                tick={TICK}
                tickFormatter={formatCompact}
              />
              {tooltip}
              {showMean && primaryStats ? (
                <ReferenceLine
                  y={primaryStats.mean}
                  stroke={COLOR.faint}
                  strokeDasharray="3 3"
                  label={{
                    value: `avg ${formatCompact(Math.round(primaryStats.mean))}`,
                    position: "right",
                    ...LABEL,
                  }}
                />
              ) : null}
              {visible.map((item) => {
                const color = colorOf.get(item.key) ?? COLOR.muted;
                const isPrimary = item.key === primary?.key;
                return (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    fill={color}
                    maxBarSize={dense ? 28 : 40}
                    shape={isPrimary ? barShape : undefined}
                    isAnimationActive={animate}
                  >
                    {isPrimary && showValues ? (
                      <LabelList
                        dataKey={item.key}
                        position="top"
                        offset={6}
                        formatter={labelFormatter}
                        {...LABEL}
                      />
                    ) : null}
                  </Bar>
                );
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
