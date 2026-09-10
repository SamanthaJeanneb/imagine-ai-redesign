"use client";

import { cn } from "cn";
import { useState } from "react";

import {
  FileTree,
  type FileSection,
} from "@/components/features/files/file-tree";
import type { FileResource } from "@/components/features/files/resource-drag";
import { type AssetTileData } from "@/components/features/files/asset-tile";
import {
  searchFiles,
  searchSkills,
  toSearchResults,
} from "@/components/features/files/file-search";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBox } from "@/components/ui/search-box";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FilesPanelProps {
  title: string;
  /** The organization's mark, shown before the title. */
  logoUrl?: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  activeFileId?: string;
  activeAssetId?: string;
  onOpenFile?: (id: string) => void;
  onEditFile?: (id: string) => void;
  onAttachFile?: (file: FileResource) => void;
  onOpenAsset?: (asset: AssetTileData) => void;
  /** Larger asset tiles on the full Files route. */
  assetSize?: "sm" | "default";
  /** Explains the chat-only drag interaction. */
  dragHint?: boolean;
  onToggleSkill?: (id: string, enabled: boolean) => void;
  /** Opens a skill's markdown in an editor tab. */
  onOpenSkillFile?: (id: string) => void;
  openSkillId?: string;
  onClose?: () => void;
  /** Pixels. The shell drives this when the panel is resizable. */
  width?: number;
  className?: string;
}

const DEFAULT_WIDTH = 320;

/**
 * The right column that pushes the workspace when open: search, Files and
 * Skills tabs, and the tree. In-flow, never an overlay.
 */
export function FilesPanel({
  title,
  logoUrl,
  sections,
  skills,
  activeFileId,
  activeAssetId,
  onOpenFile,
  onEditFile,
  onAttachFile,
  onOpenAsset,
  assetSize = "sm",
  dragHint = false,
  onToggleSkill,
  onOpenSkillFile,
  openSkillId,
  onClose,
  width = DEFAULT_WIDTH,
  className,
}: FilesPanelProps) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("files");
  const [expandedAssetIds, setExpandedAssetIds] = useState<readonly string[]>(
    [],
  );
  const hits = [
    ...searchFiles(sections, query),
    ...searchSkills(skills, query),
  ];

  const openHit = (id: string) => {
    const hit = hits.find((entry) => entry.id === id);
    setQuery("");
    if (hit === undefined) return;
    if (hit.kind === "skill") {
      setTab("skills");
      onOpenSkillFile?.(id);
      return;
    }
    setTab("files");
    if (hit.asset !== undefined) {
      onOpenAsset?.(hit.asset);
      return;
    }
    onOpenFile?.(id);
  };

  return (
    // Width is set, not animated: the shell animates the column it sits in,
    // and a drag has to follow the pointer.
    <aside
      data-slot="files-panel"
      style={{ width }}
      className={cn(
        "flex h-full shrink-0 flex-col gap-m bg-imagine-background px-m py-l",
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
      <SearchBox
        value={query}
        onValueChange={setQuery}
        results={toSearchResults(hits)}
        onSelect={openHit}
        placeholder="Search files"
        emptyLabel={`Nothing matches “${query.trim()}”`}
        listLabel="Files"
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="line"
        className="min-h-0 flex-1"
      >
        <TabsList className="px-xs">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>
        <TabsContent value="files" className="min-h-0">
          <ScrollArea className="h-full">
            <FileTree
              sections={sections}
              activeFileId={activeFileId}
              activeAssetId={activeAssetId}
              onOpenFile={onOpenFile}
              onEditFile={onEditFile}
              onAttachFile={onAttachFile}
              onOpenAsset={onOpenAsset}
              onShowAllAssets={(id) => {
                setExpandedAssetIds((current) =>
                  current.includes(id) ? current : [...current, id],
                );
              }}
              expandedAssetIds={expandedAssetIds}
              assetSize={assetSize}
              draggableResources={dragHint}
              className="pr-s"
            />
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
      {dragHint ? (
        <div className="flex items-center gap-s border-t border-imagine-border px-xs pt-m type-small text-imagine-foreground-muted">
          <Icon name="paperclip" size="s" />
          Drag a file or asset into chat
        </div>
      ) : null}
    </aside>
  );
}
