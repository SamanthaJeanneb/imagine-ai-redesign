"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useState,
} from "react";
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

import {
  CHART_ANIMATION,
  CHART_AXIS as AXIS,
  CHART_COLOR as COLOR,
  CHART_CURSOR_BAND,
  CHART_CURSOR_LINE,
  CHART_GRID as GRID,
  CHART_LABEL as LABEL,
  CHART_TICK as TICK,
  ChartTooltip,
  ChartTooltipLabel,
  ChartTooltipSeries,
  valueText,
} from "@/components/features/analytics/chart-theme";
import type { ChartDatum, ChartKind, ChartSeries } from "@/entities/analytics";
import { fade } from "@/styles/motion";

type ChartMark = "bar" | "line" | "step";

/** A series in a composed chart: how it is drawn and which scale it reads. */
export interface ComposedChartSeries extends ChartSeries {
  /** How the series is drawn. Default `line`. */
  mark?: ChartMark;
  /** `right` gets its own scale. Default `left`. */
  axis?: "left" | "right";
  /** Mark the last point and print its value. */
  endLabel?: boolean;
}

/** A vertical rule through one category, captioned above the plot. */
interface ChartAnnotation {
  /** The `label` of the datum to mark. */
  at: string;
  label: string;
}

/** Pink fills for the agent and landing; neutral for the analytics page. */
type ChartTone = "accent" | "neutral";

interface SeriesStats {
  total: number;
  max: number;
  mean: number;
  last: number;
}

const EMPTY_STATS: SeriesStats = { total: 0, max: 0, mean: 0, last: 0 };

/**
 * What every part of a chart reads: the data, the series, and which series
 * the reader has switched off in the key. The provider that renders it
 * decides how series are colored and which number the key prints.
 */
interface ChartContextValue {
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  tone: ChartTone;
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
  colorOf: (key: string) => string;
  statsOf: (key: string) => SeriesStats;
  /** The number the key prints beside a series. */
  summaryOf: (key: string) => number;
  /** The shape of the key swatch for a series. */
  swatchOf: (key: string) => ChartMark;
}

const ChartContext = createContext<ChartContextValue | null>(null);
const ComposedSeriesContext = createContext<
  readonly ComposedChartSeries[] | null
>(null);

function useChart(): ChartContextValue {
  const chart = useContext(ChartContext);
  if (chart === null) {
    throw new Error(
      "Chart parts render inside <ChartProvider> or <ComposedChartProvider>.",
    );
  }
  return chart;
}

function useComposedSeries(): readonly ComposedChartSeries[] {
  const series = useContext(ComposedSeriesContext);
  if (series === null) {
    throw new Error(
      "<ComposedChartBlock> renders inside <ComposedChartProvider>.",
    );
  }
  return series;
}

/** Which series the key has switched off. It never hides the last one. */
function useHiddenSeries(count: number): {
  hidden: ReadonlySet<string>;
  toggle: (key: string) => void;
} {
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const toggle = (key: string) => {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (next.size < count - 1) next.add(key);
      return next;
    });
  };
  return { hidden, toggle };
}

interface ChartProviderProps {
  data: readonly ChartDatum[];
  series: readonly ChartSeries[];
  tone?: ChartTone;
  children: ReactNode;
}

/**
 * State for a bar, area, or horizontal bar chart: series colored by position,
 * the first carrying the tone; the key prints each series' total.
 */
export function ChartProvider({
  data,
  series,
  tone = "neutral",
  children,
}: ChartProviderProps) {
  const { hidden, toggle } = useHiddenSeries(series.length);
  const colors = new Map(
    series.map((item, index) => [item.key, seriesColor(index, tone)]),
  );
  const stats = new Map(
    series.map((item) => [item.key, seriesStats(data, item.key)]),
  );
  return (
    <ChartContext.Provider
      value={{
        data,
        series,
        tone,
        hidden,
        toggle,
        colorOf: (key) => colors.get(key) ?? COLOR.muted,
        statsOf: (key) => stats.get(key) ?? EMPTY_STATS,
        summaryOf: (key) => stats.get(key)?.total ?? 0,
        swatchOf: () => "bar",
      }}
    >
      {children}
    </ChartContext.Provider>
  );
}

interface ComposedChartProviderProps {
  data: readonly ChartDatum[];
  series: readonly ComposedChartSeries[];
  children: ReactNode;
}

/**
 * State for a composed chart: series colored by mark, and since they are
 * usually running counts the key shows where each one ended up rather than a
 * sum of the whole line.
 */
export function ComposedChartProvider({
  data,
  series,
  children,
}: ComposedChartProviderProps) {
  const { hidden, toggle } = useHiddenSeries(series.length);
  const colors = composedColors(series);
  const stats = new Map(
    series.map((item) => [item.key, seriesStats(data, item.key)]),
  );
  const marks = new Map(series.map((item) => [item.key, item.mark ?? "line"]));
  return (
    <ChartContext.Provider
      value={{
        data,
        series,
        tone: "neutral",
        hidden,
        toggle,
        colorOf: (key) => colors.get(key) ?? COLOR.muted,
        statsOf: (key) => stats.get(key) ?? EMPTY_STATS,
        summaryOf: (key) => stats.get(key)?.last ?? 0,
        swatchOf: (key) => marks.get(key) ?? "line",
      }}
    >
      <ComposedSeriesContext.Provider value={series}>
        {children}
      </ComposedSeriesContext.Provider>
    </ChartContext.Provider>
  );
}

/** Series colors by position. The first series carries the block's tone. */
const PALETTE: Record<ChartTone, readonly string[]> = {
  accent: [COLOR.secondary, COLOR.muted, COLOR.faint],
  neutral: [COLOR.muted, COLOR.secondary, COLOR.faint],
};

function seriesColor(index: number, tone: ChartTone): string {
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

function composedColors(
  series: readonly ComposedChartSeries[],
): Map<string, string> {
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

/** Room to the right of the plot for the mean rule's label. Pixels. */
const MEAN_GUTTER = 44;

/** 1240 → 1.2k, 51000 → 51k, 1200000 → 1.2M. */
/**
 * An axis tick or bar label. Distinct from `formatCompact` in `lib/format`,
 * which is for stat readouts: this one carries a sign, reaches into millions,
 * and leaves a value under a thousand exactly as it is so a tick does not
 * round away from its gridline.
 */
function formatTick(value: number): string {
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
/** Bar value labels: compact, carrying the series unit when it has one. */
function labelFormatter(unit = "") {
  return (value: unknown): string =>
    (typeof value === "number" ? formatTick(value) : valueText(value)) + unit;
}

function seriesStats(data: readonly ChartDatum[], key: string): SeriesStats {
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
  series,
  colorOf,
}: {
  blockId: string;
  series: readonly ChartSeries[];
  colorOf: (key: string) => string;
}) {
  return (
    <defs>
      {series.map((item) => (
        <linearGradient
          key={item.key}
          id={`${blockId}-${item.key}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="5%" stopColor={colorOf(item.key)} stopOpacity={0.6} />
          <stop offset="95%" stopColor={colorOf(item.key)} stopOpacity={0} />
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

/*
 * Parts. A chart is assembled from these at the call site: a provider, then a
 * header and a plot, inside `ChartFrame` or inside whatever frame the caller
 * already has (a card, a reply).
 */

/**
 * The hairline frame around a header and a plot, fading in as one. Charts
 * inside a container that already has a frame skip this and stack the parts
 * in their own column.
 */
export function ChartFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      data-slot="chart-block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={fade.base}
      className={cn(
        "flex flex-col gap-l border border-imagine-border bg-imagine-surface p-l",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * One line: what this is on the left, and on the right whatever the caller
 * renders: a `ChartHeadline`, a `ChartKey`, a `ChartLegend`, or nothing.
 * Where the block is narrow the description drops to a second line whole.
 */
export function ChartHeader({
  title,
  description,
  children,
}: {
  /** Default: the primary series' label. */
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  const { series } = useChart();
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-l gap-y-xs">
      <span className="min-w-0 type-small font-medium text-imagine-foreground-muted">
        <span>{title ?? series[0]?.label}</span>
        {description ? (
          <>
            {" "}
            <span className="text-imagine-foreground-faint">
              · {description}
            </span>
          </>
        ) : null}
      </span>
      {children}
    </div>
  );
}

/** The primary series' total, beside the title. */
export function ChartHeadline() {
  const { series, statsOf } = useChart();
  const primary = series[0];
  if (primary === undefined) return null;
  return (
    <span className="shrink-0 type-small font-semibold tabular-nums">
      {formatTick(statsOf(primary.key).total)}
    </span>
  );
}

/** A series' swatch, name, and number, as one key entry. */
function KeyEntry({ item }: { item: ChartSeries }) {
  const { hidden, colorOf, swatchOf, summaryOf } = useChart();
  const off = hidden.has(item.key);
  return (
    <>
      <dt className="flex items-center gap-xs type-small text-imagine-foreground-muted">
        <Swatch mark={swatchOf(item.key)} color={colorOf(item.key)} off={off} />
        {item.label}
      </dt>
      <dd
        className={cn(
          "type-small font-medium tabular-nums",
          off && "text-imagine-foreground-faint",
        )}
      >
        {formatTick(summaryOf(item.key))}
      </dd>
    </>
  );
}

const KEY_CLASS =
  "flex min-w-0 flex-wrap items-center justify-end gap-x-l gap-y-xxs";

/** Every series with its swatch and number. Read only; see `ChartLegend`. */
export function ChartKey() {
  const { series } = useChart();
  return (
    <dl className={KEY_CLASS}>
      {series.map((item) => (
        <div key={item.key} className="flex items-center gap-s">
          <KeyEntry item={item} />
        </div>
      ))}
    </dl>
  );
}

/** The key as toggles, so the reader can switch series off. */
export function ChartLegend() {
  const { series, hidden, toggle } = useChart();
  return (
    <dl className={KEY_CLASS}>
      {series.map((item) => {
        const off = hidden.has(item.key);
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={!off}
            onClick={() => {
              toggle(item.key);
            }}
            className={cn(
              "-mx-xs flex items-center gap-s px-xs transition-colors hover:bg-imagine-foreground/5",
              off && "text-imagine-foreground-faint",
            )}
          >
            <KeyEntry item={item} />
          </button>
        );
      })}
    </dl>
  );
}

/*
 * Plots. Each is stock Recharts with the palette applied, reading its data and
 * series from the provider. The `*Block` plots are full size with axes; the
 * `*Preview` plots are the composer's short strip with a baseline only.
 */

interface PlotProps {
  className?: string;
}

interface BarPlotProps extends PlotProps {
  /** Index of the bar to draw solid (today, the selected post). */
  highlightIndex?: number;
}

/** What every plot derives from its provider. */
function usePlot() {
  const chart = useChart();
  const reduceMotion = useReducedMotion();
  const primary = chart.series[0];
  return {
    ...chart,
    primary,
    primaryStats:
      primary === undefined ? undefined : chart.statsOf(primary.key),
    visible: chart.series.filter((item) => !chart.hidden.has(item.key)),
    labelOf: new Map(chart.series.map((item) => [item.key, item.label])),
    unitOf: new Map(chart.series.map((item) => [item.key, item.unit ?? ""])),
    /* Recharts mutates the rows it is handed. */
    rows: chart.data.map((datum) => ({ ...datum })),
    animate: !reduceMotion,
    highlightColor:
      chart.tone === "accent" ? COLOR.foreground : COLOR.secondary,
  };
}

/** Every category gets a tick while they fit; past that Recharts thins them evenly, keeping the first. */
function tickInterval(count: number): 0 | "equidistantPreserveStart" {
  return count <= 7 ? 0 : "equidistantPreserveStart";
}

function plotTooltip(
  cursor: ComponentProps<typeof Tooltip>["cursor"],
  labelOf: ReadonlyMap<string, string>,
  unitOf: ReadonlyMap<string, string>,
) {
  return (
    <Tooltip
      cursor={cursor}
      isAnimationActive={false}
      content={
        <ChartTooltip>
          <ChartTooltipLabel />
          <ChartTooltipSeries
            labelOf={labelOf}
            format={(value, key) =>
              value.toLocaleString() + (unitOf.get(key) ?? "")
            }
          />
        </ChartTooltip>
      }
    />
  );
}

/** Bars by category, with value labels and a mean rule where there is room. */
export function BarChartBlock({ highlightIndex, className }: BarPlotProps) {
  const plot = usePlot();
  /* Value labels when there is one series to read and room to read it. */
  const showValues = plot.visible.length === 1 && plot.data.length <= 12;
  const showMean = plot.primaryStats !== undefined && plot.data.length > 2;
  const barShape =
    highlightIndex === undefined
      ? undefined
      : highlightBar(highlightIndex, plot.highlightColor);

  return (
    <div className={cn("h-48 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={plot.rows}
          margin={{
            left: 0,
            right: showMean ? MEAN_GUTTER : 0,
            top: showValues ? 16 : 8,
            bottom: 0,
          }}
          barCategoryGap="24%"
          barGap={2}
        >
          <CartesianGrid vertical={false} {...GRID} />
          <XAxis
            dataKey="label"
            {...AXIS}
            tickMargin={8}
            interval={tickInterval(plot.data.length)}
            tick={TICK}
          />
          <YAxis
            {...AXIS}
            tickMargin={6}
            width={36}
            tickCount={5}
            domain={[0, "auto"]}
            tick={TICK}
            tickFormatter={formatTick}
          />
          {plotTooltip(CHART_CURSOR_BAND, plot.labelOf, plot.unitOf)}
          {showMean && plot.primaryStats ? (
            <ReferenceLine
              y={plot.primaryStats.mean}
              stroke={COLOR.faint}
              strokeDasharray="3 3"
              label={{
                value: `avg ${formatTick(Math.round(plot.primaryStats.mean))}`,
                position: "right",
                ...LABEL,
              }}
            />
          ) : null}
          {plot.visible.map((item) => {
            const isPrimary = item.key === plot.primary?.key;
            return (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={plot.colorOf(item.key)}
                maxBarSize={40}
                shape={isPrimary ? barShape : undefined}
                isAnimationActive={plot.animate}
                {...CHART_ANIMATION}
              >
                {isPrimary && showValues ? (
                  <LabelList
                    dataKey={item.key}
                    position="top"
                    offset={6}
                    formatter={labelFormatter(item.unit)}
                    {...LABEL}
                  />
                ) : null}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The short bar strip for the composer preview: no grid, no axes. */
export function BarChartPreview({ highlightIndex, className }: BarPlotProps) {
  const plot = usePlot();
  const barShape =
    highlightIndex === undefined
      ? undefined
      : highlightBar(highlightIndex, plot.highlightColor);

  return (
    <div className={cn("h-16 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={plot.rows}
          margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
          barCategoryGap="16%"
          barGap={2}
        >
          <XAxis
            dataKey="label"
            {...AXIS}
            tickMargin={8}
            interval="preserveStartEnd"
            tick={false}
            height={1}
          />
          <YAxis
            hide
            {...AXIS}
            tickMargin={6}
            width={36}
            tickCount={5}
            domain={[0, "auto"]}
            tick={TICK}
            tickFormatter={formatTick}
          />
          {plotTooltip(CHART_CURSOR_BAND, plot.labelOf, plot.unitOf)}
          {plot.visible.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              fill={plot.colorOf(item.key)}
              maxBarSize={28}
              shape={item.key === plot.primary?.key ? barShape : undefined}
              isAnimationActive={plot.animate}
              {...CHART_ANIMATION}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Whether the secondary series get their own scale: when the primary dwarfs
 * them, one axis would flatten them to the baseline.
 */
function splitScaleFor(plot: ReturnType<typeof usePlot>): boolean {
  const restMax = Math.max(
    0,
    ...plot.series.slice(1).map((item) => plot.statsOf(item.key).max),
  );
  return restMax > 0 && (plot.primaryStats?.max ?? 0) > restMax * 4;
}

function areaFor(
  plot: ReturnType<typeof usePlot>,
  item: ChartSeries,
  index: number,
  splitScale: boolean,
  blockId: string,
) {
  const isPrimary = item.key === plot.primary?.key;
  return (
    <Area
      key={item.key}
      yAxisId={splitScale && !isPrimary && index > 0 ? "right" : "left"}
      dataKey={item.key}
      type="monotone"
      stroke={plot.colorOf(item.key)}
      strokeWidth={2}
      fill={`url(#${blockId}-${item.key})`}
      fillOpacity={1}
      dot={false}
      activeDot={{ r: 4 }}
      isAnimationActive={plot.animate}
      {...CHART_ANIMATION}
    />
  );
}

/** Areas over time, with a mean rule where there is room. */
export function AreaChartBlock({ className }: PlotProps) {
  const plot = usePlot();
  // `useId` puts colons in the id; `url(#…)` fragments are happier without.
  const blockId = useId().replace(/:/g, "");
  const splitScale = splitScaleFor(plot);
  const showMean = plot.primaryStats !== undefined && plot.data.length > 2;

  return (
    <div className={cn("h-48 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={plot.rows}
          margin={{ left: 0, right: splitScale ? 0 : 8, top: 12, bottom: 0 }}
        >
          <AreaGradients
            blockId={blockId}
            series={plot.series}
            colorOf={plot.colorOf}
          />
          <CartesianGrid vertical={false} {...GRID} />
          <XAxis
            dataKey="label"
            {...AXIS}
            tickMargin={8}
            interval={tickInterval(plot.data.length)}
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
            tickFormatter={formatTick}
          />
          {splitScale ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              {...AXIS}
              tickMargin={6}
              width={32}
              tickCount={5}
              domain={[0, "auto"]}
              tick={TICK}
              tickFormatter={formatTick}
            />
          ) : null}
          {plotTooltip(CHART_CURSOR_LINE, plot.labelOf, plot.unitOf)}
          {showMean && plot.primaryStats ? (
            <ReferenceLine
              yAxisId="left"
              y={plot.primaryStats.mean}
              stroke={COLOR.faint}
              strokeDasharray="3 3"
              label={{
                value: `avg ${formatTick(Math.round(plot.primaryStats.mean))}`,
                position: splitScale ? "insideBottomLeft" : "insideBottomRight",
                ...LABEL,
              }}
            />
          ) : null}
          {plot.visible.map((item, index) =>
            areaFor(plot, item, index, splitScale, blockId),
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** The short area strip for the composer preview: a baseline, no axes. */
function AreaChartPreview({ className }: PlotProps) {
  const plot = usePlot();
  const blockId = useId().replace(/:/g, "");
  const splitScale = splitScaleFor(plot);

  return (
    <div className={cn("h-16 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={plot.rows}
          margin={{ left: 0, right: splitScale ? 0 : 8, top: 12, bottom: 0 }}
        >
          <AreaGradients
            blockId={blockId}
            series={plot.series}
            colorOf={plot.colorOf}
          />
          <CartesianGrid vertical={false} {...GRID} />
          <XAxis
            dataKey="label"
            {...AXIS}
            tickMargin={8}
            interval="preserveStartEnd"
            tick={false}
            height={1}
          />
          <YAxis
            yAxisId="left"
            hide
            {...AXIS}
            tickMargin={6}
            width={36}
            tickCount={5}
            domain={[0, "auto"]}
            tick={TICK}
            tickFormatter={formatTick}
          />
          {splitScale ? (
            <YAxis
              yAxisId="right"
              orientation="right"
              hide
              {...AXIS}
              tickMargin={6}
              width={32}
              tickCount={5}
              domain={[0, "auto"]}
              tick={TICK}
              tickFormatter={formatTick}
            />
          ) : null}
          {plotTooltip(CHART_CURSOR_LINE, plot.labelOf, plot.unitOf)}
          {plot.visible.map((item, index) =>
            areaFor(plot, item, index, splitScale, blockId),
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Bars across, one per category, the primary series' value at each end. The
 * plot is one shape at two sizes, so the caller supplies the measurements:
 * how tall the strip is, how much room the category names get, and how thick
 * a bar may grow.
 */
function HorizontalBars({
  height,
  axisWidth,
  barSize,
  highlightIndex,
  className,
}: BarPlotProps & {
  height: string;
  axisWidth: number;
  barSize: number;
}) {
  const plot = usePlot();
  const barShape =
    highlightIndex === undefined
      ? undefined
      : highlightBar(highlightIndex, plot.highlightColor);

  return (
    <div className={cn(height, "w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={plot.rows}
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
            width={axisWidth}
            interval={0}
            tick={{ fontSize: 12, fill: COLOR.foreground }}
          />
          {plotTooltip(CHART_CURSOR_BAND, plot.labelOf, plot.unitOf)}
          {plot.visible.map((item) => {
            const isPrimary = item.key === plot.primary?.key;
            return (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={plot.colorOf(item.key)}
                maxBarSize={barSize}
                shape={isPrimary ? barShape : undefined}
                isAnimationActive={plot.animate}
                {...CHART_ANIMATION}
              >
                {isPrimary ? (
                  <LabelList
                    dataKey={item.key}
                    position="right"
                    offset={8}
                    formatter={labelFormatter(item.unit)}
                    fontSize={11}
                    fill={COLOR.foreground}
                  />
                ) : null}
              </Bar>
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Bars across, one per category, the primary series' value at each end. */
export function HorizontalBarChartBlock(props: BarPlotProps) {
  return (
    <HorizontalBars height="h-48" axisWidth={112} barSize={14} {...props} />
  );
}

/** The short horizontal bar strip for the composer preview. */
function HorizontalBarChartPreview(props: BarPlotProps) {
  return (
    <HorizontalBars height="h-16" axisWidth={56} barSize={10} {...props} />
  );
}

/**
 * Bars, lines, and steps on shared categories, some on a second scale, with
 * events marked along the x axis. Reads `ComposedChartSeries` from
 * `ComposedChartProvider` for each series' mark and axis.
 */
export function ComposedChartBlock({
  annotations = [],
  xTicks,
  className,
}: PlotProps & {
  /** Events to mark along the x axis. */
  annotations?: readonly ChartAnnotation[];
  /** Which category labels get an axis tick. Default: all of them. */
  xTicks?: readonly string[];
}) {
  const plot = usePlot();
  const series = useComposedSeries();
  const visible = series.filter((item) => !plot.hidden.has(item.key));
  const hasRightAxis = series.some((item) => item.axis === "right");
  const last = plot.data[plot.data.length - 1];

  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={plot.rows}
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
            tickFormatter={formatTick}
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
              tickFormatter={formatTick}
            />
          ) : null}
          {plotTooltip(CHART_CURSOR_LINE, plot.labelOf, plot.unitOf)}
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
            const color = plot.colorOf(item.key);
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
                  isAnimationActive={plot.animate}
                  {...CHART_ANIMATION}
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
                isAnimationActive={plot.animate}
                {...CHART_ANIMATION}
              />
            );
          })}
          {/* The end marker is a reference dot on the last datum. */}
          {visible.map((item) => {
            const value = last?.[item.key];
            if (!item.endLabel || typeof value !== "number" || !last) {
              return null;
            }
            return (
              <ReferenceDot
                key={`${item.key}-end`}
                yAxisId={item.axis ?? "left"}
                x={last.label}
                y={value}
                r={4}
                fill={plot.colorOf(item.key)}
                stroke="none"
                label={{
                  value: formatTick(value),
                  position: "top",
                  fontSize: 12,
                  fontWeight: 600,
                  fill: COLOR.foreground,
                }}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Mock data names its chart by kind (`PreviewChart`, a chart message part).
 * These records are the one place that name becomes a plot; everywhere else
 * renders the plot it wants directly.
 */
export const CHART_PLOT_BY_KIND: Record<
  ChartKind,
  (props: BarPlotProps) => ReactNode
> = {
  bar: BarChartBlock,
  area: AreaChartBlock,
  hbar: HorizontalBarChartBlock,
};

export const CHART_PREVIEW_BY_KIND: Record<
  ChartKind,
  (props: BarPlotProps) => ReactNode
> = {
  bar: BarChartPreview,
  area: AreaChartPreview,
  hbar: HorizontalBarChartPreview,
};
