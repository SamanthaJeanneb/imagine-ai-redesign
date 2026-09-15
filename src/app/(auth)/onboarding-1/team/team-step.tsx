"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  InviteTeamForm,
  InviteTeamFormActions,
} from "@/components/features/onboarding/invite-team-form";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/entities/onboarding";

interface TeamStepProps {
  inviteUrl: string;
  owner: TeamMember;
}

/** Invites the user sends land in the team list as invited rows. */
export function TeamStep({ inviteUrl, owner }: TeamStepProps) {
  const router = useRouter();
  const [members, setMembers] = useState<readonly TeamMember[]>([owner]);

  function next() {
    router.push("/onboarding-1/linkedin");
  }

  return (
    <InviteTeamForm
      inviteUrl={inviteUrl}
      members={members}
      onInvite={(invites) => {
        setMembers((current) => [
          ...current,
          ...invites.map((invite) => ({
            id: invite.email,
            email: invite.email,
            role: invite.role,
            status: "invited" as const,
          })),
        ]);
      }}
      onRoleChange={(id, role) => {
        setMembers((current) =>
          current.map((member) =>
            member.id === id ? { ...member, role } : member,
          ),
        );
      }}
      onResend={(id) => {
        toast(`Invite resent to ${id}`);
      }}
      onContinue={next}
    >
      <InviteTeamFormActions>
        <Button
          type="button"
          variant="link"
          className="text-imagine-foreground-muted"
          onClick={next}
        >
          Skip, invite people later
        </Button>
      </InviteTeamFormActions>
    </InviteTeamForm>
  );
}
