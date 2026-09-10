"use client";

import { useRouter } from "next/navigation";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { OrganizationForm } from "@/components/features/onboarding/organization-form";
import { StepHeading } from "@/components/features/onboarding/step-heading";

export default function OrganizationStepPage() {
  const router = useRouter();
  const { orgName, orgLogoUrl, setOrganization } = useOnboarding();

  return (
    <>
      <StepHeading
        title="What's your organization called?"
        description="This is the workspace your team and the agent will share. Its name and logo appear in the sidebar and on every profile you manage."
        step={1}
        total={3}
      />
      <OrganizationForm
        defaultName={orgName}
        {...(orgLogoUrl === undefined ? {} : { defaultLogoUrl: orgLogoUrl })}
        onChange={setOrganization}
        onContinue={() => {
          router.push("/onboarding/team");
        }}
      />
    </>
  );
}
