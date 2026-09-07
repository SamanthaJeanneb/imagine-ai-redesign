"use client";

// Imagine: shadcn tabs rewritten so the selected state is one indicator that
// slides between triggers (shared layoutId), not a highlight applied per item.
// `default` is a raised pill track with a surface indicator; `line` is an
// underline in imagine-foreground.

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { motion } from "motion/react";
import { createContext, useContext, useId, useState } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";

import { spring } from "@/styles/motion";

interface TabsContextValue {
  value: string | undefined;
  indicatorId: string;
  variant: "default" | "line";
}

const TabsContext = createContext<TabsContextValue>({
  value: undefined,
  indicatorId: "tabs",
  variant: "default",
});

type TabsProps = React.ComponentProps<typeof TabsPrimitive.Root> & {
  variant?: "default" | "line";
};

function Tabs({
  className,
  orientation = "horizontal",
  variant = "default",
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: TabsProps) {
  const indicatorId = useId();
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = controlledValue ?? uncontrolledValue;

  return (
    <TabsContext value={{ value, indicatorId, variant }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        data-orientation={orientation}
        orientation={orientation}
        value={value}
        onValueChange={(next) => {
          setUncontrolledValue(next);
          onValueChange?.(next);
        }}
        className={cn(
          "group/tabs flex gap-s data-horizontal:flex-col",
          className,
        )}
        {...props}
      />
    </TabsContext>
  );
}

const tabsListVariants = cva(
  "group/tabs-list relative inline-flex w-fit items-center justify-center text-imagine-foreground-muted group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "rounded-control bg-imagine-surface-raised p-xxs group-data-horizontal/tabs:h-control-lg",
        line: "gap-xs",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  Omit<VariantProps<typeof tabsListVariants>, "variant">) {
  const { variant } = useContext(TabsContext);
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const context = useContext(TabsContext);
  const selected = context.value === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "relative inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-control px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-active:text-imagine-foreground",
        context.variant === "line" && "px-1.5 py-1.5",
        className,
      )}
      {...props}
    >
      {selected ? (
        <motion.span
          layoutId={context.indicatorId}
          aria-hidden="true"
          transition={spring.snappy}
          className={cn(
            context.variant === "default"
              ? "absolute inset-0 rounded-control bg-imagine-surface shadow-control"
              : "absolute inset-x-0 -bottom-xs h-0.5 rounded-full bg-imagine-foreground",
          )}
        />
      ) : null}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
