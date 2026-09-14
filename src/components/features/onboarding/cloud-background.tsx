"use client";

import { cn } from "cn";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/**
 * Widest the backing store gets. The fragment shader is per pixel, so this
 * bounds the work on very large displays without ever looking stepped.
 */
const MAX_WIDTH = 1600;

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

/**
 * Two layers of domain-warped value noise, thresholded into cloud cover. The
 * far layer is large and slow; the near layer is smaller, quicker, shaded on
 * its underside, and thins out around the pointer.
 */
const FRAGMENT = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform vec3 u_skyTop;
uniform vec3 u_skyBottom;
uniform vec3 u_cloud;
uniform vec3 u_shade;
uniform vec3 u_glow;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  mat2 rotate = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotate * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 lean = u_pointer - 0.5;

  // Sky: a little deeper at the bottom.
  vec3 color = mix(u_skyBottom, u_skyTop, smoothstep(0.0, 1.0, uv.y * 0.85 + 0.15));

  // Far layer: broad, slow, mostly a lightening of the sky.
  vec2 q1 = p * 1.4 + vec2(u_time * 0.018, u_time * 0.004) + lean * 0.05;
  vec2 w1 = 0.35 * vec2(fbm(q1 + u_time * 0.01), fbm(q1 - u_time * 0.012 + 3.1));
  float n1 = fbm(q1 + w1);
  float far = smoothstep(0.42, 0.74, n1);
  color = mix(color, mix(u_cloud, color, 0.45), far * 0.6);

  // Near layer: billows with a shaded underside.
  vec2 q2 = p * 2.4 + vec2(u_time * 0.04, -u_time * 0.007) + lean * 0.14 + 7.0;
  vec2 w2 = 0.28 * vec2(fbm(q2 * 1.3 + u_time * 0.02), fbm(q2 * 1.3 + 1.7));
  float n2 = fbm(q2 + w2);
  float above = fbm(q2 + w2 + vec2(0.0, 0.09));
  float shade = clamp((above - n2) * 5.0, 0.0, 1.0);

  // The pointer breathes on the glass: clouds thin around it.
  vec2 pointer = vec2(u_pointer.x * aspect, u_pointer.y);
  float reach = distance(p, pointer);
  float breath = smoothstep(0.0, 0.5, reach);
  float near = smoothstep(0.5, 0.8, n2) * mix(0.35, 1.0, breath);

  vec3 cloud = mix(u_cloud, u_shade, shade * 0.8);
  color = mix(color, cloud, near);

  // And warms the sky it clears.
  color += u_glow * (1.0 - smoothstep(0.0, 0.6, reach)) * 0.35;

  gl_FragColor = vec4(color, 1.0);
}
`;

type Rgb = readonly [number, number, number];

interface Palette {
  skyTop: Rgb;
  skyBottom: Rgb;
  cloud: Rgb;
  shade: Rgb;
  glow: Rgb;
}

function parseHex(value: string): Rgb | null {
  const hex = value.trim().replace("#", "");
  if (hex.length < 6) return null;
  const n = Number.parseInt(hex.slice(0, 6), 16);
  if (Number.isNaN(n)) return null;
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

const WHITE: Rgb = [1, 1, 1];
const FALLBACK_BASE: Rgb = [244 / 255, 242 / 255, 240 / 255];
const FALLBACK_TINT: Rgb = [212 / 255, 112 / 255, 124 / 255];

/** Reads the live tokens so the sky themes with the rest of the app. */
function readPalette(): Palette {
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const dark = root.getAttribute("data-theme") === "dark";
  const base =
    parseHex(style.getPropertyValue("--imagine-background")) ?? FALLBACK_BASE;
  const tint =
    parseHex(style.getPropertyValue("--imagine-secondary")) ?? FALLBACK_TINT;
  const strong =
    parseHex(style.getPropertyValue("--imagine-secondary-strong")) ?? tint;

  if (dark) {
    return {
      skyTop: base,
      skyBottom: mix(base, tint, 0.22),
      cloud: mix(base, strong, 0.42),
      shade: mix(base, tint, 0.12),
      glow: mix([0, 0, 0], tint, 0.35),
    };
  }
  return {
    skyTop: mix(WHITE, tint, 0.3),
    skyBottom: mix(WHITE, tint, 0.52),
    cloud: WHITE,
    shade: mix(WHITE, tint, 0.42),
    glow: mix([0, 0, 0], tint, 0.18),
  };
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** Paints the sky gradient alone, for browsers without WebGL. */
function paintFallback(canvas: HTMLCanvasElement, palette: Palette) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.round(rect.width));
  canvas.height = Math.max(1, Math.round(rect.height));
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  const css = (c: Rgb) =>
    `rgb(${String(Math.round(c[0] * 255))} ${String(Math.round(c[1] * 255))} ${String(Math.round(c[2] * 255))})`;
  grad.addColorStop(0, css(palette.skyTop));
  grad.addColorStop(1, css(palette.skyBottom));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

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

    let palette = readPalette();
    const gl = canvas.getContext("webgl", {
      antialias: false,
      depth: false,
      stencil: false,
      alpha: false,
      powerPreference: "low-power",
    });

    if (!gl) {
      paintFallback(canvas, palette);
      const resize = new ResizeObserver(() => {
        paintFallback(canvas, palette);
      });
      resize.observe(canvas);
      return () => {
        resize.disconnect();
      };
    }

    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment) {
      paintFallback(canvas, palette);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      paintFallback(canvas, palette);
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the clip space.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      resolution: gl.getUniformLocation(program, "u_resolution"),
      time: gl.getUniformLocation(program, "u_time"),
      pointer: gl.getUniformLocation(program, "u_pointer"),
      skyTop: gl.getUniformLocation(program, "u_skyTop"),
      skyBottom: gl.getUniformLocation(program, "u_skyBottom"),
      cloud: gl.getUniformLocation(program, "u_cloud"),
      shade: gl.getUniformLocation(program, "u_shade"),
      glow: gl.getUniformLocation(program, "u_glow"),
    };

    const applyPalette = () => {
      gl.uniform3fv(uniforms.skyTop, palette.skyTop);
      gl.uniform3fv(uniforms.skyBottom, palette.skyBottom);
      gl.uniform3fv(uniforms.cloud, palette.cloud);
      gl.uniform3fv(uniforms.shade, palette.shade);
      gl.uniform3fv(uniforms.glow, palette.glow);
    };
    applyPalette();

    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    const start = performance.now();
    let frame = 0;
    let lost = false;

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scale = Math.min(1, MAX_WIDTH / rect.width);
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      if (lost) return;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      gl.uniform1f(uniforms.time, (now - start) / 1000);
      // GL's y runs up; the page's runs down.
      gl.uniform2f(uniforms.pointer, pointer.x, 1 - pointer.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      draw(now);
      frame = requestAnimationFrame(loop);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.tx = event.clientX / window.innerWidth;
      pointer.ty = event.clientY / window.innerHeight;
    };

    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const resize = new ResizeObserver(() => {
      fit();
      if (reduceMotion) draw(start);
    });
    resize.observe(canvas);

    const theme = new MutationObserver(() => {
      palette = readPalette();
      applyPalette();
      if (reduceMotion) draw(start);
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
      canvas.removeEventListener("webglcontextlost", onLost);
      window.removeEventListener("pointermove", onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
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
