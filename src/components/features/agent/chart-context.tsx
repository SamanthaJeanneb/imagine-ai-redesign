"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import {
  CONTEXT_CHIP_LINE,
  ContextChipInline,
  ContextChipRemove,
} from "@/components/features/agent/context-chip";
import { useLayoutLocked } from "@/components/motion/layout-lock";
import { Icon } from "@/components/ui/icon";
import type { PreviewChart } from "@/services/analytics";
import { spring } from "@/styles/motion";

interface ChartContextProps {
  chart: PreviewChart;
  onRemove?: () => void;
  className?: string;
}

/**
 * A chart attached to the composer as context: the title, the number it adds
 * up to, and a remove action. The post equivalent is `PostContext`.
 */
export function ChartContext({
  chart,
  onRemove,
  className,
}: ChartContextProps) {
  const layoutLocked = useLayoutLocked();
  return (
    <motion.div
      layout={layoutLocked ? false : "position"}
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={spring.snappy}
      data-slot="chart-context"
      className={cn(CONTEXT_CHIP_LINE, "w-fit", className)}
    >
      <Icon
        name="chart-simple"
        size="s"
        className="shrink-0 text-imagine-secondary"
      />
      <ContextChipInline
        title={chart.title}
        detail={`${chart.summary} · ${chart.description}`}
      />
      {onRemove ? (
        <ContextChipRemove label={chart.title} onClick={onRemove} />
      ) : null}
    </motion.div>
  );
}
