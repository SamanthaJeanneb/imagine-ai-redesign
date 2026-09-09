"use client";

import { cn } from "cn";
import { AnimatePresence } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fade } from "@/styles/motion";

/** `organization_members.role`, narrowed. */
export type MemberRole = "owner" | "admin" | "member";

export interface Member {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: MemberRole;
  /** Invited but not yet signed in. */
  pending?: boolean;
}

interface MembersListProps {
  members: readonly Member[];
  /** Whoever is signed in reads "You" and cannot remove themselves. */
  currentUserId: string;
  onRoleChange?: (id: string, role: MemberRole) => void;
  onRemove?: (id: string) => void;
  className?: string;
}

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

/** The roles a member can be moved between. Ownership does not transfer here. */
const ASSIGNABLE_ROLES: readonly Exclude<MemberRole, "owner">[] = [
  "admin",
  "member",
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Settings, General: who can work in the organization. One row per member
 * with their role as a select; the owner's role is fixed, and removal asks
 * first. Rows leave by collapsing so the list closes up behind them.
 */
export function MembersList({
  members,
  currentUserId,
  onRoleChange,
  onRemove,
  className,
}: MembersListProps) {
  return (
    <Stagger
      kind="list"
      data-slot="members-list"
      className={cn("flex flex-col", className)}
    >
      <AnimatePresence initial={false}>
        {members.map((member) => {
          const isSelf = member.id === currentUserId;
          const fixedRole = member.role === "owner";
          return (
            <StaggerItem
              key={member.id}
              layout
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={fade.base}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-m rounded-control px-m py-s transition-colors hover:bg-imagine-surface-raised/50">
                <Avatar>
                  {member.avatarUrl ? (
                    <AvatarImage src={member.avatarUrl} alt="" />
                  ) : null}
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-s">
                    <span className="truncate type-body font-medium">
                      {member.name}
                    </span>
                    {isSelf ? (
                      <span className="type-small text-imagine-foreground-muted">
                        You
                      </span>
                    ) : null}
                    {member.pending ? (
                      <Badge variant="soft">Invited</Badge>
                    ) : null}
                  </span>
                  <span className="truncate type-small text-imagine-foreground-muted">
                    {member.email}
                  </span>
                </span>
                {fixedRole ? (
                  <span className="px-2.5 type-small text-imagine-foreground-muted">
                    {ROLE_LABEL.owner}
                  </span>
                ) : (
                  <Select
                    value={member.role}
                    onValueChange={(next) => {
                      const role = ASSIGNABLE_ROLES.find(
                        (candidate) => candidate === next,
                      );
                      if (role !== undefined) onRoleChange?.(member.id, role);
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={`Role for ${member.name}`}
                      className="w-28 border-transparent bg-transparent shadow-none hover:bg-imagine-surface-raised"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                      <SelectGroup>
                        {ASSIGNABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABEL[role]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
                <div className="flex size-control-sm shrink-0 items-center justify-center">
                  {fixedRole || isSelf || onRemove === undefined ? null : (
                    <AlertDialog>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Remove ${member.name}`}
                              className="text-imagine-foreground-muted hover:text-destructive"
                            >
                              <Icon name="xmark" size="s" />
                            </Button>
                          </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Remove</TooltipContent>
                      </Tooltip>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove {member.name}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            They lose access to this organization right away.
                            Posts they drafted stay where they are.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                              onRemove(member.id);
                            }}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </StaggerItem>
          );
        })}
      </AnimatePresence>
    </Stagger>
  );
}
