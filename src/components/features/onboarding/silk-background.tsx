"use client";

import { cn } from "cn";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Widest the backing store gets. Above this the canvas is scaled down a
 * little; below it, it draws pixel for pixel so nothing looks stepped.
 */
const MAX_WIDTH = 1600;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** A soft body of color. Positions and amplitudes are fractions of the canvas. */
interface Blob {
  x: number;
  y: number;
  ax: number;
  ay: number;
  /** Radians per second. */
  sx: number;
  sy: number;
  px: number;
  py: number;
  /** Fraction of canvas width. */
  radius: number;
  alpha: number;
  /** How much it follows the pointer. Negative moves against it. */
  parallax: number;
}

const BLOBS: readonly Blob[] = [
  {
    x: 0.1,
    y: 0.15,
    ax: 0.06,
    ay: 0.05,
    sx: 0.21,
    sy: 0.17,
    px: 0,
    py: 1.2,
    radius: 0.5,
    alpha: 0.5,
    parallax: 0.05,
  },
  {
    x: 0.9,
    y: 0.1,
    ax: 0.05,
    ay: 0.06,
    sx: 0.16,
    sy: 0.23,
    px: 2.1,
    py: 0.4,
    radius: 0.42,
    alpha: 0.4,
    parallax: -0.04,
  },
  {
    x: 0.85,
    y: 0.9,
    ax: 0.07,
    ay: 0.05,
    sx: 0.19,
    sy: 0.14,
    px: 4.0,
    py: 2.6,
    radius: 0.55,
    alpha: 0.55,
    parallax: 0.07,
  },
  {
    x: 0.12,
    y: 0.92,
    ax: 0.05,
    ay: 0.06,
    sx: 0.13,
    sy: 0.2,
    px: 1.4,
    py: 3.3,
    radius: 0.4,
    alpha: 0.4,
    parallax: -0.06,
  },
];

/**
 * A fold in the silk: a highlight ridge with a shadow beneath it, drawn as a
 * cubic curve whose control points breathe. Positions are fractions.
 */
interface Fold {
  /** Where the curve starts at the left edge. */
  y: number;
  /** Rise from left edge to right edge. Positive climbs. */
  tilt: number;
  /** How much the middle bows. */
  bow: number;
  amp: number;
  speed: number;
  phase: number;
  /** Ridge width as a fraction of canvas width. */
  width: number;
  alpha: number;
}

const FOLDS: readonly Fold[] = [
  {
    y: 0.02,
    tilt: 0.34,
    bow: -0.1,
    amp: 0.05,
    speed: 0.11,
    phase: 0.0,
    width: 0.055,
    alpha: 0.7,
  },
  {
    y: 0.1,
    tilt: 0.4,
    bow: -0.14,
    amp: 0.06,
    speed: 0.09,
    phase: 1.3,
    width: 0.03,
    alpha: 0.5,
  },
  {
    y: 0.2,
    tilt: 0.36,
    bow: -0.08,
    amp: 0.05,
    speed: 0.13,
    phase: 2.2,
    width: 0.07,
    alpha: 0.55,
  },
  {
    y: 0.36,
    tilt: 0.42,
    bow: -0.16,
    amp: 0.07,
    speed: 0.08,
    phase: 3.1,
    width: 0.04,
    alpha: 0.45,
  },
  {
    y: 0.52,
    tilt: 0.38,
    bow: -0.12,
    amp: 0.06,
    speed: 0.1,
    phase: 4.4,
    width: 0.085,
    alpha: 0.6,
  },
  {
    y: 0.66,
    tilt: 0.44,
    bow: -0.1,
    amp: 0.05,
    speed: 0.12,
    phase: 0.7,
    width: 0.035,
    alpha: 0.5,
  },
  {
    y: 0.8,
    tilt: 0.4,
    bow: -0.14,
    amp: 0.06,
    speed: 0.09,
    phase: 5.2,
    width: 0.06,
    alpha: 0.6,
  },
  {
    y: 0.96,
    tilt: 0.36,
    bow: -0.1,
    amp: 0.05,
    speed: 0.14,
    phase: 1.9,
    width: 0.045,
    alpha: 0.5,
  },
  {
    y: 1.1,
    tilt: 0.42,
    bow: -0.16,
    amp: 0.05,
    speed: 0.1,
    phase: 3.8,
    width: 0.07,
    alpha: 0.55,
  },
];

/** Widths and alphas of the passes that build one soft ridge, widest first. */
const RIDGE_PASSES: readonly (readonly [number, number])[] = [
  [1.0, 0.05],
  [0.8, 0.07],
  [0.62, 0.09],
  [0.46, 0.12],
  [0.32, 0.15],
  [0.2, 0.18],
  [0.1, 0.2],
];

function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace("#", "");
  if (hex.length < 6) return null;
  const n = Number.parseInt(hex.slice(0, 6), 16);
  if (Number.isNaN(n)) return null;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgb(c: Rgb, alpha: number): string {
  return `rgb(${String(c.r)} ${String(c.g)} ${String(c.b)} / ${String(alpha)})`;
}

interface Palette {
  base: Rgb;
  tint: Rgb;
  light: Rgb;
  dark: boolean;
}

const FALLBACK: Palette = {
  base: { r: 244, g: 242, b: 240 },
  tint: { r: 212, g: 112, b: 124 },
  light: { r: 255, g: 255, b: 255 },
  dark: false,
};

/** Reads the live tokens so the scene themes with the rest of the app. */
function readPalette(): Palette {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const dark = root.getAttribute("data-theme") === "dark";
  const base = parseHex(style.getPropertyValue("--imagine-background"));
  const tint = parseHex(style.getPropertyValue("--imagine-secondary"));
  const strong = parseHex(style.getPropertyValue("--imagine-secondary-strong"));
  return {
    base: base ?? FALLBACK.base,
    tint: tint ?? FALLBACK.tint,
    // In the dark the highlights are a warmer rose, not white.
    light: dark ? (strong ?? FALLBACK.tint) : FALLBACK.light,
    dark,
  };
}

/**
 * The sign-in backdrop: rose silk. A wash of the accent over the page color,
 * deeper in the corners, with diagonal folds that breathe and lean toward the
 * pointer. Drawn at (near) native resolution with layered anti-aliased
 * strokes, so it stays smooth on any screen. With reduced motion it paints
 * one still frame.
 */
export function SilkBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let palette = readPalette();
    let width = 1;
    let height = 1;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();
    let frame = 0;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scale = Math.min(1, MAX_WIDTH / rect.width);
      width = Math.round(rect.width * scale);
      height = Math.round(rect.height * scale);
      canvas.width = width;
      canvas.height = height;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      const dx = pointer.x - 0.5;
      const dy = pointer.y - 0.5;
      const { base, tint, light, dark } = palette;

      // Ground: page color under a wash of the accent.
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgb(base, 1);
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = rgb(tint, dark ? 0.1 : 0.16);
      ctx.fillRect(0, 0, width, height);

      // Deeper rose pooling in the corners.
      const tintScale = dark ? 0.5 : 0.8;
      for (const b of BLOBS) {
        const cx =
          (b.x + b.ax * Math.sin(t * b.sx + b.px) + dx * b.parallax) * width;
        const cy =
          (b.y + b.ay * Math.cos(t * b.sy + b.py) + dy * b.parallax) * height;
        const r = b.radius * width;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, rgb(tint, b.alpha * tintScale));
        grad.addColorStop(0.5, rgb(tint, b.alpha * tintScale * 0.3));
        grad.addColorStop(1, rgb(tint, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // The pointer carries a lantern of its own.
      {
        const cx = pointer.x * width;
        const cy = pointer.y * height;
        const r = 0.3 * width;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, rgb(tint, dark ? 0.3 : 0.3));
        grad.addColorStop(1, rgb(tint, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // Folds. Each is a shadow beneath a soft highlight ridge.
      ctx.lineCap = "round";
      const lightScale = dark ? 0.25 : 1;
      const lean = dx * 0.12 * width;
      const lift = dy * 0.05 * height;
      for (const f of FOLDS) {
        const wave = Math.sin(t * f.speed + f.phase);
        const wave2 = Math.cos(t * f.speed * 0.6 + f.phase * 1.7);
        const y0 = f.y * height + lift;
        const rise = f.tilt * height;
        const bow = f.bow * height;
        const w = f.width * width;

        const x0 = -0.05 * width;
        const yA = y0 + wave2 * f.amp * 0.4 * height;
        const x1 = 0.33 * width + lean;
        const yB = y0 - rise * 0.33 + bow + wave * f.amp * height;
        const x2 = 0.66 * width - lean;
        const yC = y0 - rise * 0.66 + bow - wave * f.amp * 1.2 * height;
        const x3 = 1.05 * width;
        const yD = y0 - rise + wave2 * f.amp * 0.5 * height;

        // Shadow: the accent, sitting just below the ridge.
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = rgb(tint, (dark ? 0.16 : 0.14) * f.alpha);
        ctx.lineWidth = w * 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, yA + w * 0.9);
        ctx.bezierCurveTo(x1, yB + w * 0.9, x2, yC + w * 0.9, x3, yD + w * 0.9);
        ctx.stroke();

        // Ridge: layered passes narrow toward a bright core.
        ctx.globalCompositeOperation = dark ? "lighter" : "screen";
        ctx.beginPath();
        ctx.moveTo(x0, yA);
        ctx.bezierCurveTo(x1, yB, x2, yC, x3, yD);
        for (const [scale, alpha] of RIDGE_PASSES) {
          ctx.lineWidth = w * scale;
          ctx.strokeStyle = rgb(light, alpha * f.alpha * lightScale);
          ctx.stroke();
        }
      }
    };

    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth;
      pointer.ty = event.clientY / window.innerHeight;
    };

    const resize = new ResizeObserver(() => {
      fit();
      if (reduceMotion) draw(performance.now());
    });
    resize.observe(canvas);

    const theme = new MutationObserver(() => {
      palette = readPalette();
      if (reduceMotion) draw(performance.now());
    });
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    fit();
    if (reduceMotion) {
      draw(start);
    } else {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      theme.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, [reduceMotion]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none size-full", className)}
    />
  );
}
