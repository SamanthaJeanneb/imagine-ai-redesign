"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { useLayoutLocked } from "@/components/motion/layout-lock";
import {
  CHART_PLOT_BY_KIND,
  CHART_PREVIEW_BY_KIND,
  ChartHeader,
  ChartProvider,
} from "@/components/features/analytics/chart-block";
import type { PreviewChart } from "@/services/analytics";
import { hoverLift, press } from "@/styles/motion";

interface ChartCardProps {
  chart: PreviewChart;
  selected?: boolean;
  onOpen?: (chart: PreviewChart) => void;
  /** Shared with the same chart on its page, so expanding morphs into it. */
  layoutId?: string;
  className?: string;
}

/**
 * The pressable frame both cards share. Pressing it attaches the chart to the
 * composer the way a calendar chip attaches a post, so the next message is
 * about these numbers; the selected card fills and lifts.
 */
function CardButton({
  chart,
  selected = false,
  onOpen,
  layoutId,
  className,
  children,
}: ChartCardProps & { children: ReactNode }) {
  const layoutLocked = useLayoutLocked();
  return (
    <motion.button
      type="button"
      {...(layoutId === undefined || layoutLocked
        ? {}
        : { layoutId, layoutDependency: chart.id })}
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      onClick={() => onOpen?.(chart)}
      data-slot="chart-card"
      data-selected={selected || undefined}
      aria-pressed={selected}
      aria-label={`Ask about ${chart.title}`}
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-control border text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        selected
          ? "border-imagine-secondary bg-imagine-secondary-soft shadow-raised"
          : "border-imagine-border bg-imagine-surface shadow-control hover:bg-imagine-surface-raised",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/**
 * A chart the reader can pick up, at full size, on the analytics page. The
 * card is the frame, and the summary rides along when the chart is attached,
 * so the header carries the title alone.
 */
export function ChartCard({ chart, className, ...props }: ChartCardProps) {
  const Plot = CHART_PLOT_BY_KIND[chart.kind];
  return (
    <CardButton chart={chart} className={cn("p-l", className)} {...props}>
      <ChartProvider data={chart.data} series={chart.series} tone="accent">
        <div className="flex w-full flex-col gap-l">
          <ChartHeader title={chart.title} description={chart.description} />
          <Plot />
        </div>
      </ChartProvider>
    </CardButton>
  );
}

/**
 * The same chart as a short strip for the composer's preview: one header
 * line and a plot with a baseline only, so three fit side by side.
 */
export function ChartPreviewCard({
  chart,
  className,
  ...props
}: ChartCardProps) {
  const Preview = CHART_PREVIEW_BY_KIND[chart.kind];
  return (
    <CardButton chart={chart} className={cn("p-s", className)} {...props}>
      <ChartProvider data={chart.data} series={chart.series} tone="accent">
        <div className="flex w-full flex-col gap-s">
          <ChartHeader title={chart.title} description={chart.description} />
          <Preview />
        </div>
      </ChartProvider>
    </CardButton>
  );
}
