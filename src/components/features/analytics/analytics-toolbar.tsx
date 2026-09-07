"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type AnalyticsRange = "7d" | "30d" | "90d";

export interface ProfileOption {
  id: string;
  name: string;
}

interface AnalyticsToolbarProps {
  range: AnalyticsRange;
  onRangeChange: (range: AnalyticsRange) => void;
  profiles: readonly ProfileOption[];
  /** `all` or a profile id. */
  profileId: string;
  onProfileChange: (id: string) => void;
  onExport?: () => void;
  className?: string;
}

const RANGES: readonly AnalyticsRange[] = ["7d", "30d", "90d"];

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
      className={cn("flex flex-wrap items-center gap-s", className)}
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
            {item}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Select value={profileId} onValueChange={onProfileChange}>
        <SelectTrigger size="sm" className="w-40" aria-label="Profile">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All profiles</SelectItem>
          {profiles.map((profile) => (
            <SelectItem key={profile.id} value={profile.id}>
              {profile.name}
            </SelectItem>
          ))}
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
