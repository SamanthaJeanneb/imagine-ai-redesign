"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fade, pop } from "@/styles/motion";

interface ApiKeySectionProps {
  /** The full secret, or `null` before one has been created. */
  secret: string | null;
  /** Where "API documentation" points. */
  docsHref?: string;
  onCreate?: () => void;
  /** Issues a new secret and invalidates the old one. */
  onRotate?: () => void;
  onRevoke?: () => void;
  className?: string;
}

/** A fixed run of dots, so the mask never leaks the secret's length. */
const MASK = "•".repeat(18);
const PREFIX_LENGTH = 10;

interface ConfirmActionProps {
  icon: IconName;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * An icon button that asks before it acts. Rotating and revoking both break
 * live integrations, so neither happens on a single click.
 */
function ConfirmAction({
  icon,
  label,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmActionProps) {
  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={label}
              className={
                destructive
                  ? "text-imagine-foreground-muted hover:text-destructive"
                  : undefined
              }
            >
              <Icon name={icon} size="s" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Settings, API. One key per workspace: the secret masked in a read-only
 * field, then reveal, copy, rotate, revoke. Rotate and revoke confirm first.
 */
export function ApiKeySection({
  secret,
  docsHref,
  onCreate,
  onRotate,
  onRevoke,
  className,
}: ApiKeySectionProps) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div data-slot="api-key" className={cn("flex flex-col gap-m", className)}>
      <div className="flex flex-col gap-xxs">
        <span className="type-heading">API key</span>
        <p className="type-small text-imagine-foreground-muted">
          Authenticate requests from your own tools.
          {docsHref ? (
            <>
              {" See the "}
              <a
                href={docsHref}
                className="text-imagine-foreground underline underline-offset-4 hover:text-imagine-secondary"
              >
                API documentation
              </a>
              {" for endpoints and examples."}
            </>
          ) : null}
        </p>
      </div>
      {secret === null ? (
        <div className="flex items-center gap-m">
          <Button size="sm" variant="soft" onClick={onCreate}>
            <Icon name="plus" size="s" data-icon="inline-start" />
            Create key
          </Button>
          <span className="type-small text-imagine-foreground-muted">
            No key yet.
          </span>
        </div>
      ) : (
        <motion.div
          key={secret}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={fade.base}
          className="flex items-center gap-xs"
        >
          <code className="min-w-0 flex-1 truncate rounded-control bg-imagine-surface-raised px-m py-xs font-mono text-xs text-imagine-foreground-muted select-all">
            {revealed ? secret : `${secret.slice(0, PREFIX_LENGTH)}${MASK}`}
          </code>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={revealed ? "Hide key" : "Reveal key"}
                aria-pressed={revealed}
                onClick={() => {
                  setRevealed((current) => !current);
                }}
              >
                <Icon name="eye" size="s" active={revealed} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{revealed ? "Hide" : "Reveal"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Copy key"
                onClick={() => {
                  void navigator.clipboard.writeText(secret);
                  setCopied(true);
                  window.setTimeout(() => {
                    setCopied(false);
                  }, 1500);
                }}
              >
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={copied ? "copied" : "copy"}
                    className="flex"
                    {...pop}
                  >
                    <Icon
                      name={copied ? "check" : "copy"}
                      size="s"
                      active={copied}
                      className={copied ? "text-success" : undefined}
                    />
                  </motion.span>
                </AnimatePresence>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{copied ? "Copied" : "Copy"}</TooltipContent>
          </Tooltip>
          {onRotate ? (
            <ConfirmAction
              icon="arrows-rotate"
              label="Rotate key"
              title="Rotate API key?"
              description="A new key is issued and this one stops working. Anything using the old key has to be updated."
              confirmLabel="Rotate"
              onConfirm={onRotate}
            />
          ) : null}
          {onRevoke ? (
            <ConfirmAction
              icon="trash"
              label="Revoke key"
              title="Revoke API key?"
              description="This key stops working right away and cannot be restored. You can create a new one afterward."
              confirmLabel="Revoke"
              destructive
              onConfirm={onRevoke}
            />
          ) : null}
        </motion.div>
      )}
    </div>
  );
}
