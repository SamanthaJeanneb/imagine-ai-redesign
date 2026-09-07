"use client";

import { cn } from "cn";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface SkillsListProps {
  skills: readonly Skill[];
  onToggle?: (id: string, enabled: boolean) => void;
  className?: string;
}

/** The Skills tab: what the agent knows how to do, each switchable. */
export function SkillsList({ skills, onToggle, className }: SkillsListProps) {
  return (
    <Stagger
      kind="list"
      data-slot="skills-list"
      className={cn("flex flex-col gap-xxs", className)}
    >
      {skills.map((skill) => (
        <StaggerItem key={skill.id}>
          <label className="flex cursor-pointer items-start gap-m rounded-control px-s py-s transition-colors hover:bg-imagine-surface-raised">
            <span className="mt-xxs flex size-6 shrink-0 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
              <Icon name="bolt" size="s" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-xxs">
              <span className="type-small font-medium">{skill.name}</span>
              <span className="type-small text-imagine-foreground-muted">
                {skill.description}
              </span>
            </span>
            <Switch
              checked={skill.enabled}
              onCheckedChange={(next) => {
                onToggle?.(skill.id, next);
              }}
              aria-label={`${skill.enabled ? "Disable" : "Enable"} ${skill.name}`}
            />
          </label>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
