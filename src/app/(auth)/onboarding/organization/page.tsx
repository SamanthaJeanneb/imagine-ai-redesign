"use client";

import { useRouter } from "next/navigation";

import { OrganizationForm } from "@/components/features/onboarding/organization-form";
import { StepHeading } from "@/components/features/onboarding/step-heading";

export default function OrganizationStepPage() {
  const router = useRouter();

  return (
    <>
      <StepHeading title="Set up your organization" step={1} total={3} />
      <OrganizationForm
        onContinue={() => {
          router.push("/onboarding/team");
        }}
      />
    </>
  );
}
