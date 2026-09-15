"use client";

import { cn } from "cn";
import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  type ScatterShapeProps,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AskIconButton } from "@/components/features/analytics/ask-imagine";
import {
  CHART_ANIMATION,
  CHART_AXIS,
  CHART_COLOR,
  CHART_TICK,
  ChartSkeletonGrid,
  ChartTooltip,
  ChartTooltipList,
  ChartTooltipRow,
  useChartTooltipDatum,
} from "@/components/features/analytics/chart-theme";
import { Panel } from "@/components/features/analytics/panel";
import { Icon } from "@/components/ui/icon";
import type { BestTimeData, TimeSlot } from "@/entities/analytics";
import { fade, pressRow, spring } from "@/styles/motion";

interface BestTimeGridProps {
  data: BestTimeData;
  /** A slot was chosen: hand it to the agent to schedule into. */
  onPick?: (slot: TimeSlot) => void;
  onAsk?: (prompt: string, intent?: string) => void;
  className?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/* Axis space, so cell size can be worked out from the container. */
const Y_AXIS_WIDTH = 36;
const X_AXIS_HEIGHT = 24;
const MARGIN = { top: 4, right: 4, bottom: 0, left: 0 } as const;
const CELL_GAP = 2;

function formatHour(hour: number): string {
  if (hour === 0) return "12am";
  if (hour === 12) return "12pm";
  return hour < 12 ? `${String(hour)}am` : `${String(hour - 12)}pm`;
}

export function formatSlot(slot: Pick<TimeSlot, "day" | "hour">): string {
  return `${DAYS_LONG[slot.day] ?? ""} at ${formatHour(slot.hour)}`;
}

/** Recharts hands its shapes and tooltip an untyped row; this is what a cell needs. */
function isTimeSlot(value: unknown): value is TimeSlot {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row["day"] === "number" &&
    typeof row["hour"] === "number" &&
    typeof row["score"] === "number" &&
    typeof row["rate"] === "number" &&
    typeof row["posts"] === "number"
  );
}

/** Pixel size of the wrapper, kept current with a ResizeObserver. */
function useSize(ref: React.RefObject<HTMLElement | null>): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const node = ref.current;
    if (node === null) return;
    const update = () => {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [ref]);
  return size;
}

/**
 * A cell: the accent at the slot's score, faint where nothing has gone out.
 * Drawn as a stock `Scatter` shape so the tooltip and hover work unchanged.
 */
function cell(
  width: number,
  height: number,
  activeKey: string | null,
  bestKeys: ReadonlySet<string>,
) {
  return function Cell(props: ScatterShapeProps) {
    const slot: unknown = props.payload;
    if (!isTimeSlot(slot) || props.cx === undefined || props.cy === undefined) {
      return <g />;
    }
    const key = `${String(slot.day)}-${String(slot.hour)}`;
    const active = key === activeKey;
    const best = bestKeys.has(key);
    return (
      <g className="cursor-pointer">
        <rect
          x={props.cx - width / 2}
          y={props.cy - height / 2}
          width={width}
          height={height}
          fill={CHART_COLOR.secondary}
          fillOpacity={0.06 + slot.score * 0.84}
          stroke={active ? CHART_COLOR.foreground : "none"}
          strokeWidth={active ? 1.5 : 0}
          className="transition-[fill-opacity] duration-200"
        />
        {best ? (
          <circle
            cx={props.cx}
            cy={props.cy}
            r={2}
            fill={
              slot.score > 0.55 ? CHART_COLOR.surface : CHART_COLOR.secondary
            }
          />
        ) : null}
      </g>
    );
  };
}

/**
 * What the tooltip says about a slot. The scatter's payload keys are the
 * cell's coordinates, so the rows are read from the slot itself rather than
 * from the series.
 */
function SlotTooltipRows() {
  const slot = useChartTooltipDatum();
  if (!isTimeSlot(slot)) return null;
  return (
    <ChartTooltipList>
      <ChartTooltipRow label="Slot" value={formatSlot(slot)} />
      <ChartTooltipRow
        label="Engagement rate"
        value={slot.posts > 0 ? `${slot.rate.toFixed(1)}%` : "Untested"}
      />
    </ChartTooltipList>
  );
}

/**
 * When to post. Weekdays down, hours across, the accent deepening where
 * posts have done well. The three best slots are dotted and listed beside
 * the grid; pressing any slot hands it to the agent to schedule into.
 */
export function BestTimeGrid({
  data,
  onPick,
  onAsk,
  className,
}: BestTimeGridProps) {
  const reduceMotion = useReducedMotion();
  const wrapper = useRef<HTMLDivElement>(null);
  const size = useSize(wrapper);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const [firstHour, lastHour] = data.hours;
  const columns = lastHour - firstHour + 1;
  const plotWidth = Math.max(
    0,
    size.width - Y_AXIS_WIDTH - MARGIN.left - MARGIN.right,
  );
  const plotHeight = Math.max(
    0,
    size.height - X_AXIS_HEIGHT - MARGIN.top - MARGIN.bottom,
  );
  const cellWidth = Math.max(0, plotWidth / columns - CELL_GAP);
  const cellHeight = Math.max(0, plotHeight / DAYS.length - CELL_GAP);
  const bestKeys = new Set(
    data.best.map((slot) => `${String(slot.day)}-${String(slot.hour)}`),
  );
  const hourTicks = Array.from(
    { length: Math.ceil(columns / 3) },
    (_, index) => firstHour + index * 3,
  ).filter((hour) => hour <= lastHour);

  return (
    <Panel
      title="Best time to post"
      actions={
        onAsk ? (
          <AskIconButton
            prompt="When should next week's posts go out, and why those slots?"
            onAsk={onAsk}
          />
        ) : null
      }
      className={className}
    >
      <div className="grid gap-l @2xl/panel:grid-cols-[minmax(0,1fr)_14rem]">
        <div
          ref={wrapper}
          className="h-52 w-full"
          onMouseLeave={() => {
            setActiveKey(null);
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={MARGIN}>
              <XAxis
                dataKey="hour"
                type="number"
                domain={[firstHour - 0.5, lastHour + 0.5]}
                ticks={hourTicks}
                tickFormatter={(value: number) => formatHour(value)}
                height={X_AXIS_HEIGHT}
                {...CHART_AXIS}
                tick={CHART_TICK}
                tickMargin={6}
              />
              <YAxis
                dataKey="day"
                type="number"
                domain={[-0.5, DAYS.length - 0.5]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                tickFormatter={(value: number) => DAYS[value] ?? ""}
                reversed
                width={Y_AXIS_WIDTH}
                {...CHART_AXIS}
                tick={CHART_TICK}
                tickMargin={6}
              />
              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={
                  <ChartTooltip>
                    <SlotTooltipRows />
                  </ChartTooltip>
                }
              />
              <Scatter
                data={data.slots.map((slot) => ({ ...slot }))}
                shape={cell(cellWidth, cellHeight, activeKey, bestKeys)}
                isAnimationActive={!reduceMotion}
                {...CHART_ANIMATION}
                onMouseEnter={(point: { payload?: TimeSlot }) => {
                  const slot = point.payload;
                  if (slot) {
                    setActiveKey(`${String(slot.day)}-${String(slot.hour)}`);
                  }
                }}
                onClick={(point: { payload?: TimeSlot }) => {
                  if (point.payload) onPick?.(point.payload);
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-s lg:border-l lg:border-imagine-border lg:pl-l">
          <span className="type-micro text-imagine-foreground-faint">
            Best slots
          </span>
          <ol className="flex flex-col gap-xs">
            {data.best.map((slot, index) => {
              const key = `${String(slot.day)}-${String(slot.hour)}`;
              return (
                <motion.li
                  key={key}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...fade.base, delay: index * 0.06 }}
                >
                  <motion.button
                    type="button"
                    whileTap={onPick ? pressRow.whileTap : undefined}
                    transition={spring.snappy}
                    onMouseEnter={() => {
                      setActiveKey(key);
                    }}
                    onMouseLeave={() => {
                      setActiveKey(null);
                    }}
                    onClick={() => onPick?.(slot)}
                    disabled={onPick === undefined}
                    className={cn(
                      "group/slot flex w-full items-center gap-s rounded-control px-xs py-xs text-left transition-colors",
                      onPick && "hover:bg-imagine-surface-raised",
                      activeKey === key && "bg-imagine-surface-raised",
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-control bg-imagine-secondary-soft type-small font-semibold text-imagine-secondary">
                      {String(index + 1)}
                    </span>
                    <span className="min-w-0 flex-1 truncate type-small font-medium">
                      {DAYS_LONG[slot.day]} · {formatHour(slot.hour)}
                    </span>
                    {onPick ? (
                      <Icon
                        name="calendar"
                        size="s"
                        className="shrink-0 text-imagine-foreground-faint transition-colors group-hover/slot:text-imagine-secondary"
                      />
                    ) : null}
                  </motion.button>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </div>
    </Panel>
  );
}

/** The grid's frame while the window's slots are still being scored. */
export function BestTimeGridSkeleton({ className }: { className?: string }) {
  return (
    <Panel title="Best time to post" className={className}>
      <ChartSkeletonGrid height="h-52" />
    </Panel>
  );
}
