"use client";

// Imagine: shadcn toggle group rewritten as a single-select segmented control
// (Day | Week | Month, 7d | 30d | 90d) with one indicator that slides between
// items. No inline styles; spacing and radius come from tokens.

import { cn } from "cn";
import { motion } from "motion/react";
import { createContext, useContext, useId, useState } from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { spring } from "@/styles/motion";

interface ToggleGroupContextValue {
  value: string;
  indicatorId: string;
  size: "default" | "sm";
}

const ToggleGroupContext = createContext<ToggleGroupContextValue>({
  value: "",
  indicatorId: "toggle-group",
  size: "default",
});

type ToggleGroupProps = Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: "default" | "sm";
};

function ToggleGroup({
  className,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  size = "default",
  children,
  ...props
}: ToggleGroupProps) {
  const indicatorId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      data-slot="toggle-group"
      data-size={size}
      value={value}
      onValueChange={(next) => {
        // Radix sends "" when the active item is pressed again; keep it selected.
        if (next === "") return;
        setUncontrolledValue(next);
        onValueChange?.(next);
      }}
      className={cn(
        "group/toggle-group inline-flex w-fit items-center gap-xxs rounded-control bg-imagine-surface-raised p-xxs data-[size=default]:h-8 data-[size=sm]:h-7",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext value={{ value, indicatorId, size }}>
        {children}
      </ToggleGroupContext>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const context = useContext(ToggleGroupContext);
  const selected = context.value === value;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      value={value}
      className={cn(
        "relative inline-flex h-full min-w-8 shrink-0 items-center justify-center gap-1.5 rounded-control px-2.5 font-medium whitespace-nowrap text-imagine-foreground-muted transition-colors outline-none select-none hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-imagine-foreground",
        context.size === "sm" ? "text-xs" : "text-sm",
        className,
      )}
      {...props}
    >
      {selected ? (
        <motion.span
          layoutId={context.indicatorId}
          aria-hidden="true"
          transition={spring.snappy}
          className="absolute inset-0 rounded-control bg-imagine-surface shadow-sm"
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
