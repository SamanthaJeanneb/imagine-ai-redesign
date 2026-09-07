"use client";

// Imagine: checkbox on Radix with a check that draws in, primary fill when
// checked, control radius scaled down for the 16px box.

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { fade } from "@/styles/motion";

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;

function Checkbox({
  className,
  checked: controlledChecked,
  defaultChecked = false,
  ...props
}: CheckboxProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = controlledChecked ?? uncontrolled;

  return (
    <CheckboxPrimitive.Root
      {...props}
      data-slot="checkbox"
      checked={checked}
      onCheckedChange={(next) => {
        setUncontrolled(next);
        props.onCheckedChange?.(next);
      }}
      className={cn(
        "peer flex size-4 shrink-0 items-center justify-center rounded-xs border border-imagine-border bg-imagine-surface transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-imagine-primary data-[state=checked]:bg-imagine-primary data-[state=checked]:text-imagine-primary-foreground",
        className,
      )}
    >
      <CheckboxPrimitive.Indicator forceMount asChild>
        <span className="flex items-center justify-center">
          <AnimatePresence initial={false}>
            {checked === true ? (
              <motion.span
                key="check"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={fade.fast}
                className="flex"
              >
                <Icon name="check" size="s" active />
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
