"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { StepFrame } from "@/app/(auth)/onboarding-2/step-frame";
import {
  InviteTeamForm,
  type TeamMember,
} from "@/components/features/onboarding/invite-team-form";
import { Button } from "@/components/ui/button";

interface TeamStepProps {
  inviteUrl: string;
  owner: TeamMember;
}

/** Step three. Invites land in the team list; Continue and Skip both move on. */
export function TeamStep({ inviteUrl, owner }: TeamStepProps) {
  const router = useRouter();
  const [members, setMembers] = useState<readonly TeamMember[]>([owner]);

  function next() {
    router.push("/onboarding-2/linkedin");
  }

  return (
    <StepFrame
      step={3}
      total={4}
      title="Who's on your team?"
      description="Add the people who write, review, or approve posts. You can always invite more from settings."
      actions={
        <>
          <Button size="lg" onClick={next}>
            Continue
          </Button>
          <Button
            variant="link"
            className="text-imagine-foreground-muted"
            onClick={next}
          >
            Skip, invite people later
          </Button>
          <Button
            variant="link"
            className="ml-auto text-imagine-foreground-muted"
            onClick={() => {
              router.push("/onboarding-2/organization");
            }}
          >
            Back
          </Button>
        </>
      }
    >
      <InviteTeamForm
        inviteUrl={inviteUrl}
        members={members}
        showActions={false}
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
      />
    </StepFrame>
  );
}
