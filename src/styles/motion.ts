import type { Transition, Variants } from "motion/react";

/**
 * Motion presets. Nothing sets a duration or spring inline; import from here.
 */

export const spring = {
  /** Indicators, chips, press feedback. */
  snappy: { type: "spring", stiffness: 500, damping: 40 },
  /** Panels, morphs, previews. */
  soft: { type: "spring", bounce: 0.15, visualDuration: 0.4 },
} as const satisfies Record<string, Transition>;

/** Seconds. */
export const duration = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** Per-item delay in seconds. */
export const stagger = {
  list: 0.04,
  grid: 0.02,
} as const;

export const fade = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
} as const satisfies Record<string, Transition>;

/** Tactile press: scale down on tap, spring back on release. */
export const press = {
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
} as const;

/** Subtle lift for hoverable rows and tiles. */
export const hoverLift = {
  whileHover: { y: -1 },
  transition: spring.snappy,
} as const;

/** Staggered entrance for lists and grids. Use with `Stagger`. */
export function staggerVariants(step: number): {
  container: Variants;
  item: Variants;
} {
  return {
    container: {
      hidden: {},
      show: { transition: { staggerChildren: step } },
    },
    item: {
      hidden: { opacity: 0, y: 6 },
      show: { opacity: 1, y: 0, transition: fade.base },
    },
  };
}

/** Exit used when landing content gives way to a thread. */
export const blurOut = {
  opacity: 0,
  y: 12,
  filter: "blur(6px)",
} as const;
