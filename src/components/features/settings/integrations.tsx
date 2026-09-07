"use client";

import { cn } from "cn";
import { motion } from "motion/react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { hoverLift, press } from "@/styles/motion";

export interface ConnectedIntegration {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  status: "connected" | "expired";
  /** Two short facts, e.g. "Synced 2h ago", "1,204 contacts". */
  facts: readonly [string, string];
}

export interface AvailableIntegration {
  id: string;
  name: string;
  description: string;
  icon: IconName;
}

function IntegrationMark({ icon }: { icon: IconName }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center text-imagine-foreground">
      <Icon name={icon} size="xl" />
    </span>
  );
}

interface IntegrationRowsProps {
  items: readonly ConnectedIntegration[];
  onReconnect?: (id: string) => void;
  onOpen?: (id: string) => void;
  className?: string;
}

/**
 * Connected services as rows: mark, name, two facts, and Reconnect. Expired
 * rows make Reconnect the emphasized action.
 */
export function IntegrationRows({
  items,
  onReconnect,
  onOpen,
  className,
}: IntegrationRowsProps) {
  return (
    <Stagger
      kind="list"
      data-slot="integration-rows"
      className={cn("flex flex-col", className)}
    >
      {items.map((item) => (
        <StaggerItem key={item.id}>
          <div className="flex items-center gap-m rounded-control px-m py-m transition-colors hover:bg-imagine-surface-raised/50">
            <IntegrationMark icon={item.icon} />
            <button
              type="button"
              onClick={() => onOpen?.(item.id)}
              className="flex min-w-0 flex-1 flex-col text-left outline-none focus-visible:underline"
            >
              <span className="type-body font-medium">{item.name}</span>
              <span className="truncate type-small text-imagine-foreground-muted">
                {item.description}
              </span>
            </button>
            <span className="hidden items-center gap-l type-small text-imagine-foreground-muted tabular-nums sm:flex">
              <span>{item.facts[0]}</span>
              <span>{item.facts[1]}</span>
            </span>
            <Button
              size="sm"
              variant={item.status === "expired" ? "default" : "ghost"}
              onClick={() => onReconnect?.(item.id)}
            >
              Reconnect
            </Button>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

interface IntegrationGridProps {
  items: readonly AvailableIntegration[];
  onAdd?: (id: string) => void;
  onBrowseAll?: () => void;
  className?: string;
}

/**
 * Services available to add, as soft tiles that lift on hover, ending in a
 * quiet "Browse all" tile.
 */
export function IntegrationGrid({
  items,
  onAdd,
  onBrowseAll,
  className,
}: IntegrationGridProps) {
  return (
    <Stagger
      kind="grid"
      data-slot="integration-grid"
      className={cn("grid grid-cols-2 gap-m sm:grid-cols-4", className)}
    >
      {items.map((item) => (
        <StaggerItem key={item.id}>
          <motion.button
            type="button"
            whileHover={hoverLift.whileHover}
            whileTap={press.whileTap}
            transition={press.transition}
            onClick={() => onAdd?.(item.id)}
            className="flex h-full w-full flex-col gap-m rounded-panel bg-imagine-surface p-l text-left shadow-control transition-shadow outline-none hover:shadow-raised focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="flex h-9 items-center text-imagine-foreground">
              <Icon name={item.icon} size="xl" />
            </span>
            <span className="flex flex-col gap-xxs">
              <span className="type-body font-medium">{item.name}</span>
              <span className="type-small text-imagine-foreground-muted">
                {item.description}
              </span>
            </span>
          </motion.button>
        </StaggerItem>
      ))}
      <StaggerItem>
        <motion.button
          type="button"
          whileHover={hoverLift.whileHover}
          whileTap={press.whileTap}
          transition={press.transition}
          onClick={onBrowseAll}
          className="flex h-full min-h-32 w-full items-center justify-center gap-s rounded-panel border border-dashed border-imagine-foreground-faint/60 type-small text-imagine-foreground-muted outline-none hover:border-imagine-foreground-muted hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Icon name="puzzle-piece" size="s" />
          Browse all
        </motion.button>
      </StaggerItem>
    </Stagger>
  );
}
