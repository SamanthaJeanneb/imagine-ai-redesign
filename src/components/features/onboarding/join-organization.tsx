"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { fade } from "@/styles/motion";

export interface JoinMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

const SHOWN_MEMBERS = 4;

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
 * Invite landing frame. Same panel and rhythm as the other onboarding steps;
 * compose it from `JoinOrganizationHero`, `JoinOrganizationPanel` (with
 * `JoinOrganizationMembers` inside), `JoinOrganizationInvitee`, and
 * `JoinOrganizationActions`.
 */
export function JoinOrganization({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-slot="join-organization"
      className={cn("flex w-full max-w-md flex-col gap-xl", className)}
    >
      {children}
    </div>
  );
}

interface JoinOrganizationHeroProps {
  orgName: string;
  /** Who sent the invite, by name. */
  invitedBy: string;
}

export function JoinOrganizationHero({
  orgName,
  invitedBy,
}: JoinOrganizationHeroProps) {
  return (
    <div className="flex flex-col gap-xs">
      <h1 className="type-display">Join {orgName}</h1>
      <p className="type-body text-imagine-foreground-muted">
        {invitedBy} invited you to work on {orgName}&apos;s LinkedIn with the
        team.
      </p>
    </div>
  );
}

interface JoinOrganizationPanelProps {
  orgName: string;
  orgLogoUrl?: string;
  /** One line under the name, e.g. "12 members · 3 LinkedIn profiles". */
  orgNote: string;
  /** Rows under the organization, e.g. `JoinOrganizationMembers`. */
  children?: React.ReactNode;
}

/** The raised card: the organization you were invited to. */
export function JoinOrganizationPanel({
  orgName,
  orgLogoUrl,
  orgNote,
  children,
}: JoinOrganizationPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={fade.base}
      className="flex flex-col gap-l rounded-panel bg-imagine-surface p-l shadow-raised"
    >
      <div className="flex items-center gap-m">
        <PersonAvatar
          name={orgName}
          avatarUrl={orgLogoUrl}
          shape="square"
          size="lg"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate type-heading">{orgName}</span>
          <span className="truncate type-small text-imagine-foreground-muted">
            {orgNote}
          </span>
        </div>
      </div>
      {children}
    </motion.div>
  );
}

interface JoinOrganizationMembersProps {
  /** A few members to show. `memberCount` is the full total. */
  members: readonly JoinMember[];
  memberCount: number;
}

/** Who is already in: a stack of avatars and the sentence beside it. */
export function JoinOrganizationMembers({
  members,
  memberCount,
}: JoinOrganizationMembersProps) {
  const shown = members.slice(0, SHOWN_MEMBERS);
  const overflow = memberCount - shown.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...fade.base, delay: 0.1 }}
      className="flex items-center gap-m"
    >
      <AvatarGroup>
        {shown.map((member) => (
          <PersonAvatar
            key={member.id}
            size="sm"
            name={member.name}
            title={member.name}
            {...(member.avatarUrl === undefined
              ? {}
              : { avatarUrl: member.avatarUrl })}
          />
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
  );
}

interface JoinOrganizationInviteeProps {
  invitedBy: JoinMember;
  role: "member" | "admin";
}

/** Who invited you, and as what. */
export function JoinOrganizationInvitee({
  invitedBy,
  role,
}: JoinOrganizationInviteeProps) {
  return (
    <div className="flex items-center gap-m pl-xs">
      <PersonAvatar
        name={invitedBy.name}
        avatarUrl={invitedBy.avatarUrl}
        size="sm"
      />
      <p className="type-small text-imagine-foreground-muted">
        <span className="font-medium text-imagine-foreground">
          {invitedBy.name}
        </span>{" "}
        invited you as {role === "admin" ? "an admin" : "a member"}
      </p>
    </div>
  );
}

/** The action row: the primary Join button and whatever sits beside it. */
export function JoinOrganizationActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-wrap items-center gap-l">{children}</div>;
}
