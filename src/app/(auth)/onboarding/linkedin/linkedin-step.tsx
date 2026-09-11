"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { StepFrame } from "@/app/(auth)/onboarding/step-frame";
import { ProfileSelector } from "@/components/features/agent/profile-selector";
import { ConnectLinkedIn } from "@/components/features/onboarding/connect-linkedin";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { wait } from "@/lib/wait";
import { fade } from "@/styles/motion";

const PERMISSIONS = [
  "Publish posts you approve, on the schedule you set",
  "Read post analytics to plan what to write next",
];

interface LinkedInStepProps {
  accountName: string;
  accountNote: string;
  /** Who the account can post as: the member's own profile and their company pages. */
  identities: readonly ProfileSummary[];
}

/**
 * Last step. Connecting links the member's LinkedIn account; that is a login,
 * not a voice. Once linked, a "Post as" field appears under the same heading,
 * the picker the workspace header uses, for which identities the agent writes
 * for: the member's own profile and any company page they admin. Then the
 * workspace opens with those chosen.
 */
export function LinkedInStep({
  accountName,
  accountNote,
  identities,
}: LinkedInStepProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const { linkedInConnected, setLinkedInConnected, postAs, setPostAs } =
    useOnboarding();
  const selectedIds = postAs.map((profile) => profile.id);

  function connect() {
    start(async () => {
      await wait(900);
      setLinkedInConnected(true);
      // Their own profile to begin with; the company page waits to be chosen.
      setPostAs(identities.filter((profile) => profile.kind === "person"));
    });
  }

  function finish() {
    start(() => {
      router.push("/agent");
    });
  }

  return (
    <StepFrame
      step={4}
      total={4}
      title="Connect your LinkedIn"
      description="The agent drafts as you and publishes only what you approve. Connect now to post from day one, or skip and do it later."
      actions={
        <>
          <Button
            variant="link"
            className="text-imagine-foreground-muted max-md:self-start"
            disabled={pending}
            onClick={() => {
              router.push("/onboarding/team");
            }}
          >
            Back
          </Button>
          <div className="flex items-center gap-l max-md:w-full max-md:flex-col-reverse max-md:gap-s">
            {linkedInConnected ? null : (
              <Button
                variant="link"
                className="text-imagine-foreground-muted"
                disabled={pending}
                onClick={finish}
              >
                Skip for now
              </Button>
            )}
            {linkedInConnected ? (
              <Button
                size="lg"
                disabled={pending || postAs.length === 0}
                onClick={finish}
                className="max-md:w-full"
              >
                {pending ? <Spinner size="s" data-icon="inline-start" /> : null}
                Open workspace
              </Button>
            ) : (
              <Button
                size="lg"
                disabled={pending}
                onClick={connect}
                className="max-md:w-full"
              >
                {pending ? (
                  <Spinner size="s" data-icon="inline-start" />
                ) : (
                  <Icon name="linkedin-in" data-icon="inline-start" />
                )}
                Connect LinkedIn
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-xxl">
        <ConnectLinkedIn
          accountName={accountName}
          accountNote={accountNote}
          permissions={linkedInConnected ? [] : PERMISSIONS}
          pending={pending}
          connected={linkedInConnected}
          showActions={false}
          onConnect={connect}
          onSkip={finish}
        />
        <AnimatePresence initial={false}>
          {linkedInConnected ? (
            <motion.div
              key="post-as"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={fade.base}
            >
              <Field>
                <FieldLabel>Post as</FieldLabel>
                <ProfileSelector
                  profiles={identities}
                  selectedIds={selectedIds}
                  onSelectedIdsChange={(ids) => {
                    const chosen = new Set(ids);
                    setPostAs(
                      identities.filter((profile) => chosen.has(profile.id)),
                    );
                  }}
                  // The header's control, dressed as a field: a bordered
                  // trigger the width of the column, chevron at the far end.
                  className="h-control-base w-full justify-start rounded-lg border border-imagine-border bg-imagine-surface px-m shadow-control hover:bg-imagine-surface-raised [&>[data-icon=inline-end]]:ml-auto"
                />
                <FieldDescription>
                  Your account can post as your own profile and as any company
                  page you admin. Add more later in Settings.
                </FieldDescription>
              </Field>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </StepFrame>
  );
}
