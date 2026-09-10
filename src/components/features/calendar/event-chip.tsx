"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import type { CSSProperties } from "react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Icon } from "@/components/ui/icon";
import { hoverLift, press } from "@/styles/motion";

export interface EventChipData {
  id: string;
  title: string;
  /** "9:00" or "All day". */
  time: string;
  /** "10:30" when the event has an end on the same day. */
  endTime?: string;
  allDay: boolean;
  location?: string;
  notes?: string;
  calendarName: string;
  source: "google";
  /** "Tue, 8 Sep at 9:00–10:00". */
  whenLabel: string;
}

interface EventChipProps {
  event: EventChipData;
  dense?: boolean;
  onOpen?: (event: EventChipData) => void;
  className?: string;
}

const EVENT_STYLE: CSSProperties & {
  "--chip-color": string;
  "--chip-contrast": string;
} = {
  "--chip-color": "var(--imagine-foreground-muted)",
  "--chip-contrast": "var(--imagine-surface)",
};

/**
 * A connected-calendar event inside a cell. Quieter than a post: charcoal
 * wash, a calendar mark, the title, and the time. Hovering it is how you
 * draft a post about what is coming up.
 */
export function EventChip({
  event,
  dense = false,
  onOpen,
  className,
}: EventChipProps) {
  const range =
    event.allDay || event.endTime === undefined
      ? event.time
      : `${event.time}–${event.endTime}`;

  const chip = (
    <motion.button
      type="button"
      whileTap={press.whileTap}
      whileHover={hoverLift.whileHover}
      transition={press.transition}
      onClick={() => onOpen?.(event)}
      data-slot="event-chip"
      aria-label={`${event.title}, ${event.whenLabel}, ${event.calendarName}`}
      style={EVENT_STYLE}
      className={cn(
        "relative flex w-full min-w-0 flex-col gap-xxs overflow-hidden rounded-control px-s py-xs pl-m text-left text-imagine-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-imagine-surface",
        "chip-wash shadow-control @max-[6rem]/chip:pr-xs @max-[6rem]/chip:pl-s",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5 bg-[var(--chip-color)]"
      />
      <span className="flex min-w-0 items-center gap-xs">
        <Icon
          name="calendar"
          size="s"
          className="shrink-0 text-imagine-foreground-muted"
        />
        <span className="min-w-0 flex-1 truncate type-caption font-semibold">
          {event.title}
        </span>
      </span>
      {dense ? null : (
        <span className="type-caption text-imagine-foreground-muted tabular-nums">
          {range}
        </span>
      )}
    </motion.button>
  );

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{chip}</HoverCardTrigger>
      <HoverCardContent
        aria-label={`Event: ${event.title}`}
        className="w-80 p-l"
      >
        <EventPreview event={event} onDraft={onOpen} />
      </HoverCardContent>
    </HoverCard>
  );
}

function EventPreview({
  event,
  onDraft,
}: {
  event: EventChipData;
  onDraft?: (event: EventChipData) => void;
}) {
  return (
    <div className="flex flex-col gap-m">
      <div className="flex items-start gap-m">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-imagine-surface-raised text-imagine-foreground-muted">
          <Icon name="calendar" size="l" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-xxs">
          <span className="type-body font-semibold">{event.title}</span>
          <span className="type-small text-imagine-foreground-muted">
            {event.whenLabel}
          </span>
          {event.location === undefined ? null : (
            <span className="type-small text-imagine-foreground-muted">
              {event.location}
            </span>
          )}
        </div>
      </div>
      {event.notes === undefined ? null : (
        <p className="type-small text-imagine-foreground-muted">
          {event.notes}
        </p>
      )}
      <span className="inline-flex items-center gap-xs type-caption text-imagine-foreground-faint">
        <Icon name="google" size="s" />
        {event.calendarName}
      </span>
      {onDraft === undefined ? null : (
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            onDraft(event);
          }}
        >
          Draft a post about this
        </Button>
      )}
    </div>
  );
}
