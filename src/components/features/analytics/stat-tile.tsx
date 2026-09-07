import { cn } from "cn";

import { Icon } from "@/components/ui/icon";

export interface StatDelta {
  /** Already formatted, e.g. "+12%". */
  label: string;
  direction: "up" | "down" | "flat";
}

interface StatTileProps {
  /** Already formatted, e.g. "12.4k". */
  value: string;
  label: string;
  delta?: StatDelta;
  size?: "default" | "compact";
  className?: string;
}

/**
 * A headline number. Not a card: tiles sit on the surface and are grouped by
 * the parent (`StatGroup`) when they need a shared background.
 */
export function StatTile({
  value,
  label,
  delta,
  size = "default",
  className,
}: StatTileProps) {
  return (
    <div
      data-slot="stat-tile"
      className={cn("flex min-w-0 flex-col gap-xxs", className)}
    >
      <span
        className={cn(
          "font-semibold tracking-tight tabular-nums",
          size === "compact" ? "type-title" : "type-display",
        )}
      >
        {value}
      </span>
      <span className="flex min-w-0 items-center gap-s">
        <span className="truncate type-small text-imagine-foreground-muted">
          {label}
        </span>
        {delta ? (
          <span
            className={cn(
              "inline-flex h-5 shrink-0 items-center gap-xxs rounded-full px-1.5 type-small font-medium tabular-nums",
              delta.direction === "up" && "bg-success/10 text-success",
              delta.direction === "down" &&
                "bg-destructive/10 text-destructive",
              delta.direction === "flat" &&
                "bg-imagine-surface-raised text-imagine-foreground-muted",
            )}
          >
            {delta.direction === "flat" ? null : (
              <Icon
                name={delta.direction === "up" ? "arrow-up" : "arrow-down"}
                size="s"
              />
            )}
            {delta.label}
          </span>
        ) : null}
      </span>
    </div>
  );
}

interface StatGroupProps extends React.ComponentProps<"div"> {
  columns?: 2 | 4;
}

/** One soft background around a set of tiles, never a border per tile. */
export function StatGroup({
  columns = 4,
  className,
  ...props
}: StatGroupProps) {
  return (
    <div
      data-slot="stat-group"
      className={cn(
        "grid gap-l rounded-panel bg-imagine-surface-raised p-l shadow-control",
        columns === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2",
        className,
      )}
      {...props}
    />
  );
}
