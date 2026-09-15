"use client";

import { cn } from "cn";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

import { initCloudCanvas } from "@/lib/webgl/cloud-background";

/**
 * The sign-in backdrop: a rose sky with soft clouds drifting through it.
 * Rendered by a fragment shader at native resolution, so it stays smooth on
 * any screen for a fraction of a millisecond per frame. Clouds thin out
 * around the pointer and the sky warms there. With reduced motion it paints
 * one still frame.
 */
export function CloudBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return initCloudCanvas(canvas, { reduceMotion: reduceMotion ?? false });
  }, [reduceMotion]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none size-full", className)}
    />
  );
}
