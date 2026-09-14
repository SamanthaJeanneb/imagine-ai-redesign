"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";

import type { ProfileSummary } from "@/components/features/settings/profile-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { fade, spring } from "@/styles/motion";

export type AccountSlotStatus = "idle" | "connecting" | "connected";

/**
 * One LinkedIn sign-in. Starts as a row with a Connect button, spends a
 * moment waiting on LinkedIn, then fills in with whoever signed in.
 */
export interface AccountSlot {
  id: string;
  status: AccountSlotStatus;
  /** Known before connecting, e.g. the signed-in member's own account. */
  name?: string;
  note?: string;
  /** Set once LinkedIn answers. */
  profile?: ProfileSummary;
  /** `false` for the first row: the member's own account stays put. */
  removable?: boolean;
}

interface ConnectAccountsProps {
  slots: readonly AccountSlot[];
  onConnect: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  /** What every connected account grants the agent. */
  permissions: readonly string[];
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** The second line, by where the sign-in is. */
function noteFor(slot: AccountSlot): string {
  if (slot.status === "connected") {
    return slot.profile?.headline ?? "Connected just now";
  }
  if (slot.status === "connecting") return "Waiting for LinkedIn…";
  return slot.note ?? "You'll sign in to link it";
}

function SlotRow({
  slot,
  onConnect,
  onRemove,
}: {
  slot: AccountSlot;
  onConnect: () => void;
  onRemove: () => void;
}) {
  const connected = slot.status === "connected";
  const profile = slot.profile;
  const name = profile?.name ?? slot.name ?? "LinkedIn account";
  const note = noteFor(slot);

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={fade.base}
      className="flex items-center gap-m rounded-panel bg-imagine-surface p-l shadow-raised"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {connected ? (
            <motion.span
              key="avatar"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring.snappy}
              className="flex"
            >
              <Avatar
                size="lg"
                shape={profile?.kind === "company" ? "square" : "circle"}
              >
                {profile?.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {profile?.kind === "company" ? (
                    <Icon name="building" size="s" />
                  ) : (
                    initials(name)
                  )}
                </AvatarFallback>
              </Avatar>
            </motion.span>
          ) : (
            <motion.span
              key="mark"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={fade.fast}
              className="flex size-10 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary"
            >
              <Icon name="linkedin-in" size="l" />
            </motion.span>
          )}
        </AnimatePresence>
        {connected ? (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring.snappy}
            className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-imagine-primary text-imagine-primary-foreground ring-2 ring-imagine-surface"
          >
            <Icon name="check" size="s" active className="text-[9px]" />
          </motion.span>
        ) : null}
      </span>

      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-body font-medium">{name}</span>
        <span className="truncate type-small text-imagine-foreground-muted">
          {note}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-xs">
        {connected ? (
          <Badge variant="success">Connected</Badge>
        ) : (
          <Button
            size="sm"
            disabled={slot.status === "connecting"}
            onClick={onConnect}
          >
            {slot.status === "connecting" ? (
              <Spinner size="s" data-icon="inline-start" />
            ) : (
              <Icon name="linkedin-in" data-icon="inline-start" />
            )}
            Connect
          </Button>
        )}
        {slot.removable === true && slot.status === "idle" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove"
            onClick={onRemove}
          >
            <Icon name="xmark" size="s" />
          </Button>
        ) : null}
      </div>
    </motion.li>
  );
}

/**
 * Onboarding step: every LinkedIn the org will post from, as a list of
 * sign-ins. Each row connects on its own, so several can be in flight at
 * once, and "Add another" appends a row for the next one.
 */
export function ConnectAccounts({
  slots,
  onConnect,
  onAdd,
  onRemove,
  permissions,
  className,
}: ConnectAccountsProps) {
  return (
    <div
      data-slot="connect-accounts"
      className={cn(
        "flex w-full max-w-(--container-xl) flex-col gap-xl",
        className,
      )}
    >
      <ul className="flex flex-col gap-s">
        <AnimatePresence initial={false}>
          {slots.map((slot) => (
            <SlotRow
              key={slot.id}
              slot={slot}
              onConnect={() => {
                onConnect(slot.id);
              }}
              onRemove={() => {
                onRemove(slot.id);
              }}
            />
          ))}
        </AnimatePresence>
        <motion.li layout="position" transition={fade.base}>
          <Button
            variant="outline"
            onClick={onAdd}
            className="h-control-lg w-full border-dashed text-imagine-foreground-muted hover:text-imagine-foreground"
          >
            <Icon name="plus" size="s" data-icon="inline-start" />
            Add another account
          </Button>
        </motion.li>
      </ul>

      {permissions.length > 0 ? (
        <ul className="flex flex-col gap-s pl-xs">
          {permissions.map((permission) => (
            <li
              key={permission}
              className="flex items-center gap-m type-small text-imagine-foreground-muted"
            >
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-imagine-foreground-faint"
              />
              {permission}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
