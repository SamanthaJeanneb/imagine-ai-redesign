"use client";

import { cn } from "cn";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import type { CSSProperties, PointerEvent, ReactNode } from "react";

import { ambient, spring } from "@/styles/motion";

/** Pixels the front-most layer travels at the panel's edge. */
const PARALLAX = 18;

interface CloudProps {
  /** Percent box within the panel. */
  style: CSSProperties;
  /** Depth from 0 (far, moves against the pointer) to 1 (near, moves with it). */
  depth: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Seconds into the drift loop, so the clouds are not in step. */
  offset: number;
  className?: string;
}

/**
 * A cloud is four blurred puffs on a flat base. Blur is on the puffs, not the
 * cloud, so each stays its own compositor layer and the drift is a transform.
 */
function Cloud({ style, depth, x, y, offset, className }: CloudProps) {
  const reduceMotion = useReducedMotion();
  const shift = (depth - 0.5) * 2 * PARALLAX;
  const cloudX = useTransform(x, [-0.5, 0.5], [-shift, shift]);
  const cloudY = useTransform(y, [-0.5, 0.5], [-shift * 0.6, shift * 0.6]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute", className)}
      style={{ ...style, x: cloudX, y: cloudY, willChange: "transform" }}
    >
      <motion.div
        className="relative aspect-[5/2] w-full"
        animate={
          reduceMotion
            ? undefined
            : {
                transform: [
                  "translateX(0px)",
                  `translateX(${String(10 + depth * 10)}px)`,
                  "translateX(0px)",
                ],
              }
        }
        transition={{
          duration: ambient.drift + depth * 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: -offset,
        }}
      >
        <span className="absolute bottom-0 left-[4%] h-[52%] w-[92%] rounded-full bg-white/95 blur-sm dark:bg-white/30" />
        <span className="absolute bottom-[24%] left-[12%] h-[62%] w-[40%] rounded-full bg-white blur-sm dark:bg-white/34" />
        <span className="absolute bottom-[18%] left-[40%] h-[84%] w-[40%] rounded-full bg-white blur-sm dark:bg-white/38" />
        <span className="absolute bottom-[26%] left-[68%] h-[50%] w-[28%] rounded-full bg-white/95 blur-sm dark:bg-white/30" />
      </motion.div>
    </motion.div>
  );
}

interface ThinkerPanelProps {
  /** Sits over the scene, top right: the theme switch. */
  corner?: ReactNode;
  className?: string;
}

/**
 * The brand half of sign-in: a headline, the thinker on his rock floating
 * among clouds, and a footer line. Everything leans a little toward the
 * pointer; the far clouds lean away, so the scene has depth.
 */
export function ThinkerPanel({ corner, className }: ThinkerPanelProps) {
  const reduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const x = useSpring(pointerX, spring.lazy);
  const y = useSpring(pointerY, spring.lazy);
  const statueX = useTransform(
    x,
    [-0.5, 0.5],
    [-PARALLAX * 0.4, PARALLAX * 0.4],
  );
  const statueY = useTransform(
    y,
    [-0.5, 0.5],
    [-PARALLAX * 0.25, PARALLAX * 0.25],
  );
  const glowX = useTransform(x, [-0.5, 0.5], [PARALLAX, -PARALLAX]);

  function track(event: PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function release() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <div
      onPointerMove={track}
      onPointerLeave={release}
      className={cn(
        "relative isolate flex flex-col overflow-hidden bg-imagine-secondary/12 dark:bg-imagine-secondary/8",
        className,
      )}
    >
      {/* Warm glow behind the figure. */}
      <motion.div
        aria-hidden="true"
        style={{ x: glowX }}
        className="pointer-events-none absolute inset-x-[-20%] top-[18%] h-[70%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--imagine-secondary)_0%,transparent_65%)] opacity-25 blur-2xl dark:opacity-30"
      />

      <div className="relative z-10 flex items-start justify-between gap-l p-xl pb-0">
        <h2 className="mx-auto max-w-80 pt-m text-center type-display text-balance text-imagine-foreground">
          Turn what you know into your next post.
        </h2>
        {corner ? <div className="absolute top-l right-l">{corner}</div> : null}
      </div>

      {/* Scene. Back clouds, statue, front clouds. */}
      <div className="relative -mt-s flex-1">
        <Cloud
          depth={0.1}
          x={x}
          y={y}
          offset={3}
          style={{ left: "-8%", top: "44%", width: "48%" }}
          className="opacity-90"
        />
        <Cloud
          depth={0.2}
          x={x}
          y={y}
          offset={9}
          style={{ right: "-8%", top: "36%", width: "44%" }}
          className="opacity-85"
        />
        <Cloud
          depth={0.3}
          x={x}
          y={y}
          offset={14}
          style={{ left: "20%", top: "72%", width: "60%" }}
        />

        <motion.div
          style={{ x: statueX, y: statueY, willChange: "transform" }}
          className="absolute inset-x-0 top-[5%] bottom-[7%]"
        >
          <motion.div
            className="relative size-full"
            animate={
              reduceMotion
                ? undefined
                : {
                    transform: [
                      "translateY(0px)",
                      "translateY(-8px)",
                      "translateY(0px)",
                    ],
                  }
            }
            transition={{
              duration: ambient.float,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Image
              src="/brand/thinker.png"
              alt="The Thinker, seated on a floating rock"
              fill
              priority
              sizes="(min-width: 768px) 30vw, 0px"
              className="object-contain object-bottom drop-shadow-[0_24px_40px_rgb(0_0_0/0.18)]"
            />
          </motion.div>
        </motion.div>

        <Cloud
          depth={0.75}
          x={x}
          y={y}
          offset={0}
          style={{ left: "-4%", top: "68%", width: "36%" }}
        />
        <Cloud
          depth={0.9}
          x={x}
          y={y}
          offset={6}
          style={{ right: "-3%", top: "60%", width: "32%" }}
        />
        <Cloud
          depth={1}
          x={x}
          y={y}
          offset={12}
          style={{ left: "30%", top: "86%", width: "42%" }}
        />
      </div>

      <div className="relative z-10 mx-xl mb-l flex items-center justify-between gap-l border-t border-imagine-foreground/10 pt-m type-micro text-imagine-foreground-muted">
        <span>LinkedIn content for B2B teams</span>
        <span className="inline-flex items-center gap-xs tracking-normal normal-case">
          Backed by
          <span
            aria-hidden="true"
            className="ml-xs inline-flex size-4 items-center justify-center rounded-xs bg-imagine-foreground type-caption font-semibold text-imagine-surface"
          >
            Y
          </span>
          Combinator
        </span>
      </div>
    </div>
  );
}
