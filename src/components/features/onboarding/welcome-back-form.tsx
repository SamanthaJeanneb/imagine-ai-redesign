"use client";

import { cn } from "cn";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

interface WelcomeBackFormProps {
  onGoogle?: () => void;
  onX?: () => void;
  onEmail?: (email: string, remember: boolean) => void;
  pending?: boolean;
  className?: string;
}

/**
 * The compact sign-in used on the scene page: providers as two icon tiles
 * side by side, then email. The accent lives only on the Sign in button.
 */
export function WelcomeBackForm({
  onGoogle,
  onX,
  onEmail,
  pending = false,
  className,
}: WelcomeBackFormProps) {
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);

  return (
    <form
      data-slot="welcome-back-form"
      className={cn("flex w-full flex-col gap-xl", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim()) onEmail?.(email.trim(), remember);
      }}
    >
      <div className="flex flex-col gap-s">
        <h1 className="type-display text-imagine-foreground">Welcome back.</h1>
        <p className="type-small text-imagine-foreground-muted">
          Sign in to your Imagine workspace.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-m">
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Continue with Google"
          onClick={onGoogle}
          className="dark:border-imagine-foreground/15"
        >
          <Icon name="google" size="l" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          aria-label="Continue with X"
          onClick={onX}
          className="dark:border-imagine-foreground/15"
        >
          <Icon name="x-twitter" size="l" />
        </Button>
      </div>

      <div
        role="separator"
        className="flex items-center gap-m type-caption text-imagine-foreground-faint"
      >
        <span className="h-px flex-1 bg-imagine-border" />
        or continue with email
        <span className="h-px flex-1 bg-imagine-border" />
      </div>

      <div className="flex flex-col gap-l">
        <Field>
          <FieldLabel htmlFor="welcome-back-email">Email address</FieldLabel>
          <InputGroup className="h-control-lg">
            <InputGroupAddon>
              <Icon name="envelope" className="text-imagine-foreground-faint" />
            </InputGroupAddon>
            <InputGroupInput
              id="welcome-back-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </InputGroup>
        </Field>

        <label className="flex items-center gap-s type-small text-imagine-foreground-muted">
          <Checkbox
            checked={remember}
            onCheckedChange={(next) => {
              setRemember(next === true);
            }}
            className="data-[state=checked]:border-imagine-secondary data-[state=checked]:bg-imagine-secondary data-[state=checked]:text-imagine-secondary-foreground"
          />
          Keep me signed in
        </label>
      </div>

      {/* Enabled from the start; the email input's own validation is the guard. */}
      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="justify-between bg-imagine-secondary/25 text-imagine-foreground hover:bg-imagine-secondary/35 dark:bg-imagine-secondary/30 dark:hover:bg-imagine-secondary/40"
      >
        <span className="inline-flex items-center gap-1.5">
          {pending ? <Spinner size="s" data-icon="inline-start" /> : null}
          Sign in
        </span>
        <Icon name="arrow-right" data-icon="inline-end" />
      </Button>
    </form>
  );
}
