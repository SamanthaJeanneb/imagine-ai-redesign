"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { useOnboarding } from "@/components/features/onboarding/onboarding-provider";
import { StepFrame } from "@/app/(auth)/onboarding/step-frame";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { fade } from "@/styles/motion";

const AGENDA = [
  "Set goals for the accounts you connected",
  "Tune the agent's voice to how each person writes",
  "Plan the first two weeks of posts together",
];

interface MeetingStepProps {
  /** The team's booking page. */
  bookingUrl: string;
}

/**
 * Last step. A strategy session with the team, booked on the demo calendar
 * in a new tab. Once the booking page has been opened the primary action
 * turns into opening the workspace, the same turn the LinkedIn step takes.
 */
export function MeetingStep({ bookingUrl }: MeetingStepProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [opened, setOpened] = useState(false);
  const { accounts } = useOnboarding();

  function finish() {
    start(() => {
      router.push("/agent");
    });
  }

  return (
    <StepFrame
      step={6}
      total={6}
      title="Book a strategy meeting"
      description="Thirty minutes with the team before your first posts go out. We'll look at your accounts, set goals, and tune the agent's voice."
      actions={
        <>
          <Button
            variant="link"
            className="text-imagine-foreground-muted max-md:self-start"
            disabled={pending}
            onClick={() => {
              router.push(
                accounts.length > 0
                  ? "/onboarding/accounts"
                  : "/onboarding/linkedin",
              );
            }}
          >
            Back
          </Button>
          <div className="flex items-center gap-l max-md:w-full max-md:flex-col-reverse max-md:gap-s">
            {opened ? null : (
              <Button
                variant="link"
                className="text-imagine-foreground-muted"
                disabled={pending}
                onClick={finish}
              >
                Skip for now
              </Button>
            )}
            {opened ? (
              <Button
                size="lg"
                disabled={pending}
                onClick={finish}
                className="max-md:w-full"
              >
                {pending ? <Spinner size="s" data-icon="inline-start" /> : null}
                Open workspace
              </Button>
            ) : (
              <Button size="lg" asChild className="max-md:w-full">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    setOpened(true);
                  }}
                >
                  <Icon name="calendar" data-icon="inline-start" />
                  Book a time
                  <Icon
                    name="up-right-from-square"
                    size="s"
                    data-icon="inline-end"
                  />
                </a>
              </Button>
            )}
          </div>
        </>
      }
    >
      <div className="flex w-full max-w-(--container-xl) flex-col gap-xl">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fade.base}
          className="flex flex-col gap-l rounded-panel bg-imagine-surface p-l shadow-raised"
        >
          <div className="flex items-center gap-m">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
              <Icon name="calendar" size="l" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="type-body font-medium">
                Strategy session with the Imagine team
              </span>
              <span className="flex items-center gap-s type-small text-imagine-foreground-muted">
                <span className="flex items-center gap-xs">
                  <Icon name="clock" size="s" />
                  30 min
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-xs">
                  <Icon name="video" size="s" />
                  Video call
                </span>
              </span>
            </div>
          </div>
          <Stagger kind="list" className="flex flex-col gap-s">
            {AGENDA.map((item) => (
              <StaggerItem
                key={item}
                className="flex items-center gap-m type-small"
              >
                <Icon
                  name="check"
                  size="s"
                  className="shrink-0 text-imagine-secondary"
                />
                {item}
              </StaggerItem>
            ))}
          </Stagger>
        </motion.div>
        {opened ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={fade.base}
            className="type-small text-imagine-foreground-muted"
          >
            The booking page opened in a new tab. Pick a time there, then open
            your workspace.{" "}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-imagine-foreground underline-offset-4 hover:underline"
            >
              Open it again
            </a>
          </motion.p>
        ) : (
          <p className="type-small text-imagine-foreground-muted">
            Opens the team&apos;s calendar in a new tab. You can also book later
            from the Help center.
          </p>
        )}
      </div>
    </StepFrame>
  );
}
