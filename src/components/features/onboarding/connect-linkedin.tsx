"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { fade } from "@/styles/motion";

const FRAME = "flex w-full max-w-(--container-xl) flex-col gap-xxl";

/** The soft panel: the LinkedIn mark (with anything laid over it) and who. */
function AccountPanel({
  accountName,
  note,
  children,
}: {
  accountName: string;
  note: string;
  children?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
      className="flex items-center gap-m rounded-panel bg-imagine-surface p-l shadow-raised"
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
        <Icon name="linkedin-in" size="l" />
        {children}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="type-body font-medium">{accountName}</span>
        <span className="type-small text-imagine-foreground-muted">{note}</span>
      </div>
    </motion.div>
  );
}

/** What the agent gets access to, one bullet per line. Shared with the accounts step. */
export function PermissionsList({
  permissions,
}: {
  permissions: readonly string[];
}) {
  if (permissions.length === 0) return null;
  return (
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
  );
}

interface ConnectLinkedInProps {
  /** Who will be connected, e.g. the signed-in user's name. */
  accountName: string;
  accountNote: string;
  /** What the agent gets access to. */
  permissions: readonly string[];
  /** The actions, after the permissions. Omit when the page pins its own. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Onboarding step: one soft panel with the LinkedIn mark, what will be
 * connected, and the permissions list. Render `ConnectLinkedInActions` as
 * its child for the primary action.
 */
export function ConnectLinkedIn({
  accountName,
  accountNote,
  permissions,
  children,
  className,
}: ConnectLinkedInProps) {
  return (
    <div data-slot="connect-linkedin" className={cn(FRAME, className)}>
      <AccountPanel accountName={accountName} note={accountNote} />
      <PermissionsList permissions={permissions} />
      {children}
    </div>
  );
}

interface ConnectLinkedInActionsProps {
  onConnect: () => void;
  pending?: boolean;
  /** Anything beside Connect, e.g. a Skip link. */
  children?: React.ReactNode;
}

export function ConnectLinkedInActions({
  onConnect,
  pending = false,
  children,
}: ConnectLinkedInActionsProps) {
  return (
    <div className="mt-l flex flex-wrap items-center gap-l max-md:flex-col-reverse max-md:items-stretch">
      <Button
        size="lg"
        disabled={pending}
        onClick={onConnect}
        className="max-md:w-full"
      >
        {pending ? (
          <Spinner size="s" data-icon="inline-start" />
        ) : (
          <Icon name="linkedin-in" data-icon="inline-start" />
        )}
        Connect LinkedIn
      </Button>
      {children}
    </div>
  );
}
