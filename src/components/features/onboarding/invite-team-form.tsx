"use client";

import { cn } from "cn";
import { useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { STEP_LABEL } from "@/components/features/onboarding/organization-form";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type MemberRole = "admin" | "member";

export interface TeamMember {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: MemberRole;
  status: "you" | "invited" | "active";
}

const ROLE_LABEL: Record<MemberRole, string> = {
  admin: "Admin",
  member: "Member",
};

function initials(value: string): string {
  return value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

interface RoleSelectProps {
  value: MemberRole;
  onChange: (role: MemberRole) => void;
  disabled?: boolean;
  label: string;
  /** `default` beside an input, `sm` in a compact row. */
  size?: "sm" | "default";
}

function RoleSelect({
  value,
  onChange,
  disabled,
  label,
  size = "default",
}: RoleSelectProps) {
  return (
    <Select
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (next === "admin" || next === "member") onChange(next);
      }}
    >
      <SelectTrigger size={size} aria-label={label} className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Admin</SelectItem>
        <SelectItem value="member">Member</SelectItem>
      </SelectContent>
    </Select>
  );
}

interface InviteLinkFieldProps {
  url: string;
  className?: string;
}

/** Read-only share link with a copy action that confirms inline. */
export function InviteLinkField({ url, className }: InviteLinkFieldProps) {
  const [copied, setCopied] = useState(false);

  return (
    // The group is sized for an input; the primitive's own 32px is for the
    // search field. The button sits inset by the same 4px all round.
    <InputGroup
      className={cn("h-control-base bg-imagine-surface-raised", className)}
    >
      <InputGroupInput readOnly value={url} aria-label="Invite link" />
      <InputGroupAddon align="inline-end" className="pr-1 has-[>button]:mr-0">
        <InputGroupButton
          size="xs"
          variant="soft"
          className="bg-imagine-surface"
          onClick={() => {
            void navigator.clipboard.writeText(url).then(
              () => {
                setCopied(true);
                window.setTimeout(() => {
                  setCopied(false);
                }, 1500);
              },
              () => {
                // Clipboard can be denied; the field stays selectable.
              },
            );
          }}
        >
          <Icon
            name={copied ? "check" : "copy"}
            size="s"
            data-icon="inline-start"
          />
          {copied ? "Copied" : "Copy"}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

interface TeamMemberRowProps {
  member: TeamMember;
  onRoleChange?: (id: string, role: MemberRole) => void;
  onResend?: (id: string) => void;
}

export function TeamMemberRow({
  member,
  onRoleChange,
  onResend,
}: TeamMemberRowProps) {
  const label = member.name ?? member.email;
  return (
    <div className="flex min-w-0 items-center gap-m py-xs max-sm:flex-wrap">
      <Avatar size="sm">
        {member.avatarUrl ? (
          <AvatarImage src={member.avatarUrl} alt={label} />
        ) : null}
        <AvatarFallback>{initials(label)}</AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate type-small font-medium">{label}</span>
        <span className="type-small text-imagine-foreground-muted">
          {member.status === "you"
            ? "You"
            : member.status === "invited"
              ? "Invited"
              : member.email}
        </span>
      </span>
      {member.status === "you" ? (
        <span className="type-small text-imagine-foreground-muted">
          {ROLE_LABEL[member.role]}
        </span>
      ) : (
        <>
          <RoleSelect
            size="sm"
            value={member.role}
            label={`Role for ${label}`}
            onChange={(role) => onRoleChange?.(member.id, role)}
          />
          {member.status === "invited" && onResend ? (
            <Button
              size="xs"
              variant="ghost"
              className="text-imagine-foreground-muted"
              onClick={() => {
                onResend(member.id);
              }}
            >
              Resend
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}

interface InviteTeamFormProps {
  inviteUrl: string;
  members: readonly TeamMember[];
  /** Send the drafted invites; they join `members` as invited rows. */
  onInvite: (invites: readonly { email: string; role: MemberRole }[]) => void;
  onContinue: () => void;
  onRoleChange?: (id: string, role: MemberRole) => void;
  onResend?: (id: string) => void;
  onSkip?: () => void;
  /** `false` when the page pins Continue and Skip elsewhere. */
  showActions?: boolean;
  className?: string;
}

/**
 * Onboarding step: invite by email, share a link, see the team. Invites go
 * one at a time; each sent one lands in the team list below as "Invited", so
 * the row clears for the next person instead of growing into a list.
 */
export function InviteTeamForm({
  inviteUrl,
  members,
  onInvite,
  onContinue,
  onRoleChange,
  onResend,
  onSkip,
  showActions = true,
  className,
}: InviteTeamFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const ready = email.trim() !== "";

  const sendInvite = () => {
    if (!ready) return;
    onInvite([{ email: email.trim(), role }]);
    setEmail("");
    setRole("member");
  };

  return (
    <form
      data-slot="invite-team-form"
      className={cn(
        "flex w-full max-w-(--container-xl) flex-col gap-xxl",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <Field>
        <FieldLabel htmlFor="invite-email" className={STEP_LABEL}>
          Invite by email
        </FieldLabel>
        <div className="flex flex-col gap-s sm:flex-row sm:items-center">
          <Input
            id="invite-email"
            type="email"
            placeholder="name@company.com"
            className="w-full min-w-0 flex-1"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            onKeyDown={(event) => {
              // Enter here sends the invite; submitting the form is Continue.
              if (event.key === "Enter" && ready) {
                event.preventDefault();
                sendInvite();
              }
            }}
          />
          <div className="flex min-w-0 shrink-0 items-center gap-s sm:contents">
            <RoleSelect
              value={role}
              label="Role for invite"
              onChange={setRole}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!ready}
              onClick={sendInvite}
              className="max-sm:flex-1"
            >
              Send invite
            </Button>
          </div>
        </div>
      </Field>

      <Field>
        <FieldLabel className={STEP_LABEL}>Or share a link</FieldLabel>
        <InviteLinkField url={inviteUrl} />
      </Field>

      <Field>
        <FieldLabel className={STEP_LABEL}>Team</FieldLabel>
        <Stagger kind="list" className="flex flex-col">
          {members.map((member) => (
            <StaggerItem key={member.id}>
              <TeamMemberRow
                member={member}
                onRoleChange={onRoleChange}
                onResend={onResend}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </Field>

      {showActions ? (
        <div className="mt-l flex flex-wrap items-center gap-l max-md:flex-col-reverse max-md:items-stretch">
          <Button type="submit" size="lg" className="max-md:w-full">
            Continue
          </Button>
          {onSkip ? (
            <Button
              type="button"
              variant="link"
              className="text-imagine-foreground-muted"
              onClick={onSkip}
            >
              Skip, invite people later
            </Button>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
