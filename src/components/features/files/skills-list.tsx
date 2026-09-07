"use client";

import { cn } from "cn";
import { useId } from "react";

import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Switch } from "@/components/ui/switch";

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  /** The instructions behind the skill, e.g. "calendar-gap.md". */
  fileName: string;
}

interface SkillsListProps {
  skills: readonly Skill[];
  /** The skill whose file is open in an editor tab. */
  openSkillId?: string;
  onToggle?: (id: string, enabled: boolean) => void;
  /** Opens the skill's markdown for editing. */
  onOpenFile?: (id: string) => void;
  className?: string;
}

interface SkillRowProps {
  skill: Skill;
  open: boolean;
  onToggle?: (id: string, enabled: boolean) => void;
  onOpenFile?: (id: string) => void;
}

/**
 * Switch first, since on/off is the thing you scan for. The name labels it,
 * and the file sits under both as the way into the instructions.
 */
function SkillRow({ skill, open, onToggle, onOpenFile }: SkillRowProps) {
  const switchId = useId();

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-m gap-y-xxs rounded-control px-s py-s transition-colors hover:bg-imagine-surface-raised">
      <Switch
        id={switchId}
        checked={skill.enabled}
        onCheckedChange={(next) => {
          onToggle?.(skill.id, next);
        }}
      />
      <label
        htmlFor={switchId}
        className="min-w-0 cursor-pointer truncate type-small font-medium"
      >
        {skill.name}
      </label>
      <div className="col-start-2 flex flex-col items-start gap-xxs">
        <span className="type-small text-imagine-foreground-muted">
          {skill.description}
        </span>
        {onOpenFile ? (
          <button
            type="button"
            aria-current={open ? "true" : undefined}
            onClick={() => {
              onOpenFile(skill.id);
            }}
            className={cn(
              "-mx-xxs rounded-xs px-xxs font-mono text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              open
                ? "text-imagine-foreground underline underline-offset-3"
                : "text-imagine-foreground-faint hover:text-imagine-foreground hover:underline hover:underline-offset-3",
            )}
          >
            {skill.fileName}
          </button>
        ) : (
          <span className="font-mono text-xs text-imagine-foreground-faint">
            {skill.fileName}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * The Skills tab: what the agent knows how to do, each switchable. Every skill
 * is really a markdown file, so each row links to it.
 */
export function SkillsList({
  skills,
  openSkillId,
  onToggle,
  onOpenFile,
  className,
}: SkillsListProps) {
  return (
    <Stagger
      kind="list"
      data-slot="skills-list"
      className={cn("flex flex-col gap-xxs", className)}
    >
      {skills.map((skill) => (
        <StaggerItem key={skill.id}>
          <SkillRow
            skill={skill}
            open={skill.id === openSkillId}
            onToggle={onToggle}
            onOpenFile={onOpenFile}
          />
        </StaggerItem>
      ))}
    </Stagger>
  );
}
