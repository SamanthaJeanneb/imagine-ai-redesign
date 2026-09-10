"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { fade } from "@/styles/motion";

export interface JoinMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface JoinOrganizationProps {
  orgName: string;
  orgLogoUrl?: string;
  /** One line under the name, e.g. "12 members · 3 LinkedIn profiles". */
  orgNote: string;
  /** A few members to show. `memberCount` is the full total. */
  members: readonly JoinMember[];
  memberCount: number;
  invitedBy: JoinMember;
  role?: "member" | "admin";
  onJoin: () => void;
  onDecline?: () => void;
  pending?: boolean;
  className?: string;
}

const SHOWN_MEMBERS = 4;

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function firstName(name: string): string {
  return name.split(" ")[0] ?? name;
}

/** "Sarah, Ravi, and 10 others are already here." */
function membersLine(
  members: readonly JoinMember[],
  memberCount: number,
): string {
  const names = members.slice(0, 2).map((member) => firstName(member.name));
  const others = memberCount - names.length;
  if (names.length === 0) return "Be the first one here.";
  if (others <= 0) {
    return `${names.join(" and ")} ${names.length === 1 ? "is" : "are"} already here.`;
  }
  return `${names.join(", ")}, and ${String(others)} ${others === 1 ? "other is" : "others are"} already here.`;
}

/**
 * Invite landing: the organization you were invited to, who is already in
 * it, who invited you, then one primary action. Same panel and rhythm as the
 * other onboarding steps.
 */
export function JoinOrganization({
  orgName,
  orgLogoUrl,
  orgNote,
  members,
  memberCount,
  invitedBy,
  role = "member",
  onJoin,
  onDecline,
  pending = false,
  className,
}: JoinOrganizationProps) {
  const shown = members.slice(0, SHOWN_MEMBERS);
  const overflow = memberCount - shown.length;

  return (
    <div
      data-slot="join-organization"
      className={cn("flex w-full max-w-md flex-col gap-xl", className)}
    >
      <div className="flex flex-col gap-xs">
        <h1 className="type-display">Join {orgName}</h1>
        <p className="type-body text-imagine-foreground-muted">
          {invitedBy.name} invited you to work on {orgName}&apos;s LinkedIn with
          the team.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={fade.base}
        className="flex flex-col gap-l rounded-panel bg-imagine-surface p-l shadow-raised"
      >
        <div className="flex items-center gap-m">
          <Avatar size="lg" shape="square">
            {orgLogoUrl ? <AvatarImage src={orgLogoUrl} alt="" /> : null}
            <AvatarFallback>{initials(orgName)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate type-heading">{orgName}</span>
            <span className="truncate type-small text-imagine-foreground-muted">
              {orgNote}
            </span>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...fade.base, delay: 0.1 }}
          className="flex items-center gap-m"
        >
          <AvatarGroup>
            {shown.map((member) => (
              <Avatar key={member.id} size="sm" title={member.name}>
                {member.avatarUrl ? (
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                ) : null}
                <AvatarFallback>{initials(member.name)}</AvatarFallback>
              </Avatar>
            ))}
            {overflow > 0 ? (
              <AvatarGroupCount className="size-6 bg-imagine-surface-raised type-micro text-imagine-foreground-muted">
                +{overflow}
              </AvatarGroupCount>
            ) : null}
          </AvatarGroup>
          <span className="type-small text-imagine-foreground-muted">
            {membersLine(members, memberCount)}
          </span>
        </motion.div>
      </motion.div>

      <div className="flex items-center gap-m pl-xs">
        <Avatar size="sm">
          {invitedBy.avatarUrl ? (
            <AvatarImage src={invitedBy.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>{initials(invitedBy.name)}</AvatarFallback>
        </Avatar>
        <p className="type-small text-imagine-foreground-muted">
          <span className="font-medium text-imagine-foreground">
            {invitedBy.name}
          </span>{" "}
          invited you as {role === "admin" ? "an admin" : "a member"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-l">
        <Button size="lg" disabled={pending} onClick={onJoin}>
          {pending ? <Spinner size="s" data-icon="inline-start" /> : null}
          Join {orgName}
        </Button>
        {onDecline ? (
          <Button
            variant="link"
            className="text-imagine-foreground-muted"
            onClick={onDecline}
          >
            Not now
          </Button>
        ) : null}
      </div>
    </div>
  );
}
