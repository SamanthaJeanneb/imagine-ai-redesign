"use client";

import { useSyncExternalStore } from "react";

/**
 * Subscribe to a `matchMedia` query. The server and the first client paint
 * both read `false`, so markup stays aligned; the real value lands after
 * hydration. Use for layout that cannot be expressed in CSS alone — overlay
 * rails, collapsing a third column — not for padding or type.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => {
        media.removeEventListener("change", onStoreChange);
      };
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** One column: the rail and docked chat become overlays. Matches `md`. */
export const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Not enough room for the rail, the page, and a 320px chat side by side.
 * Matches Tailwind `xl`, so CSS can hide the third column before hydration.
 */
export const COMPACT_QUERY = "(max-width: 1279px)";
