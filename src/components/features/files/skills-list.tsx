"use client";

import { cn } from "cn";

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
  onToggle: (id: string, enabled: boolean) => void;
  /** Opens the skill's markdown for editing. */
  onOpenFile: (id: string) => void;
  className?: string;
}

interface SkillRowProps {
  skill: Skill;
  open: boolean;
  onToggle: (id: string, enabled: boolean) => void;
  onOpenFile: (id: string) => void;
}

/**
 * The highlighted row opens the skill's file. The switch sits on top of that
 * hit target so it still turns the skill on and off on its own.
 */
function SkillRow({ skill, open, onToggle, onOpenFile }: SkillRowProps) {
  return (
    <div
      className={cn(
        "relative grid grid-cols-[auto_1fr] items-center gap-x-m gap-y-xxs rounded-control px-s py-s transition-colors",
        open ? "bg-imagine-surface-raised" : "hover:bg-imagine-surface-raised",
      )}
    >
      <button
        type="button"
        aria-label={`Open ${skill.name}`}
        aria-current={open ? "true" : undefined}
        onClick={() => {
          onOpenFile(skill.id);
        }}
        className="absolute inset-0 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      <Switch
        checked={skill.enabled}
        aria-label={skill.name}
        onCheckedChange={(next) => {
          onToggle(skill.id, next);
        }}
        className="relative z-10"
      />
      <div className="col-start-2 flex min-w-0 flex-col items-start gap-xxs">
        <span className="truncate type-small font-medium">{skill.name}</span>
        <span className="type-small text-imagine-foreground-muted">
          {skill.description}
        </span>
        <span
          className={cn(
            "font-mono text-xs",
            open
              ? "text-imagine-foreground underline underline-offset-3"
              : "text-imagine-foreground-faint",
          )}
        >
          {skill.fileName}
        </span>
      </div>
    </div>
  );
}

/**
 * The Skills tab: what the agent knows how to do, each switchable. Every skill
 * is really a markdown file, so each row opens it.
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
