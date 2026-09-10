"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

/**
 * What the user has typed so far. The steps write it; the preview beside them
 * reads it, so the workspace fills in while they type, the way Slack's does.
 */
interface OnboardingState {
  orgName: string;
  orgLogoUrl: string | undefined;
  setOrganization: (values: { name: string; logoUrl: string | undefined }) => void;
}

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<{
    name: string;
    logoUrl: string | undefined;
  }>({ name: "", logoUrl: undefined });

  return (
    <OnboardingContext.Provider
      value={{
        orgName: organization.name,
        orgLogoUrl: organization.logoUrl,
        setOrganization,
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
