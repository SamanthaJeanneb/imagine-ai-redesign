"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState } from "react";

import {
  FileTree,
  type FileNode,
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
  activeFileId?: string;
  activeAssetId?: string;
  onOpenFile?: (id: string) => void;
  onEditFile?: (id: string) => void;
  onOpenAsset?: (asset: AssetTileData) => void;
  /** Larger asset tiles on the full Files route. */
  assetSize?: "sm" | "default";
  onToggleSkill?: (id: string, enabled: boolean) => void;
  /** Opens a skill's markdown in an editor tab. */
  onOpenSkillFile?: (id: string) => void;
  openSkillId?: string;
  onClose?: () => void;
  className?: string;
}

function matches(query: string, name: string): boolean {
  return name.toLowerCase().includes(query.trim().toLowerCase());
}

function filterNodes(
  nodes: readonly FileNode[],
  query: string,
): readonly FileNode[] {
  return nodes.flatMap((node) => {
    if (matches(query, node.name)) return [node];
    if (node.type === "folder") {
      const children = filterNodes(node.children, query);
      return children.length === 0 ? [] : [{ ...node, children }];
    }
    if (node.type === "assets") {
      const assets = node.assets.filter((asset) =>
        matches(query, asset.caption ?? asset.kind),
      );
      return assets.length === 0 ? [] : [{ ...node, assets }];
    }
    return [];
  });
}

function filterSections(
  sections: readonly FileSection[],
  query: string,
): readonly FileSection[] {
  if (query.trim() === "") return sections;
  return sections.flatMap((section) => {
    const nodes = filterNodes(section.nodes, query);
    return nodes.length > 0 ? [{ ...section, nodes }] : [];
  });
}

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
  onOpenAsset,
  assetSize = "sm",
  onToggleSkill,
  onOpenSkillFile,
  openSkillId,
  onClose,
  className,
}: FilesPanelProps) {
  const [query, setQuery] = useState("");
  const [expandedAssetIds, setExpandedAssetIds] = useState<readonly string[]>(
    [],
  );
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
                activeAssetId={activeAssetId}
                onOpenFile={onOpenFile}
                onEditFile={onEditFile}
                onOpenAsset={onOpenAsset}
                onShowAllAssets={(id) => {
                  setExpandedAssetIds((current) =>
                    current.includes(id) ? current : [...current, id],
                  );
                }}
                expandedAssetIds={expandedAssetIds}
                assetSize={assetSize}
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
    </motion.aside>
  );
}
