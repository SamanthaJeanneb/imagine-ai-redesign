/**
 * Intrinsic element props that can be spread onto a `motion.*` element.
 * Motion redefines the drag/animation handlers and `style`, so React's
 * versions are removed here to keep the two typings compatible.
 */
export type MotionCompatibleProps<T extends keyof React.JSX.IntrinsicElements> =
  Omit<
    React.ComponentProps<T>,
    "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag" | "style"
  > & {
    style?: React.CSSProperties;
  };
