"use client";

import { useLayoutEffect, useState } from "react";

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * The border-box size of an element, kept current with a `ResizeObserver`.
 * Returns a callback ref and the size, which is `undefined` on the server and
 * until the first measurement; that lands in a layout effect, before paint,
 * so nothing is drawn at the wrong size. Use for layout CSS cannot express
 * on its own, like how many chips fit a calendar row.
 */
export function useElementSize(): [
  (node: HTMLElement | null) => void,
  ElementSize | undefined,
] {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState<ElementSize>();

  useLayoutEffect(() => {
    if (node === null) return;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      setSize((current) =>
        current?.width === width && current.height === height
          ? current
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [node]);

  return [setNode, size];
}
