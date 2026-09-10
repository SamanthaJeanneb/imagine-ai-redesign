"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { TimeRange } from "@/entities/analytics";

export interface ProfileOption {
  id: string;
  name: string;
}

interface AnalyticsToolbarProps {
  range: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  profiles: readonly ProfileOption[];
  /** `all` or a profile id. */
  profileId: string;
  onProfileChange: (id: string) => void;
  onExport?: () => void;
  className?: string;
}

/** The three the toolbar offers, out of the app's full `TimeRange`. */
const RANGES = ["7d", "1m", "3m"] as const satisfies readonly TimeRange[];
const RANGE_LABEL: Record<(typeof RANGES)[number], string> = {
  "7d": "7d",
  "1m": "30d",
  "3m": "90d",
};

/** Range, profile filter, and export. */
export function AnalyticsToolbar({
  range,
  onRangeChange,
  profiles,
  profileId,
  onProfileChange,
  onExport,
  className,
}: AnalyticsToolbarProps) {
  return (
    <div
      data-slot="analytics-toolbar"
      className={cn("flex min-w-0 flex-wrap items-center gap-s", className)}
    >
      <ToggleGroup
        value={range}
        size="sm"
        aria-label="Range"
        onValueChange={(next) => {
          const found = RANGES.find((item) => item === next);
          if (found) onRangeChange(found);
        }}
      >
        {RANGES.map((item) => (
          <ToggleGroupItem key={item} value={item}>
            {RANGE_LABEL[item]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={profileId} onValueChange={onProfileChange}>
        <SelectTrigger size="sm" className="w-full min-w-0 sm:w-40" aria-label="Profile">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {onExport ? (
        <Button size="sm" variant="soft" onClick={onExport}>
          <Icon name="download" size="s" data-icon="inline-start" />
          Export
        </Button>
      ) : null}
    </div>
  );
}
