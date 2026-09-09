"use client";

import { cn } from "cn";
import type { ReactNode } from "react";
import type { TooltipContentProps } from "recharts";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * What every Recharts plot in Imagine shares: the token colors as SVG values,
 * the axis and grid props, one tooltip drawn with classes, one loading shape,
 * and one animation length. Import from here; do not restyle Recharts inline.
 */

/*
 * Colors are token variables passed straight to SVG attributes. Recharts needs
 * them as values, so this is the one place they appear as strings.
 */
export const CHART_COLOR = {
  foreground: "var(--color-imagine-foreground)",
  muted: "var(--color-imagine-foreground-muted)",
  faint: "var(--color-imagine-foreground-faint)",
  border: "var(--color-imagine-border)",
  surface: "var(--color-imagine-surface)",
  raised: "var(--color-imagine-surface-raised)",
  secondary: "var(--color-imagine-secondary)",
  secondarySoft: "var(--color-imagine-secondary-soft)",
} as const;

/* Recharts defaults, themed. Everything below is a stock prop on a stock part. */
export const CHART_TICK = { fontSize: 11, fill: CHART_COLOR.muted } as const;
export const CHART_LABEL = { fontSize: 10, fill: CHART_COLOR.muted } as const;
export const CHART_GRID = {
  stroke: CHART_COLOR.border,
  strokeDasharray: "3 3",
} as const;
export const CHART_AXIS = { tickLine: false, axisLine: false } as const;
/** The hover rule through a line or area plot. */
export const CHART_CURSOR_LINE = {
  stroke: CHART_COLOR.faint,
  strokeDasharray: "3 3",
} as const;
/** The hover band behind a bar. */
export const CHART_CURSOR_BAND = {
  fill: CHART_COLOR.foreground,
  fillOpacity: 0.05,
} as const;

/**
 * Entrance animation. Recharts defaults to 1.5s of ease, which reads as slow
 * next to the rest of the interface; this matches `fade.slow` stretched a
 * little so a bar can be seen growing.
 */
export const CHART_ANIMATION = {
  animationDuration: 600,
  animationEasing: "ease-out",
} as const;

/** `datum` is the row the value came from, for formats that need a sibling field. */
export type TooltipValueFormatter = (
  value: number,
  key: string,
  datum: Record<string, unknown> | undefined,
) => string;

function asDatum(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

interface ChartTooltipProps extends Partial<
  Pick<TooltipContentProps, "active" | "payload" | "label">
> {
  /** Series key → display name. Missing keys print the key. */
  labelOf?: ReadonlyMap<string, string>;
  /** Per-series number formatting. Default: locale digits. */
  format?: TooltipValueFormatter;
  /** Override the label line, e.g. "Tue 2 Sep" from a short axis tick. */
  labelFormatter?: (label: string) => string;
  /** Something above the rows: a post title, an avatar. */
  header?: ReactNode;
  /** Hide the label line entirely (single-point charts). */
  hideLabel?: boolean;
  /**
   * Replace the per-series rows with rows read from the hovered datum. For
   * charts whose payload keys are coordinates rather than facts (a heatmap).
   */
  rows?: (
    datum: Record<string, unknown>,
  ) => readonly { label: string; value: string }[];
}

/** Text for a value Recharts hands back untyped. Anything else renders empty. */
function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

/**
 * The tooltip, drawn with classes rather than Recharts' `contentStyle`. Pass
 * as `content` on `<Tooltip>`; Recharts supplies `active`, `payload`, `label`.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelOf,
  format,
  labelFormatter,
  header,
  hideLabel = false,
  rows: rowsOf,
}: ChartTooltipProps) {
  if (!active || payload === undefined || payload.length === 0) return null;
  const rows = payload.filter((item) => item.value !== undefined);
  if (rows.length === 0) return null;
  const labelText = text(label);
  const datum = asDatum(rows[0]?.payload);

  if (rowsOf !== undefined) {
    if (datum === undefined) return null;
    return (
      <div
        data-slot="chart-tooltip"
        className="min-w-32 rounded-control border border-imagine-border bg-imagine-surface px-m py-s shadow-floating"
      >
        {header}
        <dl className="flex flex-col gap-xxs">
          {rowsOf(datum).map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-l type-small"
            >
              <dt className="text-imagine-foreground-muted">{row.label}</dt>
              <dd className="font-medium text-imagine-foreground tabular-nums">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div
      data-slot="chart-tooltip"
      className="min-w-32 rounded-control border border-imagine-border bg-imagine-surface px-m py-s shadow-floating"
    >
      {header}
      {!hideLabel && labelText !== "" ? (
        <p className="mb-xs type-small text-imagine-foreground-muted">
          {labelFormatter ? labelFormatter(labelText) : labelText}
        </p>
      ) : null}
      <dl className="flex flex-col gap-xxs">
        {rows.map((item) => {
          const key = text(item.dataKey ?? item.name);
          const value =
            typeof item.value === "number"
              ? format
                ? format(item.value, key, asDatum(item.payload))
                : item.value.toLocaleString()
              : text(item.value);
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-l type-small"
            >
              <dt className="flex items-center gap-xs text-imagine-foreground-muted">
                <svg aria-hidden="true" viewBox="0 0 8 8" className="size-2">
                  <rect width="8" height="8" fill={item.color ?? item.fill} />
                </svg>
                {labelOf?.get(key) ?? text(item.name)}
              </dt>
              <dd className="font-medium text-imagine-foreground tabular-nums">
                {value}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

export type ChartSkeletonKind = "bars" | "line" | "grid" | "radar" | "rows";

interface ChartSkeletonProps {
  kind?: ChartSkeletonKind;
  /** Height utility for the plot area, e.g. `h-48`. Default matches a chart block. */
  height?: string;
  /** Draw the one-line header above the plot. Default on. */
  header?: boolean;
  className?: string;
}

/* Bar heights as fractions of the plot, so the skeleton looks like a chart. */
const BAR_HEIGHTS = [0.35, 0.6, 0.45, 0.8, 0.55, 0.7, 0.4, 0.9, 0.65, 0.5];
const HEIGHT_CLASS: Record<number, string> = {
  0.35: "h-[35%]",
  0.4: "h-[40%]",
  0.45: "h-[45%]",
  0.5: "h-[50%]",
  0.55: "h-[55%]",
  0.6: "h-[60%]",
  0.65: "h-[65%]",
  0.7: "h-[70%]",
  0.8: "h-[80%]",
  0.9: "h-[90%]",
};

/**
 * Loading state shaped like the chart that will replace it, so the swap does
 * not move the layout. The shimmer comes from `Skeleton`.
 */
export function ChartSkeleton({
  kind = "bars",
  height = "h-48",
  header = true,
  className,
}: ChartSkeletonProps) {
  return (
    <div
      data-slot="chart-skeleton"
      aria-busy="true"
      aria-label="Loading chart"
      className={cn("flex flex-col gap-l", className)}
    >
      {header ? (
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-12" />
        </div>
      ) : null}
      <div className={cn("flex w-full gap-m", height)}>
        {kind === "rows" ? null : (
          <div className="flex w-8 shrink-0 flex-col justify-between py-1">
            {[0, 1, 2, 3, 4].map((tick) => (
              <Skeleton key={tick} className="h-2.5 w-6" />
            ))}
          </div>
        )}
        {kind === "bars" ? (
          <div className="flex flex-1 items-end gap-[6%] border-b border-imagine-border pb-px">
            {BAR_HEIGHTS.map((fraction, index) => (
              <Skeleton
                key={index}
                className={cn(
                  "flex-1 rounded-none",
                  HEIGHT_CLASS[fraction] ?? "h-1/2",
                )}
              />
            ))}
          </div>
        ) : kind === "line" ? (
          <div className="relative flex-1 border-b border-imagine-border">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              className="absolute inset-0 size-full text-imagine-border"
            >
              <path
                d="M0 32 C 10 30, 15 22, 25 24 S 40 14, 50 16 S 65 8, 75 12 S 90 4, 100 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <Skeleton className="absolute inset-x-0 bottom-0 h-1/3 rounded-none opacity-60" />
          </div>
        ) : kind === "grid" ? (
          <div className="grid flex-1 grid-cols-12 grid-rows-7 gap-px">
            {Array.from({ length: 84 }, (_, index) => (
              <Skeleton key={index} className="size-full rounded-none" />
            ))}
          </div>
        ) : kind === "radar" ? (
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="aspect-square h-full max-h-full rounded-full" />
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-between">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex items-center gap-m">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 flex-1 rounded-none" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
