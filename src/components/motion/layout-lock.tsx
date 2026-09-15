"use client";

import { useSyncExternalStore } from "react";

let count = 0;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return count > 0;
}

function emit() {
  for (const listener of listeners) listener();
}

/** Call from a resize pointerdown so layout animations stop before the next move. */
export function lockLayout() {
  count += 1;
  emit();
}

export function unlockLayout() {
  count = Math.max(0, count - 1);
  emit();
}

/** True while a panel is being resized by the pointer. */
export function useLayoutLocked(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
