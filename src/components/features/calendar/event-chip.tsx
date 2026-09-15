"use client";

import { cn } from "cn";
import type { ReactNode } from "react";

import {
  ChipHoverCard,
  ChipRail,
  ChipShell,
  chipStyle,
} from "@/components/features/calendar/chip-shell";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";

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
  onOpen?: (event: EventChipData) => void;
  className?: string;
}

/** The glyph for the calendar the event came from. */
const SOURCE_ICON = {
  google: "google",
} as const satisfies Record<EventChipData["source"], IconName>;

/**
 * Plum, the one color no post status uses, so events read apart from posts at
 * a glance.
 */
const EVENT_STYLE = chipStyle("var(--imagine-tag-5)", "var(--imagine-surface)");

/**
 * The chip's chrome, shared by every variant: the plum chip and its rail.
 * Hovering it is how you draft a post about what is coming up.
 */
function EventChipButton({
  event,
  onOpen,
  className,
  children,
}: EventChipProps & { children: ReactNode }) {
  return (
    <ChipHoverCard
      chip={
        <ChipShell
          onClick={() => onOpen?.(event)}
          data-slot="event-chip"
          aria-label={`${event.title}, ${event.whenLabel}, ${event.calendarName}`}
          style={EVENT_STYLE}
          className={cn(
            "flex-col gap-xxs chip-wash text-imagine-foreground @max-[6rem]/chip:pr-xs",
            className,
          )}
        >
          <ChipRail />
          {children}
        </ChipShell>
      }
      label={`Event: ${event.title}`}
      className="w-[26rem] p-l"
    >
      <EventPreview event={event} onDraft={onOpen} />
    </ChipHoverCard>
  );
}

function EventChipTitle({ event }: { event: EventChipData }) {
  return (
    <span className="min-w-0 truncate type-caption font-semibold">
      {event.title}
    </span>
  );
}

/** "9:00–10:00", or just the start when the event is all day or open-ended. */
function rangeOf(event: EventChipData): string {
  return event.allDay || event.endTime === undefined
    ? event.time
    : `${event.time}–${event.endTime}`;
}

/** A connected-calendar event inside a cell: the title and the time. */
export function EventChip({ event, onOpen, className }: EventChipProps) {
  return (
    <EventChipButton
      event={event}
      onOpen={onOpen}
      className={cn("py-xs", className)}
    >
      <EventChipTitle event={event} />
      <span className="type-caption text-imagine-foreground-muted tabular-nums">
        {rangeOf(event)}
      </span>
    </EventChipButton>
  );
}

/** Drops the time line so the title gets the room. */
export function EventChipDense({ event, onOpen, className }: EventChipProps) {
  return (
    <EventChipButton
      event={event}
      onOpen={onOpen}
      className={cn("py-xs", className)}
    >
      <EventChipTitle event={event} />
    </EventChipButton>
  );
}

/** One tight line: the mark and the title. For a cell with no height to spare. */
export function EventChipLine({ event, onOpen, className }: EventChipProps) {
  return (
    <EventChipButton
      event={event}
      onOpen={onOpen}
      className={cn("py-xxs", className)}
    >
      <EventChipTitle event={event} />
    </EventChipButton>
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
      <div className="flex min-w-0 flex-col gap-xxs">
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
      {event.notes === undefined ? null : (
        <p className="type-small text-imagine-foreground-muted">
          {event.notes}
        </p>
      )}
      <span className="inline-flex items-center gap-xs type-caption text-imagine-foreground-faint">
        <Icon name={SOURCE_ICON[event.source]} size="s" />
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
