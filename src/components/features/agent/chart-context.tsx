"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
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
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={spring.snappy}
      data-slot="chart-context"
      className={cn(
        "flex h-8 w-fit items-center gap-s rounded-control bg-imagine-surface-raised py-xxs pr-xxs pl-xs shadow-control",
        className,
      )}
    >
      <Icon
        name="chart-simple"
        size="s"
        className="shrink-0 text-imagine-secondary"
      />
      <span className="flex min-w-0 items-baseline gap-xs">
        <span className="max-w-48 truncate type-small font-medium">
          {chart.title}
        </span>
        <span className="shrink-0 type-small text-imagine-foreground-muted">
          {chart.summary} · {chart.description}
        </span>
      </span>
      {onRemove ? (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Remove ${chart.title}`}
          onClick={onRemove}
          className="text-imagine-foreground-faint hover:text-imagine-foreground"
        >
          <Icon name="xmark" size="s" />
        </Button>
      ) : null}
    </motion.div>
  );
}
