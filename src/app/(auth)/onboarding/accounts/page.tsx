"use client";

import { useRouter } from "next/navigation";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { StepFrame } from "@/app/(auth)/onboarding/step-frame";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * Step five. What the last step connected, as a plain list: each account
 * with its picture, name, and headline. Nothing to choose here; the agent
 * writes for all of them, and Settings is where the list changes later.
 */
export default function AccountsStepPage() {
  const router = useRouter();
  const { accounts } = useOnboarding();
  const count = accounts.length;

  return (
    <StepFrame
      step={5}
      total={6}
      title={
        count === 0
          ? "No accounts connected yet"
          : count === 1
            ? "One account connected"
            : `${String(count)} accounts connected`
      }
      description={
        count === 0
          ? "Connect at least one LinkedIn so the agent has somewhere to post, or carry on and do it later in Settings."
          : "The agent drafts for each of these in their own voice and publishes only what you approve. Add or remove accounts any time in Settings."
      }
      actions={
        <>
          <Button
            variant="link"
            className="text-imagine-foreground-muted max-md:self-start"
            onClick={() => {
              router.push("/onboarding/linkedin");
            }}
          >
            Back
          </Button>
          <Button
            size="lg"
            className="max-md:w-full"
            onClick={() => {
              router.push("/onboarding/meeting");
            }}
          >
            Continue
          </Button>
        </>
      }
    >
      {count === 0 ? (
        <div className="flex w-full max-w-(--container-xl) flex-col items-start gap-l rounded-panel bg-imagine-surface p-l shadow-raised">
          <span className="flex size-10 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
            <Icon name="linkedin-in" size="l" />
          </span>
          <Button
            variant="soft"
            onClick={() => {
              router.push("/onboarding/linkedin");
            }}
          >
            <Icon name="plus" size="s" data-icon="inline-start" />
            Connect accounts
          </Button>
        </div>
      ) : (
        <Stagger
          kind="list"
          className="flex w-full max-w-(--container-xl) flex-col gap-s"
        >
          {accounts.map((profile) => (
            <StaggerItem
              key={profile.id}
              className="flex items-center gap-m rounded-panel bg-imagine-surface p-l shadow-raised"
            >
              <Avatar
                size="lg"
                shape={profile.kind === "company" ? "square" : "circle"}
              >
                {profile.avatarUrl ? (
                  <AvatarImage src={profile.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {profile.kind === "company" ? (
                    <Icon name="building" size="s" />
                  ) : (
                    initials(profile.name)
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate type-body font-medium">
                  {profile.name}
                </span>
                <span className="truncate type-small text-imagine-foreground-muted">
                  {profile.headline}
                </span>
              </div>
              <Badge variant="success" className="shrink-0">
                <Icon name="check" size="s" data-icon="inline-start" />
                Connected
              </Badge>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </StepFrame>
  );
}
