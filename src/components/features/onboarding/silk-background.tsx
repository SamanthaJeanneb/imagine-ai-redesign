"use client";

import { cn } from "cn";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Internal canvas width. It is drawn tiny and stretched to the viewport; the
 * browser's bilinear upscale is the blur, so every frame is a few hundred
 * pixels of work instead of a full-screen filter.
 */
const WIDTH = 240;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** One soft body of color. Positions and amplitudes are fractions of the canvas. */
interface Blob {
  x: number;
  y: number;
  /** How far it wanders. */
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
    x: 0.18,
    y: 0.28,
    ax: 0.08,
    ay: 0.06,
    sx: 0.21,
    sy: 0.17,
    px: 0,
    py: 1.2,
    radius: 0.42,
    alpha: 0.55,
    parallax: 0.05,
  },
  {
    x: 0.82,
    y: 0.22,
    ax: 0.07,
    ay: 0.08,
    sx: 0.16,
    sy: 0.23,
    px: 2.1,
    py: 0.4,
    radius: 0.38,
    alpha: 0.5,
    parallax: -0.04,
  },
  {
    x: 0.72,
    y: 0.82,
    ax: 0.09,
    ay: 0.05,
    sx: 0.19,
    sy: 0.14,
    px: 4.0,
    py: 2.6,
    radius: 0.46,
    alpha: 0.6,
    parallax: 0.07,
  },
  {
    x: 0.24,
    y: 0.86,
    ax: 0.06,
    ay: 0.07,
    sx: 0.13,
    sy: 0.2,
    px: 1.4,
    py: 3.3,
    radius: 0.34,
    alpha: 0.45,
    parallax: -0.06,
  },
  {
    x: 0.5,
    y: 0.5,
    ax: 0.12,
    ay: 0.1,
    sx: 0.11,
    sy: 0.09,
    px: 3.0,
    py: 0.9,
    radius: 0.5,
    alpha: 0.3,
    parallax: 0.03,
  },
];

/** Silk folds: pale ribbons drawn as curves whose control points breathe. */
interface Ribbon {
  y: number;
  /** Rise from left edge to right edge, as a fraction of height. Negative falls. */
  tilt: number;
  amp: number;
  speed: number;
  phase: number;
  width: number;
  alpha: number;
}

const RIBBONS: readonly Ribbon[] = [
  {
    y: 0.1,
    tilt: 0.55,
    amp: 0.14,
    speed: 0.12,
    phase: 0,
    width: 0.09,
    alpha: 0.5,
  },
  {
    y: 0.35,
    tilt: 0.7,
    amp: 0.18,
    speed: 0.09,
    phase: 2.0,
    width: 0.15,
    alpha: 0.35,
  },
  {
    y: 0.62,
    tilt: 0.5,
    amp: 0.12,
    speed: 0.15,
    phase: 4.2,
    width: 0.07,
    alpha: 0.45,
  },
  {
    y: 0.95,
    tilt: -0.3,
    amp: 0.1,
    speed: 0.1,
    phase: 1.1,
    width: 0.11,
    alpha: 0.3,
  },
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
 * The sign-in backdrop: rose bodies of color drifting under pale silk folds,
 * all leaning gently toward the pointer. Canvas 2D at postage-stamp
 * resolution, so it costs almost nothing per frame. With reduced motion it
 * paints one still frame.
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
    let width = WIDTH;
    let height = WIDTH;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();
    let frame = 0;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      width = WIDTH;
      height = Math.max(1, Math.round((WIDTH * rect.height) / rect.width));
      canvas.width = width;
      canvas.height = height;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      const dx = pointer.x - 0.5;
      const dy = pointer.y - 0.5;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgb(palette.base, 1);
      ctx.fillRect(0, 0, width, height);

      const tintScale = palette.dark ? 0.55 : 1;
      for (const b of BLOBS) {
        const cx =
          (b.x + b.ax * Math.sin(t * b.sx + b.px) + dx * b.parallax) * width;
        const cy =
          (b.y + b.ay * Math.cos(t * b.sy + b.py) + dy * b.parallax) * height;
        const r = b.radius * width;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, rgb(palette.tint, b.alpha * tintScale));
        grad.addColorStop(0.55, rgb(palette.tint, b.alpha * tintScale * 0.35));
        grad.addColorStop(1, rgb(palette.tint, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // The pointer carries a lantern of its own.
      {
        const cx = pointer.x * width;
        const cy = pointer.y * height;
        const r = 0.36 * width;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, rgb(palette.tint, palette.dark ? 0.35 : 0.5));
        grad.addColorStop(1, rgb(palette.tint, 0));
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // Folds. Screen blend so they lift the color under them instead of hiding it.
      ctx.globalCompositeOperation = palette.dark ? "lighter" : "screen";
      ctx.lineCap = "round";
      const lightScale = palette.dark ? 0.22 : 1;
      for (const rb of RIBBONS) {
        const wave = Math.sin(t * rb.speed + rb.phase);
        const wave2 = Math.cos(t * rb.speed * 0.7 + rb.phase);
        const y0 = (rb.y + dy * 0.06) * height;
        const rise = rb.tilt * height;
        const lean = dx * 0.25 * width;
        ctx.beginPath();
        ctx.moveTo(-0.1 * width, y0 + wave2 * rb.amp * 0.5 * height);
        ctx.bezierCurveTo(
          0.3 * width + lean,
          y0 - rise * 0.2 - wave * rb.amp * height,
          0.65 * width - lean,
          y0 - rise * 0.7 + wave * rb.amp * 1.3 * height,
          1.1 * width,
          y0 - rise - wave2 * rb.amp * 0.6 * height,
        );
        ctx.lineWidth = rb.width * width;
        ctx.strokeStyle = rgb(palette.light, rb.alpha * lightScale);
        ctx.stroke();
        // A thinner bright core gives the fold an edge.
        ctx.lineWidth = rb.width * width * 0.3;
        ctx.strokeStyle = rgb(palette.light, rb.alpha * 0.6 * lightScale);
        ctx.stroke();
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
      width={WIDTH}
      height={WIDTH}
      className={cn("pointer-events-none size-full", className)}
    />
  );
}
