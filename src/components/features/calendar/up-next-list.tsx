"use client";

import { NOTHING_SCHEDULED } from "@/components/features/calendar/calendar-copy";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";

export interface UpNextItem {
  id: string;
  /** "Tue 9:00". */
  when: string;
  title: string;
  profileName: string;
}

interface UpNextListProps {
  items: readonly UpNextItem[];
  onViewAll?: () => void;
}

/** The right rail's "Up next": time column, title, profile. */
export function UpNextList({ items, onViewAll }: UpNextListProps) {
  return (
    <div data-slot="up-next" className="flex flex-col gap-m">
      <span className="type-heading">Up next</span>
      {items.length === 0 ? (
        <p className="type-small text-imagine-foreground-muted">
          {NOTHING_SCHEDULED}
        </p>
      ) : (
        <Stagger kind="list" className="flex flex-col">
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <div className="flex items-start gap-m py-s">
                <span className="w-14 shrink-0 pt-px type-small text-imagine-foreground-muted tabular-nums">
                  {item.when}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="line-clamp-2 type-body">{item.title}</span>
                  <span className="truncate type-small text-imagine-foreground-muted">
                    {item.profileName}
                  </span>
                </span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
      {onViewAll ? (
        <Button
          variant="link"
          size="sm"
          className="self-start px-0 text-imagine-foreground-muted"
          onClick={onViewAll}
        >
          Open calendar
        </Button>
      ) : null}
    </div>
  );
}
