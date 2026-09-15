"use client";

import { cn } from "cn";
import { createContext, useContext, useState, type ReactNode } from "react";

import { type AssetTileData } from "@/components/features/files/asset-tile";
import {
  searchFiles,
  searchSkills,
  toSearchResults,
} from "@/components/features/files/file-search";
import { type FileSection } from "@/components/features/files/file-tree";
import { type Skill } from "@/components/features/files/skills-list";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBox } from "@/components/ui/search-box";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DEFAULT_WIDTH = 400;

/* ------------------------------------------------------------------------ */
/* Open / close, for anything in the shell                                  */
/* ------------------------------------------------------------------------ */

interface FilesPanelApi {
  open: () => void;
  close: () => void;
}

const FilesPanelApiContext = createContext<FilesPanelApi | null>(null);

export function FilesPanelApiProvider({
  open,
  close,
  children,
}: FilesPanelApi & { children: ReactNode }) {
  return (
    <FilesPanelApiContext.Provider value={{ open, close }}>
      {children}
    </FilesPanelApiContext.Provider>
  );
}

export function useFilesPanelApi() {
  return useContext(FilesPanelApiContext);
}

/* ------------------------------------------------------------------------ */
/* The panel                                                                */
/* ------------------------------------------------------------------------ */

type FilesPanelTab = "files" | "skills";

interface FilesPanelState {
  tab: FilesPanelTab;
  setTab: (tab: FilesPanelTab) => void;
}

const FilesPanelContext = createContext<FilesPanelState | null>(null);

function useFilesPanel(part: string): FilesPanelState {
  const context = useContext(FilesPanelContext);
  if (context === null) {
    throw new Error(`${part} must be rendered inside FilesPanelFrame`);
  }
  return context;
}

/**
 * The right column that pushes the workspace when open. In-flow, never an
 * overlay. Compose it: `FilesPanelHeader`, `FilesPanelSearch`,
 * `FilesPanelTabs` (with `FilesPanelFiles` and `FilesPanelSkills`), and
 * `FilesPanelDragHint` when the tree drags into a chat.
 */
export function FilesPanelFrame({
  width = DEFAULT_WIDTH,
  className,
  children,
}: {
  /** Pixels. The shell drives this when the panel is resizable. */
  width?: number;
  className?: string;
  children: ReactNode;
}) {
  const [tab, setTab] = useState<FilesPanelTab>("files");
  return (
    <FilesPanelContext value={{ tab, setTab }}>
      {/* Width is set, not animated: the shell animates the column it sits in,
          and a drag has to follow the pointer. */}
      <aside
        data-slot="files-panel"
        style={{ width }}
        className={cn(
          "flex h-full shrink-0 flex-col gap-m bg-imagine-background px-m py-l",
          className,
        )}
      >
        {children}
      </aside>
    </FilesPanelContext>
  );
}

/** The organization's mark and name; children sit at the row's end. */
export function FilesPanelHeader({
  title,
  logoUrl,
  children,
}: {
  title: string;
  logoUrl?: string;
  children?: ReactNode;
}) {
  return (
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
      {children}
    </div>
  );
}

export function FilesPanelCloseButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label="Close files"
      onClick={onPress}
    >
      <Icon name="xmark" size="s" />
    </Button>
  );
}

/**
 * Search across files, assets, and skills. A hit switches to its tab and
 * opens it.
 */
export function FilesPanelSearch({
  sections,
  skills,
  onOpenFile,
  onOpenAsset,
  onOpenSkillFile,
}: {
  sections: readonly FileSection[];
  skills: readonly Skill[];
  onOpenFile: (id: string) => void;
  onOpenAsset: (asset: AssetTileData) => void;
  onOpenSkillFile: (id: string) => void;
}) {
  const { setTab } = useFilesPanel("FilesPanelSearch");
  const [query, setQuery] = useState("");
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
      onOpenSkillFile(id);
      return;
    }
    setTab("files");
    if (hit.asset !== undefined) {
      onOpenAsset(hit.asset);
      return;
    }
    onOpenFile(id);
  };

  return (
    <SearchBox
      value={query}
      onValueChange={setQuery}
      results={toSearchResults(hits)}
      onSelect={openHit}
      placeholder="Search files"
      emptyLabel={`Nothing matches “${query.trim()}”`}
      listLabel="Files"
    />
  );
}

/** Files and Skills tabs; children are `FilesPanelFiles` and `FilesPanelSkills`. */
export function FilesPanelTabs({ children }: { children: ReactNode }) {
  const { tab, setTab } = useFilesPanel("FilesPanelTabs");
  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        if (next === "files" || next === "skills") setTab(next);
      }}
      variant="line"
      className="min-h-0 flex-1"
    >
      <TabsList className="px-xs">
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  );
}

/** The Files tab: a scrolling home for a tree. */
export function FilesPanelFiles({ children }: { children: ReactNode }) {
  return (
    <TabsContent value="files" className="min-h-0">
      <ScrollArea className="h-full">
        <div className="pr-s">{children}</div>
      </ScrollArea>
    </TabsContent>
  );
}

/** The Skills tab: a scrolling home for a `SkillsList`. */
export function FilesPanelSkills({ children }: { children: ReactNode }) {
  return (
    <TabsContent value="skills" className="min-h-0">
      <ScrollArea className="h-full">
        <div className="pr-s">{children}</div>
      </ScrollArea>
    </TabsContent>
  );
}

/** Footer strip explaining the chat-only drag interaction. */
export function FilesPanelDragHint() {
  return (
    <div className="flex items-center gap-s border-t border-imagine-border px-xs pt-m type-small text-imagine-foreground-muted">
      <Icon name="paperclip" size="s" />
      Drag a file or asset into chat
    </div>
  );
}
