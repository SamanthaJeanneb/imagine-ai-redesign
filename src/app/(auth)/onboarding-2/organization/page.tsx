"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

import { useOnboarding } from "@/app/(auth)/onboarding/onboarding-provider";
import { StepFrame } from "@/app/(auth)/onboarding-2/step-frame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";

const FORM_ID = "onboarding-2-organization";

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/**
 * Step two: name and logo. The tile beside Upload shows the logo, or the
 * name's first letter as the workspace will, so the preview and the form
 * agree while the user types.
 */
export default function OrganizationStepPage() {
  const router = useRouter();
  const { orgName, orgLogoUrl, setOrganization } = useOnboarding();
  const inputRef = useRef<HTMLInputElement>(null);
  const named = orgName.trim() !== "";

  function setLogo(file: File | null) {
    if (orgLogoUrl !== undefined) URL.revokeObjectURL(orgLogoUrl);
    setOrganization({
      name: orgName,
      logoUrl: file ? URL.createObjectURL(file) : undefined,
    });
  }

  return (
    <StepFrame
      step={2}
      total={4}
      title="What's your organization called?"
      description="This is the workspace your team and the agent will share. You can change the name and logo later in settings."
      actions={
        <>
          <Button type="submit" form={FORM_ID} size="lg" disabled={!named}>
            Continue
          </Button>
          <Button
            variant="link"
            className="text-imagine-foreground-muted"
            onClick={() => {
              router.push("/sign-in");
            }}
          >
            Back
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        className="flex flex-col gap-xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (named) router.push("/onboarding-2/team");
        }}
      >
        <Field>
          <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
          <Input
            id="org-name"
            value={orgName}
            autoComplete="organization"
            placeholder="Acme Inc."
            autoFocus
            className="h-control-lg px-3 md:text-base"
            onChange={(event) => {
              setOrganization({
                name: event.target.value,
                logoUrl: orgLogoUrl,
              });
            }}
          />
        </Field>
        <Field>
          <FieldLabel>Logo</FieldLabel>
          <div className="flex items-center gap-m">
            <Avatar size="lg" shape="square">
              {orgLogoUrl ? (
                <AvatarImage src={orgLogoUrl} alt="Organization logo" />
              ) : null}
              <AvatarFallback className="bg-imagine-foreground text-base text-imagine-surface">
                {named ? (
                  initial(orgName)
                ) : (
                  <Icon name="image" size="s" className="opacity-60" />
                )}
              </AvatarFallback>
            </Avatar>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                setLogo(event.target.files?.[0] ?? null);
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                inputRef.current?.click();
              }}
            >
              {orgLogoUrl ? "Replace" : "Upload"}
            </Button>
            {orgLogoUrl ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLogo(null);
                }}
              >
                Remove
              </Button>
            ) : (
              <span className="type-small text-imagine-foreground-faint">
                PNG or SVG
              </span>
            )}
          </div>
        </Field>
      </form>
    </StepFrame>
  );
}
