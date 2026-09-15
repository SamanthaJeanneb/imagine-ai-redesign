import { cn } from "cn";

/**
 * A day's number wherever a calendar shows one: filled in the primary when it
 * is today, faint when the day belongs to a neighbouring month.
 */
export function CalendarDayNumber({
  day,
  className,
}: {
  day: { dayNumber: number; isToday?: boolean; isOutside?: boolean };
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-5 items-center justify-center rounded-full type-small tabular-nums",
        day.isToday
          ? "bg-imagine-primary font-semibold text-imagine-primary-foreground"
          : day.isOutside
            ? "text-imagine-foreground-faint"
            : "text-imagine-foreground-muted",
        className,
      )}
    >
      {day.dayNumber}
    </span>
  );
}
