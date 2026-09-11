"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { LogoUpload } from "@/components/features/onboarding/organization-form";
import { SettingsSection } from "@/components/features/settings/settings-section";
import { ThemeChoice } from "@/components/features/settings/theme-choice";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { wait } from "@/lib/wait";
import type { GeneralSettings } from "@/services/settings";
import { fade } from "@/styles/motion";

/**
 * Settings, General. The organization's name, mark, and theme. Organization
 * edits wait for Save; the theme applies as it changes.
 */
export function GeneralSettings({ orgName, logoUrl }: GeneralSettings) {
  const [saved, setSaved] = useState({ name: orgName, logoUrl });
  const [name, setName] = useState(orgName);
  const [logo, setLogo] = useState(logoUrl);
  const [pending, start] = useTransition();
  const dirty = name.trim() !== saved.name || logo !== saved.logoUrl;

  function discard() {
    setName(saved.name);
    setLogo(saved.logoUrl);
  }

  function save() {
    const next = { name: name.trim(), logoUrl: logo };
    if (next.name === "") return;
    start(async () => {
      await wait();
      setSaved(next);
      setName(next.name);
      toast.success("Organization saved");
    });
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-xxl md:gap-section">
      <SettingsSection title="Organization">
        <form
          className="flex flex-col gap-l"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-name">Name</FieldLabel>
              <Input
                id="org-name"
                value={name}
                autoComplete="organization"
                className="max-w-sm"
                onChange={(event) => {
                  setName(event.target.value);
                }}
              />
            </Field>
            <Field>
              <FieldLabel>Logo</FieldLabel>
              <LogoUpload
                className="max-w-sm"
                {...(logo === undefined ? {} : { value: logo })}
                onChange={(file) => {
                  setLogo((current) => {
                    if (current?.startsWith("blob:")) {
                      URL.revokeObjectURL(current);
                    }
                    return file ? URL.createObjectURL(file) : undefined;
                  });
                }}
              />
            </Field>
          </FieldGroup>
          <AnimatePresence initial={false}>
            {dirty ? (
              <motion.div
                key="actions"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={fade.fast}
                className="flex items-center gap-s"
              >
                <Button
                  type="submit"
                  disabled={pending || name.trim() === ""}
                  aria-busy={pending}
                >
                  {pending ? (
                    <Spinner size="s" data-icon="inline-start" />
                  ) : null}
                  Save changes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={discard}
                >
                  Discard
                </Button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </form>
      </SettingsSection>

      <SettingsSection title="Theme">
        <ThemeChoice />
      </SettingsSection>
    </div>
  );
}
