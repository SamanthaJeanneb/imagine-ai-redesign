import { cn } from "cn";

/** Text placeholder with a gradient sweep. Pass real text for status copy. */
export function Shimmer({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="shimmer"
      className={cn("inline-block shimmer-text", className)}
      {...props}
    />
  );
}
