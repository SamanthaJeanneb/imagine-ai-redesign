"use client";

import * as React from "react";
import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";

import { fade, spring } from "@/styles/motion";

const OpenContext = React.createContext(false);

/**
 * Hover preview. Wraps Radix HoverCard and keeps `open` in React so the
 * content can animate in and out with motion instead of CSS keyframes.
 */
function HoverCard({
  open,
  defaultOpen = false,
  onOpenChange,
  openDelay = 250,
  closeDelay = 120,
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isOpen = open ?? uncontrolled;

  return (
    <OpenContext value={isOpen}>
      <HoverCardPrimitive.Root
        data-slot="hover-card"
        open={isOpen}
        onOpenChange={(next) => {
          setUncontrolled(next);
          onOpenChange?.(next);
        }}
        openDelay={openDelay}
        closeDelay={closeDelay}
        {...props}
      >
        {children}
      </HoverCardPrimitive.Root>
    </OpenContext>
  );
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}

function HoverCardContent({
  className,
  side = "top",
  align = "start",
  sideOffset = 8,
  collisionPadding = 12,
  children,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  const open = React.useContext(OpenContext);
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, scale: 0.96, y: side === "top" ? 4 : -4 };

  return (
    <AnimatePresence>
      {open ? (
        <HoverCardPrimitive.Portal forceMount>
          <HoverCardPrimitive.Content
            forceMount
            asChild
            side={side}
            align={align}
            sideOffset={sideOffset}
            collisionPadding={collisionPadding}
            {...props}
          >
            <motion.div
              data-slot="hover-card-content"
              initial={hidden}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ ...hidden, transition: fade.fast }}
              transition={spring.snappy}
              className={cn(
                "z-50 w-80 origin-(--radix-hover-card-content-transform-origin) rounded-panel bg-imagine-surface shadow-floating outline-none",
                className,
              )}
            >
              {children}
            </motion.div>
          </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  );
}

export { HoverCard, HoverCardContent, HoverCardTrigger };
