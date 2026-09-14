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
import localFont from "next/font/local";
import Image from "next/image";
import type { CSSProperties, PointerEvent, ReactNode } from "react";

import { ambient, spring } from "@/styles/motion";

/** The display serif for the panel's line, and nothing else. */
const cardinalFruit = localFont({
  src: "../../../fonts/cardinal-fruit-regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
});

/** Pixels the front-most layer travels at the panel's edge. */
const PARALLAX = 18;

/** The cloud asset's aspect ratio. */
const CLOUD_ASPECT = "1024 / 665";

interface CloudProps {
  /** Percent box within the scene. */
  style: CSSProperties;
  /** Depth from 0 (far, moves against the pointer) to 1 (near, moves with it). */
  depth: number;
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** Seconds into the drift loop, so the clouds are not in step. */
  offset: number;
  /** Mirror it, so one asset reads as several clouds. */
  flip?: boolean;
  className?: string;
}

/**
 * One cloud photograph, positioned by percent. The parallax offset lives on
 * the outer layer and the slow drift on the inner, so neither fights the other.
 */
function Cloud({ style, depth, x, y, offset, flip, className }: CloudProps) {
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
        className="relative w-full"
        style={{ aspectRatio: CLOUD_ASPECT }}
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
        <Image
          src="/brand/cloud.webp"
          alt=""
          fill
          sizes="(min-width: 768px) 24vw, 0px"
          className={cn(
            "object-contain dark:opacity-40 dark:brightness-90",
            flip && "-scale-x-100",
          )}
        />
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
 * The brand half of sign-in: a headline and the thinker on his rock, floating
 * among clouds. Everything leans a little toward the pointer; the far clouds
 * lean away, so the scene has depth.
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
        "relative isolate flex flex-col overflow-hidden bg-imagine-secondary/6 dark:bg-imagine-secondary/5",
        className,
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-l p-xl pb-0">
        <h2
          className={cn(
            cardinalFruit.className,
            // The serif ships in one weight, so undo the display style's bold
            // rather than let the browser synthesize it; sized up a step to
            // match the sans' presence.
            "mx-auto max-w-80 pt-s text-center type-display font-normal text-balance text-imagine-foreground md:text-[2.125rem] md:leading-[1.15]",
          )}
        >
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
          style={{ left: "-16%", top: "36%", width: "62%" }}
          className="opacity-90"
        />
        <Cloud
          depth={0.2}
          x={x}
          y={y}
          offset={9}
          flip
          style={{ right: "-18%", top: "26%", width: "58%" }}
          className="opacity-85"
        />
        <Cloud
          depth={0.3}
          x={x}
          y={y}
          offset={14}
          style={{ left: "14%", top: "62%", width: "76%" }}
        />

        <motion.div
          style={{ x: statueX, y: statueY, willChange: "transform" }}
          className="absolute inset-x-0 top-[9%] bottom-[4%]"
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
          flip
          style={{ left: "-14%", top: "64%", width: "50%" }}
        />
        <Cloud
          depth={0.9}
          x={x}
          y={y}
          offset={6}
          style={{ right: "-12%", top: "56%", width: "46%" }}
        />
        <Cloud
          depth={1}
          x={x}
          y={y}
          offset={12}
          flip
          style={{ left: "22%", top: "80%", width: "58%" }}
        />
      </div>
    </div>
  );
}
