"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

import type { ProfileSummary } from "@/components/features/settings/profile-list";

/**
 * What the user has set up so far. The steps write it; the preview beside them
 * reads it, so the workspace fills in while they type, the way Slack's does.
 */
interface OnboardingState {
  orgName: string;
  orgLogoUrl: string | undefined;
  setOrganization: (values: {
    name: string;
    logoUrl: string | undefined;
  }) => void;
  /** The LinkedIn account has been linked. */
  linkedInConnected: boolean;
  setLinkedInConnected: (connected: boolean) => void;
  /** The identities the agent will post as, chosen after connecting. */
  postAs: readonly ProfileSummary[];
  setPostAs: (profiles: readonly ProfileSummary[]) => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<{
    name: string;
    logoUrl: string | undefined;
  }>({ name: "", logoUrl: undefined });
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const [postAs, setPostAs] = useState<readonly ProfileSummary[]>([]);

  return (
    <OnboardingContext.Provider
      value={{
        orgName: organization.name,
        orgLogoUrl: organization.logoUrl,
        setOrganization,
        linkedInConnected,
        setLinkedInConnected,
        postAs,
        setPostAs,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingState {
  const context = useContext(OnboardingContext);
  if (context === null) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return context;
}
