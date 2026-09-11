"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { formatDayMonthYear } from "@/lib/format";
import { pressRow, spring } from "@/styles/motion";

export type ConnectionStatus = "connected" | "disconnected";

export const CONNECTION_LABEL: Record<ConnectionStatus, string> = {
  connected: "Connected",
  disconnected: "Not connected",
};

export interface ProfileSummary {
  id: string;
  name: string;
  /** Headline or "Company page". */
  headline: string;
  avatarUrl?: string;
  kind: "person" | "company";
  status: ConnectionStatus;
  /** ISO time LinkedIn was first linked. Absent until they connect. */
  connectedAt?: string;
}

interface ProfileListProps {
  profiles: readonly ProfileSummary[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onAdd?: () => void;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Settings, Profiles: search, add, and the list of LinkedIn identities. The
 * selected row carries a left bar that slides between rows.
 */
export function ProfileList({
  profiles,
  selectedId,
  onSelect,
  onAdd,
  className,
}: ProfileListProps) {
  const [query, setQuery] = useState("");
  const indicatorId = useId();
  const visible = profiles.filter((profile) =>
    profile.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div
      data-slot="profile-list"
      className={cn("flex flex-col gap-l", className)}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-s">
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder="Search profiles"
          className="min-w-0 flex-1"
        />
        {onAdd ? (
          <Button variant="soft" size="sm" className="ml-auto shrink-0" onClick={onAdd}>
            <Icon name="plus" size="s" data-icon="inline-start" />
            Add profile
          </Button>
        ) : null}
      </div>
      <Stagger kind="list" className="flex flex-col gap-xxs">
        {visible.map((profile) => {
          const selected = profile.id === selectedId;
          return (
            <StaggerItem key={profile.id}>
              <motion.button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(profile.id);
                }}
                whileTap={pressRow.whileTap}
                transition={pressRow.transition}
                className={cn(
                  "relative flex w-full items-center gap-m rounded-control px-m py-s text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  selected
                    ? "selection-gradient-soft"
                    : "hover:bg-imagine-surface-raised/50",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId={indicatorId}
                    aria-hidden="true"
                    transition={spring.snappy}
                    className="absolute inset-y-s left-0 w-0.5 rounded-full bg-imagine-secondary"
                  />
                ) : null}
                <Avatar
                  shape={profile.kind === "company" ? "square" : "circle"}
                >
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                  ) : null}
                  <AvatarFallback>
                    {profile.kind === "company" ? (
                      <Icon name="building" size="s" />
                    ) : (
                      initials(profile.name)
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate type-body font-medium">
                    {profile.name}
                  </span>
                  <span className="truncate type-small text-imagine-foreground-muted">
                    {profile.headline}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-xxs">
                  <Badge
                    variant={
                      profile.status === "connected" ? "success" : "soft"
                    }
                  >
                    {CONNECTION_LABEL[profile.status]}
                  </Badge>
                  {profile.connectedAt === undefined ? null : (
                    <span className="type-small text-imagine-foreground-muted">
                      Since {formatDayMonthYear(profile.connectedAt)}
                    </span>
                  )}
                </span>
              </motion.button>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
