"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { fade } from "@/styles/motion";

interface LogoUploadProps {
  /** Object URL or remote URL of the chosen logo. */
  value?: string;
  onChange: (file: File | null) => void;
  className?: string;
}

/** A logo tile beside an Upload action; the tile previews the choice. */
export function LogoUpload({ value, onChange, className }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      data-slot="logo-upload"
      className={cn("flex items-center gap-m", className)}
    >
      <span className="flex size-12 items-center justify-center overflow-hidden rounded-control bg-imagine-surface-raised text-imagine-foreground-faint">
        <AnimatePresence mode="wait" initial={false}>
          {value ? (
            <motion.img
              key={value}
              src={value}
              alt="Organization logo"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.base}
              className="size-full object-cover"
            />
          ) : (
            <motion.span
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.fast}
            >
              <Icon name="image" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          onChange(event.target.files?.[0] ?? null);
        }}
      />
      <Button
        type="button"
        variant="soft"
        size="sm"
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <Icon name="upload" size="s" data-icon="inline-start" />
        {value ? "Replace" : "Upload"}
      </Button>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            onChange(null);
          }}
        >
          Remove
        </Button>
      ) : null}
    </div>
  );
}

interface OrganizationFormProps {
  onContinue: (values: { name: string; logo: File | null }) => void;
  className?: string;
}

/** Onboarding step: organization name and logo. */
export function OrganizationForm({
  onContinue,
  className,
}: OrganizationFormProps) {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();

  return (
    <form
      data-slot="organization-form"
      className={cn("flex w-full max-w-md flex-col gap-xl", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) onContinue({ name: name.trim(), logo });
      }}
    >
      <Field>
        <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
        <Input
          id="org-name"
          value={name}
          autoComplete="organization"
          placeholder="Acme Inc."
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <FieldDescription>Shown on every profile you manage.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Logo</FieldLabel>
        <LogoUpload
          value={preview}
          onChange={(file) => {
            setLogo(file);
            if (preview) URL.revokeObjectURL(preview);
            setPreview(file ? URL.createObjectURL(file) : undefined);
          }}
        />
      </Field>
      <Button
        type="submit"
        size="lg"
        className="self-start"
        disabled={!name.trim()}
      >
        Continue
      </Button>
    </form>
  );
}
