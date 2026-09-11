"use client";

import { useState } from "react";
import { toast } from "sonner";

import { InviteLinkField } from "@/components/features/onboarding/invite-team-form";
import {
  type Member,
  type MemberRole,
  MembersList,
  ROLE_LABEL,
} from "@/components/features/settings/members-list";
import { SettingsSection } from "@/components/features/settings/settings-section";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MembersSettings as MembersSettingsData } from "@/services/settings";

const INVITE_ROLES: readonly Exclude<MemberRole, "owner">[] = [
  "admin",
  "member",
];

/** "jane.doe@acme.com" → "Jane Doe", for the row until they sign in. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]+/)
    .filter((part) => part !== "")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: MemberRole) => void;
}

function InviteDialog({ open, onOpenChange, onInvite }: InviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("member");
  const valid = email.includes("@") && email.includes(".");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setEmail("");
          setRole("member");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form
          className="flex flex-col gap-l"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valid) return;
            onInvite(email.trim(), role);
            onOpenChange(false);
            setEmail("");
            setRole("member");
          }}
        >
          <DialogHeader>
            <DialogTitle>Invite a teammate</DialogTitle>
            <DialogDescription>
              They get an email with a link to join this organization.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                type="email"
                autoFocus
                autoComplete="off"
                placeholder="name@company.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(next) => {
                  const match = INVITE_ROLES.find((option) => option === next);
                  if (match !== undefined) setRole(match);
                }}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {INVITE_ROLES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ROLE_LABEL[option]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Settings, Members. Invite teammates and manage organization access. */
export function MembersSettings({
  members: initialMembers,
  currentUserId,
  inviteUrl,
}: MembersSettingsData) {
  const [members, setMembers] = useState(initialMembers);
  const [inviting, setInviting] = useState(false);

  return (
    <div className="flex w-full max-w-2xl flex-col gap-xxl md:gap-section">
      <SettingsSection
        title="Members"
        description="Invite teammates and manage their access to this organization."
        action={
          <Button
            variant="soft"
            size="sm"
            onClick={() => {
              setInviting(true);
            }}
          >
            <Icon name="plus" size="s" data-icon="inline-start" />
            Invite
          </Button>
        }
      >
        <Field>
          <FieldLabel>Invite link</FieldLabel>
          <InviteLinkField url={inviteUrl} />
        </Field>
        <MembersList
          members={members}
          currentUserId={currentUserId}
          onRoleChange={(id, role) => {
            setMembers((current) =>
              current.map((member) =>
                member.id === id ? { ...member, role } : member,
              ),
            );
          }}
          onRemove={(id) => {
            const removed = members.find((member) => member.id === id);
            setMembers((current) =>
              current.filter((member) => member.id !== id),
            );
            if (removed) toast(`Removed ${removed.name}`);
          }}
        />
        <InviteDialog
          open={inviting}
          onOpenChange={setInviting}
          onInvite={(email, role) => {
            const invited: Member = {
              id: `invite-${email}`,
              name: nameFromEmail(email),
              email,
              role,
              pending: true,
            };
            setMembers((current) => [...current, invited]);
            toast.success(`Invite sent to ${email}`);
          }}
        />
      </SettingsSection>
    </div>
  );
}
