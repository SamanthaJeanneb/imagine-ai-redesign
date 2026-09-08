"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { ChartBlock } from "@/components/features/analytics/chart-block";
import type { PreviewChart } from "@/services/analytics";
import { hoverLift, press } from "@/styles/motion";

interface ChartCardProps {
  chart: PreviewChart;
  /** `dense` for the composer preview: a short plot, no axes. */
  dense?: boolean;
  selected?: boolean;
  onOpen?: (chart: PreviewChart) => void;
  /** Shared with the same chart on its page, so expanding morphs into it. */
  layoutId?: string;
  className?: string;
}

/**
 * A chart the reader can pick up. Pressing it attaches the chart to the
 * composer the way a calendar chip attaches a post, so the next message is
 * about these numbers; the selected card fills and lifts.
 */
export function ChartCard({
  chart,
  dense = false,
  selected = false,
  onOpen,
  layoutId,
  className,
}: ChartCardProps) {
  return (
    <motion.button
      type="button"
      {...(layoutId === undefined ? {} : { layoutId })}
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
        dense ? "p-s" : "p-l",
        className,
      )}
    >
      <ChartBlock
        kind={chart.kind}
        data={chart.data}
        series={chart.series}
        title={chart.title}
        description={chart.description}
        tone="accent"
        dense={dense}
        plain
        /* The card is the frame, and the summary rides along when it is
           attached, so the block's own total would only crowd the header. */
        headline={false}
        className="w-full"
      />
    </motion.button>
  );
}
