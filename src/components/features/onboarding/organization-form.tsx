"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { fade } from "@/styles/motion";

interface LogoUploadProps {
  /** Object URL or remote URL of the chosen logo. */
  value?: string;
  onChange: (file: File | null) => void;
  className?: string;
}

/** Field labels in the setup flow read smaller than the body under them. */
export const STEP_LABEL = "type-caption font-semibold";

function firstImage(files: FileList | null): File | null {
  if (!files) return null;
  for (const file of files) {
    if (file.type.startsWith("image/")) return file;
  }
  return null;
}

/**
 * A logo dropzone: the tile previews the choice, the copy says what to drop,
 * and Upload opens the picker. Files can also be dragged onto the card.
 */
export function LogoUpload({ value, onChange, className }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      data-slot="logo-upload"
      data-dragging={dragging || undefined}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = firstImage(event.dataTransfer.files);
        if (file) onChange(file);
      }}
      className={cn(
        "flex items-center gap-m rounded-control border border-imagine-border bg-imagine-surface-raised/40 p-m transition-colors",
        dragging && "border-imagine-secondary bg-imagine-secondary-soft/40",
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-imagine-surface-raised text-imagine-foreground-faint">
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
              <Icon name="image" size="s" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-xxs">
        <span className="type-small">
          {value ? "Logo added" : "Drag a file here, or"}
        </span>
        <span className="type-caption text-imagine-foreground-muted">
          PNG or SVG, at least 256×256
        </span>
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
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-imagine-foreground-muted"
          onClick={() => {
            onChange(null);
          }}
        >
          Remove
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="bg-imagine-surface"
        onClick={() => {
          inputRef.current?.click();
        }}
      >
        <Icon name="upload" size="s" data-icon="inline-start" />
        {value ? "Replace" : "Upload"}
      </Button>
    </div>
  );
}

interface OrganizationFormProps {
  onContinue: (values: { name: string; logo: File | null }) => void;
  /** What was typed on an earlier visit, so coming back does not clear it. */
  defaultName?: string;
  defaultLogoUrl?: string;
  /** Every keystroke and logo change, for a live preview beside the form. */
  onChange?: (values: { name: string; logoUrl: string | undefined }) => void;
  className?: string;
}

/** Onboarding step: organization name and logo. */
export function OrganizationForm({
  onContinue,
  defaultName = "",
  defaultLogoUrl,
  onChange,
  className,
}: OrganizationFormProps) {
  const [name, setName] = useState(defaultName);
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>(defaultLogoUrl);
  const named = name.trim() !== "";

  return (
    <form
      data-slot="organization-form"
      className={cn(
        "flex w-full max-w-(--container-xl) flex-col gap-xxl",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (named) onContinue({ name: name.trim(), logo });
      }}
    >
      <Field>
        <FieldLabel htmlFor="org-name" className={STEP_LABEL}>
          Organization name
        </FieldLabel>
        <Input
          id="org-name"
          value={name}
          autoComplete="organization"
          placeholder="Acme Inc."
          autoFocus
          className="h-control-lg px-3 md:text-base"
          onChange={(event) => {
            setName(event.target.value);
            onChange?.({ name: event.target.value, logoUrl: preview });
          }}
        />
      </Field>
      <Field>
        <FieldLabel className={STEP_LABEL}>
          Logo
          <span className="font-normal text-imagine-foreground-muted">
            Optional
          </span>
        </FieldLabel>
        <LogoUpload
          value={preview}
          onChange={(file) => {
            setLogo(file);
            // A URL that came in as a default is not ours to revoke.
            if (preview !== undefined && preview !== defaultLogoUrl) {
              URL.revokeObjectURL(preview);
            }
            const next = file ? URL.createObjectURL(file) : undefined;
            setPreview(next);
            onChange?.({ name, logoUrl: next });
          }}
        />
      </Field>
      <div className="mt-l flex flex-wrap items-center gap-l">
        <Button type="submit" size="lg" disabled={!named}>
          Continue
        </Button>
        {named ? null : (
          <span className="type-caption text-imagine-foreground-muted">
            Enter a name to continue
          </span>
        )}
      </div>
    </form>
  );
}
