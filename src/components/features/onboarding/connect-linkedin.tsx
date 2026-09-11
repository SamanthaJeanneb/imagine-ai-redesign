"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { fade, spring } from "@/styles/motion";

interface ConnectLinkedInProps {
  /** Who will be connected, e.g. the signed-in user's name. */
  accountName: string;
  accountNote: string;
  /** What the agent gets access to. */
  permissions: readonly string[];
  onConnect: () => void;
  onSkip?: () => void;
  pending?: boolean;
  /** The account is linked: the mark gets a check and the actions go away. */
  connected?: boolean;
  /** `false` when the page pins Connect and Skip elsewhere. */
  showActions?: boolean;
  className?: string;
}

/**
 * Onboarding step: one soft panel with the LinkedIn mark, what will be
 * connected, and the permissions list, then the single primary action.
 */
export function ConnectLinkedIn({
  accountName,
  accountNote,
  permissions,
  onConnect,
  onSkip,
  pending = false,
  connected = false,
  showActions = true,
  className,
}: ConnectLinkedInProps) {
  return (
    <div
      data-slot="connect-linkedin"
      className={cn(
        "flex w-full max-w-(--container-xl) flex-col gap-xxl",
        className,
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.base}
        className="flex items-center gap-m rounded-panel bg-imagine-surface p-l shadow-raised"
      >
        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
          <Icon name="linkedin-in" size="l" />
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
        <div className="flex min-w-0 flex-col">
          <span className="type-body font-medium">{accountName}</span>
          <span className="type-small text-imagine-foreground-muted">
            {connected ? "Connected just now" : accountNote}
          </span>
        </div>
      </motion.div>

      {permissions.length > 0 ? (
        <Stagger kind="list" className="flex flex-col gap-s pl-xs">
          {permissions.map((permission) => (
            <StaggerItem
              key={permission}
              className="flex items-center gap-m type-small"
            >
              <span
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-full bg-imagine-foreground-faint"
              />
              {permission}
            </StaggerItem>
          ))}
        </Stagger>
      ) : null}

      {showActions && !connected ? (
        <div className="mt-l flex flex-wrap items-center gap-l max-md:flex-col-reverse max-md:items-stretch">
          <Button size="lg" disabled={pending} onClick={onConnect} className="max-md:w-full">
            {pending ? (
              <Spinner size="s" data-icon="inline-start" />
            ) : (
              <Icon name="linkedin-in" data-icon="inline-start" />
            )}
            Connect LinkedIn
          </Button>
          {onSkip ? (
            <Button
              variant="link"
              className="text-imagine-foreground-muted"
              onClick={onSkip}
            >
              Skip and do this later
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
