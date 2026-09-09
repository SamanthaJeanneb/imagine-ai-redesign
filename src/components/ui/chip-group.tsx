"use client";

// Imagine: a row of filter chips, single-select. Unlike ToggleGroup there is
// no track: chips sit apart on the surface and one filled indicator slides
// between them with a shared layoutId. Filters (All | Documents | Images), not
// view switching.

import { cn } from "cn";
import { motion } from "motion/react";
import { createContext, useContext, useId, useState } from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";

import { spring } from "@/styles/motion";

interface ChipGroupContextValue {
  value: string;
  indicatorId: string;
}

const ChipGroupContext = createContext<ChipGroupContextValue>({
  value: "",
  indicatorId: "chip-group",
});

type ChipGroupProps = Omit<
  React.ComponentProps<typeof ToggleGroupPrimitive.Root>,
  "type" | "value" | "defaultValue" | "onValueChange"
> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function ChipGroup({
  className,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
  ...props
}: ChipGroupProps) {
  const indicatorId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;

  return (
    <ToggleGroupPrimitive.Root
      type="single"
      data-slot="chip-group"
      value={value}
      onValueChange={(next) => {
        // Pressing the active chip again keeps it; a filter is never "none".
        if (next === "") return;
        setUncontrolledValue(next);
        onValueChange?.(next);
      }}
      className={cn("flex flex-wrap items-center gap-xs", className)}
      {...props}
    >
      <ChipGroupContext value={{ value, indicatorId }}>
        {children}
      </ChipGroupContext>
    </ToggleGroupPrimitive.Root>
  );
}

function Chip({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  const context = useContext(ChipGroupContext);
  const selected = context.value === value;

  return (
    <ToggleGroupPrimitive.Item
      data-slot="chip"
      value={value}
      className={cn(
        "relative inline-flex h-control-xs shrink-0 items-center justify-center gap-1.5 rounded-control px-s text-xs font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "text-imagine-foreground"
          : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
        className,
      )}
      {...props}
    >
      {selected ? (
        <motion.span
          layoutId={context.indicatorId}
          aria-hidden="true"
          transition={spring.snappy}
          className="absolute inset-0 rounded-control bg-imagine-foreground/8"
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </ToggleGroupPrimitive.Item>
  );
}

export { Chip, ChipGroup };
