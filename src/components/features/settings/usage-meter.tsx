"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface UsageLine {
  id: string;
  label: string;
  used: number;
  limit: number;
  /** Formatter for the numbers, e.g. "42 of 100 posts". */
  format: (used: number, limit: number) => string;
}

interface UsageMeterProps {
  planName: string;
  lines: readonly UsageLine[];
  onManagePlan?: () => void;
  className?: string;
}

/** Settings, General: the plan and what has been used this period. */
export function UsageMeter({
  planName,
  lines,
  onManagePlan,
  className,
}: UsageMeterProps) {
  return (
    <div
      data-slot="usage-meter"
      className={cn(
        "flex flex-col gap-l rounded-panel bg-imagine-surface p-l shadow-raised",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-l">
        <span className="type-heading">{planName}</span>
        {onManagePlan ? (
          <Button
            size="sm"
            variant="soft"
            className="bg-imagine-surface"
            onClick={onManagePlan}
          >
            Manage plan
          </Button>
        ) : null}
      </div>
      <div className="flex flex-col gap-m">
        {lines.map((line) => {
          const ratio = line.limit > 0 ? line.used / line.limit : 0;
          return (
            <div key={line.id} className="flex flex-col gap-xs">
              <div className="flex items-center justify-between type-small">
                <span>{line.label}</span>
                <span className="text-imagine-foreground-muted tabular-nums">
                  {line.format(line.used, line.limit)}
                </span>
              </div>
              <Progress
                value={ratio}
                tone={ratio > 0.9 ? "accent" : "neutral"}
                className="bg-imagine-surface"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
