"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState } from "react";

import {
  FileTree,
  type FileSection,
} from "@/components/features/files/file-tree";
import { type AssetTileData } from "@/components/features/files/asset-tile";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchField } from "@/components/ui/search-field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { spring } from "@/styles/motion";

interface FilesPanelProps {
  title: string;
  /** The organization's mark, shown before the title. */
  logoUrl?: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  /** "2.1 GB of 10 GB used". */
  storageLabel: string;
  activeFileId?: string;
  onOpenFile?: (id: string) => void;
  onEditFile?: (id: string) => void;
  onOpenAsset?: (asset: AssetTileData) => void;
  onToggleSkill?: (id: string, enabled: boolean) => void;
  /** Opens a skill's markdown in an editor tab. */
  onOpenSkillFile?: (id: string) => void;
  openSkillId?: string;
  onClose?: () => void;
  onManage?: () => void;
  className?: string;
}

function matches(query: string, name: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

function filterSections(
  sections: readonly FileSection[],
  query: string,
): readonly FileSection[] {
  if (query.trim() === "") return sections;
  return sections.flatMap((section) => {
    const nodes = section.nodes.filter((node) => matches(query, node.name));
    return nodes.length > 0 ? [{ ...section, nodes }] : [];
  });
}

/**
 * The right column that pushes the workspace when open: search, Files and
 * Skills tabs, the tree, and a storage footer. In-flow, never an overlay.
 */
export function FilesPanel({
  title,
  logoUrl,
  sections,
  skills,
  storageLabel,
  activeFileId,
  onOpenFile,
  onEditFile,
  onOpenAsset,
  onToggleSkill,
  onOpenSkillFile,
  openSkillId,
  onClose,
  onManage,
  className,
}: FilesPanelProps) {
  const [query, setQuery] = useState("");
  const visible = filterSections(sections, query);

  return (
    <motion.aside
      layout
      transition={spring.soft}
      data-slot="files-panel"
      className={cn(
        "flex h-full w-80 shrink-0 flex-col gap-m bg-imagine-background px-m py-l",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-s px-xs">
        <span className="flex min-w-0 items-center gap-s">
          {logoUrl ? (
            // Org logos are user uploads from arbitrary hosts; next/image needs a domain list.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="size-6 shrink-0 rounded-control object-cover"
            />
          ) : null}
          <span className="truncate type-body font-semibold">{title}</span>
        </span>
        {onClose ? (
          <Button
            size="icon-xs"
            variant="ghost"
            aria-label="Close files"
            onClick={onClose}
          >
            <Icon name="xmark" size="s" />
          </Button>
        ) : null}
      </div>
      <SearchField
        value={query}
        onValueChange={setQuery}
        placeholder="Search files"
        className="bg-imagine-surface"
      />
      <Tabs defaultValue="files" variant="line" className="min-h-0 flex-1">
        <TabsList className="px-xs">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="min-h-0">
          <ScrollArea className="h-full">
            {visible.length === 0 ? (
              <p className="px-s py-l type-small text-imagine-foreground-muted">
                Nothing matches &quot;{query}&quot;.
              </p>
            ) : (
              <FileTree
                sections={visible}
                activeFileId={activeFileId}
                onOpenFile={onOpenFile}
                onEditFile={onEditFile}
                onOpenAsset={onOpenAsset}
                assetSize="sm"
                className="pr-s"
              />
            )}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="skills" className="min-h-0">
          <ScrollArea className="h-full">
            <SkillsList
              skills={skills}
              openSkillId={openSkillId}
              onToggle={onToggleSkill}
              onOpenFile={onOpenSkillFile}
              className="pr-s"
            />
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <div className="flex items-center justify-between px-xs type-small text-imagine-foreground-muted">
        <span>{storageLabel}</span>
        {onManage ? (
          <Button variant="link" size="xs" className="px-0" onClick={onManage}>
            Manage
          </Button>
        ) : null}
      </div>
    </motion.aside>
  );
}
