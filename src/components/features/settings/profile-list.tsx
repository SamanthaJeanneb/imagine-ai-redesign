"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { spring } from "@/styles/motion";

export type ConnectionStatus = "connected" | "expired" | "disconnected";

export interface ProfileSummary {
  id: string;
  name: string;
  /** Headline or "Company page". */
  headline: string;
  avatarUrl?: string;
  kind: "person" | "company";
  status: ConnectionStatus;
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
      <div className="flex items-center gap-s">
        <SearchField
          value={query}
          onValueChange={setQuery}
          placeholder="Search profiles"
          className="max-w-80"
        />
        {onAdd ? (
          <Button variant="soft" size="sm" className="ml-auto" onClick={onAdd}>
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
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onSelect(profile.id);
                }}
                className={cn(
                  "relative flex w-full items-center gap-m rounded-control px-m py-s text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                  selected
                    ? "bg-imagine-surface-raised"
                    : "hover:bg-imagine-surface-raised/50",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId={indicatorId}
                    aria-hidden="true"
                    transition={spring.snappy}
                    className="absolute inset-y-s left-0 w-0.5 rounded-full bg-imagine-foreground"
                  />
                ) : null}
                <Avatar>
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
                <span
                  aria-label={profile.status}
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    profile.status === "connected" && "bg-success",
                    profile.status === "expired" && "bg-warning",
                    profile.status === "disconnected" &&
                      "bg-imagine-foreground-faint",
                  )}
                />
              </button>
            </StaggerItem>
          );
        })}
      </Stagger>
      <span className="px-m type-small text-imagine-foreground-muted">
        {visible.length} of {profiles.length} profiles
      </span>
    </div>
  );
}
