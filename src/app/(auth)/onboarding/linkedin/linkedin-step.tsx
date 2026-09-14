"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { StepFrame } from "@/app/(auth)/onboarding/step-frame";
import {
  type AccountSlot,
  ConnectAccounts,
} from "@/components/features/onboarding/connect-accounts";
import type { ProfileSummary } from "@/components/features/settings/profile-list";
import { Button } from "@/components/ui/button";
import { wait } from "@/lib/wait";

const PERMISSIONS = [
  "Publish posts you approve, on the schedule you set",
  "Read post analytics to plan what to write next",
];

/** How long the mock waits on LinkedIn before a sign-in resolves. */
const CONNECT_DELAY_MS = 900;

interface LinkedInStepProps {
  /** The signed-in member's own LinkedIn, the first row. */
  ownAccount: ProfileSummary;
  ownAccountNote: string;
  /** What the other sign-ins resolve to, in order. */
  connectable: readonly ProfileSummary[];
}

/**
 * Step four. Every LinkedIn the org will post from, connected in one go:
 * the member's own account is the first row; "Add another" appends a row
 * for each further sign-in, and each row connects on its own so several can
 * be waiting on LinkedIn at once. Each one lands in the shared list as it
 * connects; Continue shows what got connected.
 */
export function LinkedInStep({
  ownAccount,
  ownAccountNote,
  connectable,
}: LinkedInStepProps) {
  const router = useRouter();
  const { accounts, setAccounts } = useOnboarding();
  const [slots, setSlots] = useState<readonly AccountSlot[]>(() =>
    // Coming back to this step, the rows are whatever already connected.
    accounts.length > 0
      ? accounts.map((profile) => ({
          id: profile.id,
          status: "connected",
          profile,
          removable: profile.id !== ownAccount.id,
        }))
      : [
          {
            id: ownAccount.id,
            status: "idle",
            name: ownAccount.name,
            note: ownAccountNote,
            removable: false,
          },
        ],
  );
  // Which mock identity the next sign-in hands back, and a counter for row ids.
  const nextIdentity = useRef(
    accounts.filter((profile) => profile.id !== ownAccount.id).length,
  );
  const nextRow = useRef(0);

  const connected = slots.filter((slot) => slot.status === "connected");
  const connecting = slots.some((slot) => slot.status === "connecting");

  function update(id: string, patch: Partial<AccountSlot>) {
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
    );
  }

  function connect(id: string) {
    if (slots.find((row) => row.id === id)?.status !== "idle") return;

    // Decide up front who signs in, so two rows in flight get two people.
    let profile: ProfileSummary;
    if (id === ownAccount.id) {
      profile = ownAccount;
    } else {
      const index = nextIdentity.current;
      nextIdentity.current += 1;
      profile = connectable[index % Math.max(connectable.length, 1)] ?? {
        id: `linkedin-${String(index)}`,
        name: "LinkedIn member",
        headline: "LinkedIn profile",
        kind: "person",
        status: "connected",
      };
    }

    update(id, { status: "connecting" });
    void wait(CONNECT_DELAY_MS).then(() => {
      update(id, { status: "connected", profile });
      // Straight into the shared list, so the preview beside us fills in.
      setAccounts((current) =>
        current.some((account) => account.id === profile.id)
          ? current
          : [...current, profile],
      );
    });
  }

  function add() {
    nextRow.current += 1;
    setSlots((current) => [
      ...current,
      { id: `row-${String(nextRow.current)}`, status: "idle", removable: true },
    ]);
  }

  function remove(id: string) {
    setSlots((current) => current.filter((slot) => slot.id !== id));
  }

  function next() {
    router.push("/onboarding/accounts");
  }

  function skip() {
    setAccounts([]);
    router.push("/onboarding/meeting");
  }

  return (
    <StepFrame
      step={4}
      total={6}
      title="Connect your LinkedIn accounts"
      description="Connect your own, your company page, and anyone else you'll post for. The agent drafts for each and publishes only what you approve."
      actions={
        <>
          <Button
            variant="link"
            className="text-imagine-foreground-muted max-md:self-start"
            disabled={connecting}
            onClick={() => {
              router.push("/onboarding/team");
            }}
          >
            Back
          </Button>
          <div className="flex items-center gap-l max-md:w-full max-md:flex-col-reverse max-md:gap-s">
            {connected.length === 0 ? (
              <Button
                variant="link"
                className="text-imagine-foreground-muted"
                disabled={connecting}
                onClick={skip}
              >
                Skip for now
              </Button>
            ) : null}
            <Button
              size="lg"
              disabled={connecting || connected.length === 0}
              onClick={next}
              className="max-md:w-full"
            >
              Continue
            </Button>
          </div>
        </>
      }
    >
      <ConnectAccounts
        slots={slots}
        permissions={PERMISSIONS}
        onConnect={connect}
        onAdd={add}
        onRemove={remove}
      />
    </StepFrame>
  );
}
