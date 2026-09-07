"use client";

import { cn } from "cn";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface SignInFormProps {
  onGoogle?: () => void;
  onX?: () => void;
  onEmail?: (email: string, remember: boolean) => void;
  pending?: boolean;
  className?: string;
}

/**
 * Sign in: two providers, an accent hairline divider, then email. The only
 * primary button on the page is Sign in.
 */
export function SignInForm({
  onGoogle,
  onX,
  onEmail,
  pending = false,
  className,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);

  return (
    <form
      data-slot="sign-in-form"
      className={cn("flex w-full max-w-96 flex-col gap-xl", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim()) onEmail?.(email.trim(), remember);
      }}
    >
      <div className="flex flex-col gap-xs">
        <h1 className="type-title">Sign in</h1>
        <p className="type-body text-imagine-foreground-muted">
          Create an account to get started
        </p>
      </div>

      <div className="flex flex-col gap-m">
        <Button type="button" variant="outline" size="lg" onClick={onGoogle}>
          <Icon name="google" data-icon="inline-start" />
          Continue with Google
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={onX}>
          <Icon name="x-twitter" data-icon="inline-start" />
          Continue with X
        </Button>
      </div>

      <div
        role="separator"
        className="flex items-center gap-m type-small text-imagine-secondary"
      >
        <span className="h-px flex-1 bg-imagine-secondary/60" />
        or
        <span className="h-px flex-1 bg-imagine-secondary/60" />
      </div>

      <Field>
        <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
        <Input
          id="sign-in-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
      </Field>

      <label className="flex items-center gap-s type-small text-imagine-foreground-muted">
        <Checkbox
          checked={remember}
          onCheckedChange={(next) => {
            setRemember(next === true);
          }}
        />
        Keep me signed in
      </label>

      {/* Enabled from the start; the email input's own validation is the guard. */}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Spinner size="s" data-icon="inline-start" /> : null}
        Sign in
      </Button>
    </form>
  );
}
