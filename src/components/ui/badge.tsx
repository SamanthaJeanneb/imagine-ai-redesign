// Imagine: shadcn badge for status only. Control radius instead of a pill,
// token colors, plus `accent` (soft pink) and `success`/`warning` states.

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-control border border-transparent px-1.5 text-xs font-medium whitespace-nowrap transition-colors has-data-[icon=inline-end]:pr-1 has-data-[icon=inline-start]:pl-1",
  {
    variants: {
      variant: {
        default: "bg-imagine-primary text-imagine-primary-foreground",
        soft: "bg-imagine-surface-raised text-imagine-foreground-muted",
        accent: "bg-imagine-secondary-soft text-imagine-secondary",
        outline: "border-imagine-border text-imagine-foreground-muted",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
