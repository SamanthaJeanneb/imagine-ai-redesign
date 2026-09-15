import type { BenchmarkProfile } from "@/entities/competitor";
import { formatCompact } from "@/lib/format";

/** The four numbers the radar and the table both read, in column order. */
export interface BenchmarkAxis {
  key: keyof Pick<
    BenchmarkProfile,
    "postsPerWeek" | "avgReactions" | "avgComments" | "avgShares"
  >;
  label: string;
  format: (value: number) => string;
}

export const BENCHMARK_AXES: readonly BenchmarkAxis[] = [
  {
    key: "postsPerWeek",
    label: "Cadence",
    format: (value) => `${value.toFixed(1)}/wk`,
  },
  { key: "avgReactions", label: "Reactions", format: formatCompact },
  { key: "avgComments", label: "Comments", format: formatCompact },
  { key: "avgShares", label: "Shares", format: formatCompact },
];

/** One radar spoke. `you` and `them` are percentages of the larger of the two. */
export interface BenchmarkRadarRow {
  axis: string;
  you: number;
  them: number;
  youRaw: string;
  themRaw: string;
}

/**
 * Both accounts on the same spokes. The numbers are on four different scales,
 * so each spoke is scaled against whichever account leads it; the tooltip
 * carries the real figures.
 */
export function benchmarkRadar(
  you: BenchmarkProfile,
  them: BenchmarkProfile,
): readonly BenchmarkRadarRow[] {
  return BENCHMARK_AXES.map((axis) => {
    const yours = you[axis.key];
    const theirs = them[axis.key];
    const max = Math.max(yours, theirs, Number.EPSILON);
    return {
      axis: axis.label,
      you: Math.round((yours / max) * 100),
      them: Math.round((theirs / max) * 100),
      youRaw: axis.format(yours),
      themRaw: axis.format(theirs),
    };
  });
}

/** Each competitor's spokes against yours, keyed by their id. */
export function benchmarkRadarByCompetitor(
  you: BenchmarkProfile,
  competitors: readonly BenchmarkProfile[],
): Record<string, readonly BenchmarkRadarRow[]> {
  const radar: Record<string, readonly BenchmarkRadarRow[]> = {};
  for (const competitor of competitors) {
    radar[competitor.id] = benchmarkRadar(you, competitor);
  }
  return radar;
}
