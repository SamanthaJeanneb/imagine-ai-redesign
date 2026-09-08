"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type {
  ConnectionStatus,
  ProfileSummary,
} from "@/components/features/settings/profile-list";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchField } from "@/components/ui/search-field";
import { fade, pop, pressRow, spring } from "@/styles/motion";
import { spacing } from "@/styles/tokens";

interface ProfileSelectorProps {
  profiles: readonly ProfileSummary[];
  selectedIds: readonly string[];
  onSelectedIdsChange: (ids: readonly string[]) => void;
  /** Which edge of the trigger the list hangs from. `end` for a right-aligned home. */
  align?: "start" | "end";
  /** Faces and the chevron only, for a header that has something else to say. */
  compact?: boolean;
  /** The "Posting as" lead-in. Off when the header is tight and the name is enough. */
  prefix?: boolean;
  className?: string;
}

/** How many faces the trigger shows before it counts the rest. */
const FACES = 3;

/**
 * The sentence folds into the faces when the trigger goes compact and unfolds
 * when it comes back: the width and its gap ride one spring, the ink fades a
 * beat faster so no letters are seen being clipped.
 */
const LABEL = {
  initial: { width: 0, marginLeft: 0, opacity: 0 },
  animate: { width: "auto", marginLeft: spacing.s, opacity: 1 },
  exit: { width: 0, marginLeft: 0, opacity: 0 },
  transition: { ...spring.snappy, opacity: fade.fast },
} as const;

/** The lead-in folds on its own so the name can stay when the sentence shortens. */
const PREFIX = {
  initial: { width: 0, marginRight: 0, opacity: 0 },
  animate: { width: "auto", marginRight: spacing.xs, opacity: 1 },
  exit: { width: 0, marginRight: 0, opacity: 0 },
  transition: { ...spring.snappy, opacity: fade.fast },
} as const;

const STATUS_NOTE: Record<Exclude<ConnectionStatus, "connected">, string> = {
  expired: "Expired",
  disconnected: "Not connected",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function ProfileAvatar({
  profile,
  size,
}: {
  profile: ProfileSummary;
  size: "sm" | "default";
}) {
  return (
    <Avatar
      size={size}
      shape={profile.kind === "company" ? "square" : "circle"}
    >
      {profile.avatarUrl ? (
        <AvatarImage src={profile.avatarUrl} alt="" />
      ) : null}
      <AvatarFallback>
        {profile.kind === "company" ? (
          <Icon name="building" size="s" />
        ) : (
          initials(profile.name)
        )}
      </AvatarFallback>
    </Avatar>
  );
}

/** What the trigger says about the selection, after "Posting as". */
function summary(
  profiles: readonly ProfileSummary[],
  selected: readonly ProfileSummary[],
): string {
  if (selected.length === 0) return "no one";
  if (selected.length === profiles.length && profiles.length > 1) {
    return "all profiles";
  }
  if (selected.length === 1) return selected[0]?.name ?? "";
  return `${String(selected.length)} profiles`;
}

/** A hairline row above a run of rows in the list. */
function Eyebrow({ children }: { children: string }) {
  return (
    <li
      aria-hidden="true"
      className="px-s pt-s pb-xxs type-micro font-semibold text-imagine-foreground-faint"
    >
      {children}
    </li>
  );
}

/**
 * Which LinkedIn identities the agent is working across. The trigger is the
 * faces of whoever is selected and a sentence about them; the popover is the
 * list, company pages then people, each row a toggle, with a search above it
 * and the count and shortcuts below.
 */
export function ProfileSelector({
  profiles,
  selectedIds,
  onSelectedIdsChange,
  align = "start",
  compact = false,
  prefix = true,
  className,
}: ProfileSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = new Set(selectedIds);
  const selected = profiles.filter((profile) => selectedSet.has(profile.id));
  const trimmed = query.trim().toLowerCase();
  const visible =
    trimmed === ""
      ? profiles
      : profiles.filter(
          (profile) =>
            profile.name.toLowerCase().includes(trimmed) ||
            profile.headline.toLowerCase().includes(trimmed),
        );
  const companies = visible.filter((profile) => profile.kind === "company");
  const people = visible.filter((profile) => profile.kind === "person");
  const grouped = companies.length > 0 && people.length > 0;
  const allSelected = selected.length === profiles.length;

  function toggle(id: string) {
    onSelectedIdsChange(
      selectedSet.has(id)
        ? selectedIds.filter((current) => current !== id)
        : [...selectedIds, id],
    );
  }

  function renderRow(profile: ProfileSummary) {
    const checked = selectedSet.has(profile.id);
    const note =
      profile.status === "connected" ? null : STATUS_NOTE[profile.status];
    return (
      <li key={profile.id}>
        <motion.button
          type="button"
          aria-pressed={checked}
          onClick={() => {
            toggle(profile.id);
          }}
          whileTap={pressRow.whileTap}
          transition={pressRow.transition}
          // Who's in is told by the check and the weight of the name, not a
          // wash behind the row; hover is a solid step.
          className="flex w-full items-center gap-m rounded-control px-s py-xs text-left transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <ProfileAvatar profile={profile} size="default" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-s">
              <span
                className={cn(
                  "truncate type-small font-medium",
                  checked
                    ? "text-imagine-foreground"
                    : "text-imagine-foreground-muted",
                )}
              >
                {profile.name}
              </span>
              {note === null ? null : (
                <span className="shrink-0 text-xs font-medium text-warning">
                  {note}
                </span>
              )}
            </span>
            <span className="truncate text-xs text-imagine-foreground-muted">
              {profile.headline}
            </span>
          </span>
          <span
            aria-hidden="true"
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-xs border transition-colors",
              checked
                ? "border-imagine-primary bg-imagine-primary text-imagine-primary-foreground"
                : "border-imagine-foreground-faint",
            )}
          >
            <AnimatePresence initial={false}>
              {checked ? (
                <motion.span
                  key="check"
                  initial={pop.initial}
                  animate={pop.animate}
                  exit={pop.exit}
                  transition={pop.transition}
                  className="flex"
                >
                  <Icon name="check" size="s" active />
                </motion.span>
              ) : null}
            </AnimatePresence>
          </span>
        </motion.button>
      </li>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Posting as ${summary(profiles, selected)}`}
          data-slot="profile-selector-trigger"
          // `--face-ring` is the cut-out between stacked faces: the page
          // surface at rest, the button's own fill when hovered or open, so
          // the ring is always a solid color and never a halo.
          // No `gap`: the label carries its own, so it can take it along
          // when it folds away.
          className={cn(
            "gap-0 pl-1.5 text-sm text-imagine-foreground [--face-ring:var(--color-imagine-surface)] hover:[--face-ring:var(--color-imagine-surface-raised)] aria-expanded:[--face-ring:var(--color-imagine-surface-raised)]",
            className,
          )}
        >
          {selected.length > 0 ? (
            <AvatarGroup className="-space-x-1.5 *:data-[slot=avatar]:ring-(--face-ring)">
              {selected.slice(0, FACES).map((profile) => (
                <ProfileAvatar key={profile.id} profile={profile} size="sm" />
              ))}
              {selected.length > FACES ? (
                <AvatarGroupCount className="bg-imagine-border text-xs font-semibold text-imagine-foreground ring-(--face-ring)">
                  +{selected.length - FACES}
                </AvatarGroupCount>
              ) : null}
            </AvatarGroup>
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full border border-dashed border-imagine-foreground-faint text-imagine-foreground-muted">
              <Icon name="user" size="s" />
            </span>
          )}
          <AnimatePresence initial={false}>
            {compact ? null : (
              <motion.span
                key="label"
                {...LABEL}
                className="flex items-baseline overflow-hidden whitespace-nowrap"
              >
                <AnimatePresence initial={false}>
                  {prefix ? (
                    <motion.span
                      key="prefix"
                      {...PREFIX}
                      className="overflow-hidden font-normal text-imagine-foreground-muted"
                    >
                      Posting as
                    </motion.span>
                  ) : null}
                </AnimatePresence>
                <span className="font-medium">
                  {summary(profiles, selected)}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
          <motion.span
            aria-hidden="true"
            animate={{ rotate: open ? 180 : 0 }}
            transition={spring.snappy}
            className="ml-s flex text-imagine-foreground-faint"
            data-icon="inline-end"
          >
            <Icon name="chevron-down" size="s" />
          </motion.span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align={align} sideOffset={6} className="w-80 gap-0 p-0">
        <div className="border-b border-imagine-border p-s">
          <SearchField
            value={query}
            onValueChange={setQuery}
            placeholder="Search profiles"
            autoFocus
          />
        </div>

        <ul
          aria-label="Profiles"
          className="flex max-h-80 flex-col gap-xxs overflow-y-auto p-s"
        >
          {visible.length === 0 ? (
            <li className="px-m py-xl text-center type-small text-imagine-foreground-muted">
              No profiles match &ldquo;{query.trim()}&rdquo;
            </li>
          ) : (
            <>
              {grouped ? (
                <Eyebrow>
                  {companies.length === 1 ? "Company page" : "Company pages"}
                </Eyebrow>
              ) : null}
              {companies.map(renderRow)}
              {grouped ? <Eyebrow>People</Eyebrow> : null}
              {people.map(renderRow)}
            </>
          )}
        </ul>

        <div className="flex items-center justify-between gap-s border-t border-imagine-border px-s py-xs">
          <span className="pl-xs type-small text-imagine-foreground-muted">
            <span className="font-medium text-imagine-foreground">
              {String(selected.length)}
            </span>{" "}
            of {String(profiles.length)} selected
          </span>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="xs"
              disabled={allSelected}
              onClick={() => {
                onSelectedIdsChange(profiles.map((profile) => profile.id));
              }}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="xs"
              disabled={selected.length === 0}
              onClick={() => {
                onSelectedIdsChange([]);
              }}
            >
              None
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
