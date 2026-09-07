"use client";

// Imagine: shadcn button rewritten with the Motion press state built in,
// token radii (rounded-control via --radius-lg), softer focus ring, and the
// `soft` variant (raised neutral) in place of shadcn's secondary. Outline is
// kept for the rare cases the wireframes call for it.

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { motion } from "motion/react";
import { Slot } from "radix-ui";

import { type MotionCompatibleProps } from "@/components/motion/types";
import { press } from "@/styles/motion";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-imagine-primary text-imagine-primary-foreground shadow-control inset-shadow-highlight hover:bg-imagine-primary/90",
        soft: "bg-imagine-surface text-imagine-foreground shadow-control hover:bg-imagine-surface-raised aria-expanded:bg-imagine-surface-raised",
        ghost:
          "text-imagine-foreground-muted hover:bg-imagine-surface-raised hover:text-imagine-foreground aria-expanded:bg-imagine-surface-raised aria-expanded:text-imagine-foreground",
        outline:
          "border-imagine-border bg-transparent text-imagine-foreground hover:bg-imagine-surface-raised aria-expanded:bg-imagine-surface-raised",
        destructive:
          "bg-destructive text-white shadow-control inset-shadow-highlight hover:bg-destructive/90 focus-visible:ring-destructive/30",
        link: "text-imagine-foreground underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5",
        lg: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        icon: "size-8",
        "icon-xs": "size-6",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = MotionCompatibleProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element as the button (e.g. a Link). No press motion. */
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      />
    );
  }

  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      whileTap={props.disabled ? undefined : press.whileTap}
      transition={press.transition}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
