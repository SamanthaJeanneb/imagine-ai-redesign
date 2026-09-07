"use client";

import { cn } from "cn";
import { useState } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ApiKey {
  id: string;
  name: string;
  /** "sk_live_4f2a". Only the prefix is ever shown. */
  prefix: string;
  /** "Used 3h ago" or "Never used". */
  lastUsed: string;
  created: string;
}

interface ApiKeyListProps {
  keys: readonly ApiKey[];
  onCreate?: () => void;
  onRevoke?: (id: string) => void;
  className?: string;
}

/** Settings, API: keys as rows with a copyable prefix and a quiet revoke. */
export function ApiKeyList({
  keys,
  onCreate,
  onRevoke,
  className,
}: ApiKeyListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  return (
    <div data-slot="api-keys" className={cn("flex flex-col gap-m", className)}>
      <div className="flex items-center justify-between">
        <span className="type-heading">API keys</span>
        {onCreate ? (
          <Button size="sm" variant="soft" onClick={onCreate}>
            <Icon name="plus" size="s" data-icon="inline-start" />
            New key
          </Button>
        ) : null}
      </div>
      {keys.length === 0 ? (
        <p className="type-small text-imagine-foreground-muted">
          No keys yet. Create one to post from your own tools.
        </p>
      ) : (
        <Stagger kind="list" className="flex flex-col">
          {keys.map((key) => {
            const copied = copiedId === key.id;
            return (
              <StaggerItem key={key.id}>
                <div className="flex items-center gap-m rounded-control px-m py-s transition-colors hover:bg-imagine-surface-raised/50">
                  <span className="flex size-8 items-center justify-center rounded-control bg-imagine-surface-raised text-imagine-foreground-muted">
                    <Icon name="key" size="s" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate type-body font-medium">
                      {key.name}
                    </span>
                    <span className="type-small text-imagine-foreground-muted">
                      Created {key.created}
                      <span className="text-imagine-foreground-faint"> · </span>
                      {key.lastUsed}
                    </span>
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="soft"
                        className="font-mono text-xs"
                        onClick={() => {
                          void navigator.clipboard.writeText(key.prefix);
                          setCopiedId(key.id);
                          window.setTimeout(() => {
                            setCopiedId(null);
                          }, 1500);
                        }}
                      >
                        {key.prefix}
                        <span aria-hidden="true">…</span>
                        <Icon
                          name={copied ? "check" : "copy"}
                          size="s"
                          data-icon="inline-end"
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied" : "Copy prefix"}
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-imagine-foreground-muted hover:text-destructive"
                    onClick={() => onRevoke?.(key.id)}
                  >
                    Revoke
                  </Button>
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
