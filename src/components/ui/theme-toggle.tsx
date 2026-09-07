"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { spring } from "@/styles/motion";

const subscribe = () => () => undefined;

/**
 * Light/dark switch. Renders a neutral icon until the client theme is known,
 * then the sun and moon rotate through each other on every switch.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  const turn = reduceMotion ? 0 : 90;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
      }}
      className="relative overflow-hidden"
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={isDark ? "sun" : "moon"}
          className="flex"
          initial={{ opacity: 0, rotate: -turn, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: turn, scale: 0.6 }}
          transition={spring.snappy}
        >
          <Icon name={isDark ? "sun" : "moon"} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
