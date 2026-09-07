"use client";

// Imagine: switch on Radix with a spring-driven thumb. Primary fill when on.

import { cn } from "cn";
import { motion } from "motion/react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { useState } from "react";

import { spring } from "@/styles/motion";

type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>;

function Switch({
  className,
  checked: controlledChecked,
  defaultChecked = false,
  ...props
}: SwitchProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  const checked = controlledChecked ?? uncontrolled;

  return (
    <SwitchPrimitive.Root
      {...props}
      data-slot="switch"
      checked={checked}
      onCheckedChange={(next) => {
        setUncontrolled(next);
        props.onCheckedChange?.(next);
      }}
      className={cn(
        "inline-flex h-5 w-8 shrink-0 items-center rounded-full p-0.5 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-imagine-primary" : "bg-imagine-foreground-faint/60",
        checked ? "justify-end" : "justify-start",
        className,
      )}
    >
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          layout
          transition={spring.snappy}
          className="block size-4 rounded-full bg-imagine-surface shadow-sm"
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
