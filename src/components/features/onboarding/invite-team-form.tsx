"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
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
import { spring } from "@/styles/motion";

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
            void navigator.clipboard.writeText(url).then(() => {
              setCopied(true);
              window.setTimeout(() => {
                setCopied(false);
              }, 1500);
            });
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
    <div className="flex items-center gap-m py-xs">
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
  className?: string;
}

interface InviteDraft {
  key: number;
  email: string;
  role: MemberRole;
}

/** Onboarding step: invite by email (growing list), share a link, see the team. */
export function InviteTeamForm({
  inviteUrl,
  members,
  onInvite,
  onContinue,
  onRoleChange,
  onResend,
  onSkip,
  className,
}: InviteTeamFormProps) {
  const [drafts, setDrafts] = useState<InviteDraft[]>([
    { key: 0, email: "", role: "member" },
  ]);
  const filled = drafts.filter((draft) => draft.email.trim() !== "");

  return (
    <form
      data-slot="invite-team-form"
      className={cn("flex w-full max-w-lg flex-col gap-xl", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
    >
      <Field>
        <div className="flex flex-col gap-xs">
          <FieldLabel>Invite by email</FieldLabel>
          <FieldDescription>
            Admins can invite and manage members.
          </FieldDescription>
        </div>
        <div className="flex flex-col gap-s">
          <AnimatePresence initial={false}>
            {drafts.map((draft, index) => (
              <motion.div
                key={draft.key}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring.soft}
                className="flex items-center gap-s overflow-hidden"
              >
                <Input
                  type="email"
                  placeholder="name@company.com"
                  aria-label={`Invite email ${String(index + 1)}`}
                  value={draft.email}
                  onChange={(event) => {
                    const value = event.target.value;
                    setDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key
                          ? { ...item, email: value }
                          : item,
                      ),
                    );
                  }}
                />
                <RoleSelect
                  value={draft.role}
                  label={`Role for invite ${String(index + 1)}`}
                  onChange={(role) => {
                    setDrafts((current) =>
                      current.map((item) =>
                        item.key === draft.key ? { ...item, role } : item,
                      ),
                    );
                  }}
                />
                {drafts.length > 1 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remove"
                    onClick={() => {
                      setDrafts((current) =>
                        current.filter((item) => item.key !== draft.key),
                      );
                    }}
                  >
                    <Icon name="xmark" size="s" />
                  </Button>
                ) : null}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {/* Field stretches its children, so the two actions share a row. */}
        <div className="flex items-center gap-m">
          <Button
            type="button"
            variant="link"
            size="sm"
            // Flush with the inputs above; the icon variant would indent it.
            className="px-0 has-data-[icon=inline-start]:pl-0"
            onClick={() => {
              setDrafts((current) => [
                ...current,
                { key: Date.now(), email: "", role: "member" },
              ]);
            }}
          >
            <Icon name="plus" size="s" data-icon="inline-start" />
            Add another
          </Button>
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={filled.length === 0}
            onClick={() => {
              onInvite(
                filled.map(({ email, role }) => ({
                  email: email.trim(),
                  role,
                })),
              );
              setDrafts([{ key: Date.now(), email: "", role: "member" }]);
            }}
          >
            {filled.length > 1
              ? `Send ${String(filled.length)} invites`
              : "Send invite"}
          </Button>
        </div>
      </Field>

      <Field>
        <FieldLabel>Or share a link</FieldLabel>
        <InviteLinkField url={inviteUrl} />
      </Field>

      <Field>
        <FieldLabel>Team</FieldLabel>
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

      <div className="flex items-center gap-l">
        <Button type="submit" size="lg">
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
    </form>
  );
}
