"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { LogoUpload } from "@/components/features/onboarding/organization-form";
import {
  type Member,
  type MemberRole,
  MembersList,
  ROLE_LABEL,
} from "@/components/features/settings/members-list";
import { SettingsSection } from "@/components/features/settings/settings-section";
import { ThemeChoice } from "@/components/features/settings/theme-choice";
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
import { Spinner } from "@/components/ui/spinner";
import { wait } from "@/lib/wait";
import type { GeneralSettings } from "@/services/settings";
import { fade } from "@/styles/motion";

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

/**
 * Settings, General. The organization's name and mark, who is in it, and the
 * theme. Edits to the organization wait for Save; everything else applies as
 * it changes.
 */
export function GeneralSettings({
  orgName,
  logoUrl,
  members: initialMembers,
  currentUserId,
}: GeneralSettings) {
  const [saved, setSaved] = useState({ name: orgName, logoUrl });
  const [name, setName] = useState(orgName);
  const [logo, setLogo] = useState(logoUrl);
  const [members, setMembers] = useState(initialMembers);
  const [inviting, setInviting] = useState(false);
  const [pending, start] = useTransition();
  const dirty = name.trim() !== saved.name || logo !== saved.logoUrl;

  function discard() {
    setName(saved.name);
    setLogo(saved.logoUrl);
  }

  function save() {
    const next = { name: name.trim(), logoUrl: logo };
    if (next.name === "") return;
    start(async () => {
      await wait();
      setSaved(next);
      setName(next.name);
      toast.success("Organization saved");
    });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-section">
      <SettingsSection title="Organization">
        <form
          className="flex flex-col gap-l"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Name</FieldLabel>
              <Input
                id="org-name"
                value={name}
                autoComplete="organization"
                className="max-w-sm"
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </Field>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <LogoUpload
                {...(logo === undefined ? {} : { value: logo })}
                onChange={(file) => {
                  setLogo((current) => {
                    if (current?.startsWith("blob:")) {
                      URL.revokeObjectURL(current);
                    }
                    return file ? URL.createObjectURL(file) : undefined;
                  });
                }}
              />
            </Field>
          </FieldGroup>
          <AnimatePresence initial={false}>
            {dirty ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={fade.fast}
                className="flex items-center gap-s"
              >
                <Button
                  type="submit"
                  disabled={pending || name.trim() === ""}
                  aria-busy={pending}
                >
                  {pending ? (
                    <Spinner size="s" data-icon="inline-start" />
                  ) : null}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={discard}
                >
                  Discard
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </SettingsSection>

      <SettingsSection
        title="Members"
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

      <SettingsSection title="Theme">
        <ThemeChoice />
      </SettingsSection>
    </div>
  );
}
