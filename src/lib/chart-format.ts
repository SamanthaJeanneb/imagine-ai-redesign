import type { ChartDatum } from "@/entities/analytics";

/** What a plot reads about one series, over the whole window. */
export interface SeriesStats {
  total: number;
  max: number;
  mean: number;
  last: number;
}

export const EMPTY_STATS: SeriesStats = { total: 0, max: 0, mean: 0, last: 0 };

function trim(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
}

/** 1240 → 1.2k, 51000 → 51k, 1200000 → 1.2M. */
/**
 * An axis tick or bar label. Distinct from `formatCompact` in `lib/format`,
 * which is for stat readouts: this one carries a sign, reaches into millions,
 * and leaves a value under a thousand exactly as it is so a tick does not
 * round away from its gridline.
 */
export function formatTick(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return trim(value / 1_000_000) + "M";
  if (abs >= 1_000) return trim(value / 1_000) + "k";
  return String(value);
}

export function seriesStats(
  data: readonly ChartDatum[],
  key: string,
): SeriesStats {
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

/** Every category gets a tick while they fit; past that Recharts thins them evenly, keeping the first. */
export function tickInterval(count: number): 0 | "equidistantPreserveStart" {
  return count <= 7 ? 0 : "equidistantPreserveStart";
}

/**
 * Whether the secondary series get their own scale: when the primary dwarfs
 * them, one axis would flatten them to the baseline. Maxima come in series
 * order, the primary first.
 */
export function splitScaleFor(maxima: readonly number[]): boolean {
  const [primary = 0, ...rest] = maxima;
  const restMax = Math.max(0, ...rest);
  return restMax > 0 && primary > restMax * 4;
}
