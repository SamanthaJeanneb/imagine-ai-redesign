// Imagine: shadcn skeleton with the gradient shimmer sweep instead of a pulse.

import { cn } from "cn";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("shimmer rounded-control", className)}
      {...props}
    />
  );
}

export { Skeleton };
