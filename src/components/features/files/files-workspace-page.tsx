"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import {
  AssetTile,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import { AssetGrid } from "@/components/features/files/asset-grid";
import type {
  FileNode,
  FileSection,
} from "@/components/features/files/file-tree";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import {
  type Skill,
  SkillsList,
} from "@/components/features/files/skills-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { SearchField } from "@/components/ui/search-field";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OpenDocument } from "@/services/files";
import { fade, pressRow } from "@/styles/motion";

interface FilesWorkspacePageProps {
  title: string;
  logoUrl?: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documents: readonly OpenDocument[];
}

type Selection =
  { kind: "document"; id: string } | { kind: "asset"; asset: AssetTileData };

function countLibrary(nodes: readonly FileNode[]): {
  documents: number;
  assets: number;
} {
  let documents = 0;
  let assets = 0;
  for (const node of nodes) {
    if (node.type === "file") documents += 1;
    else if (node.type === "assets") assets += node.assets.length;
    else {
      const nested = countLibrary(node.children);
      documents += nested.documents;
      assets += nested.assets;
    }
  }
  return { documents, assets };
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function flattenContent(nodes: readonly FileNode[]): readonly FileNode[] {
  return nodes.flatMap((node) =>
    node.type === "folder" ? flattenContent(node.children) : [node],
  );
}

function searchContent(
  nodes: readonly FileNode[],
  query: string,
): readonly FileNode[] {
  const normalized = query.trim().toLowerCase();
  if (normalized === "") return nodes;

  return nodes.flatMap((node) => {
    if (node.type === "folder") {
      return searchContent(node.children, query);
    }
    if (node.type === "file") {
      return node.name.toLowerCase().includes(normalized) ? [node] : [];
    }
    const assets = node.assets.filter((asset) =>
      (asset.caption ?? asset.kind).toLowerCase().includes(normalized),
    );
    return assets.length === 0 ? [] : [{ ...node, assets }];
  });
}

function findFolder(
  nodes: readonly FileNode[],
  id: string,
): Extract<FileNode, { type: "folder" }> | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") continue;
    if (node.id === id) return node;
    const nested = findFolder(node.children, id);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function firstDocument(nodes: readonly FileNode[]) {
  return flattenContent(nodes).find((node) => node.type === "file");
}

/**
 * Full-page Files route. The searchable tree is the same one the chat opens;
 * the wider right side previews and edits the selected markdown or asset.
 */
export function FilesWorkspacePage({
  title,
  logoUrl,
  sections,
  skills: initialSkills,
  documents,
}: FilesWorkspacePageProps) {
  const [skills, setSkills] = useState(initialSkills);
  const [view, setView] = useState<"files" | "skills">("files");
  const [query, setQuery] = useState("");
  const [sectionId, setSectionId] = useState("all");
  const [folderId, setFolderId] = useState<string>();
  const [selection, setSelection] = useState<Selection | null>(() => {
    const first = documents[0];
    return first === undefined ? null : { kind: "document", id: first.id };
  });
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      documents.map((document) => [document.id, document.value]),
    ),
  );
  const [savedValues, setSavedValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      documents.map((document) => [document.id, document.value]),
    ),
  );
  const activeDocument =
    selection?.kind === "document"
      ? documents.find((document) => document.id === selection.id)
      : undefined;
  const allNodes = sections.flatMap((section) => section.nodes);
  const library = countLibrary(allNodes);
  const ownerByFileId = new Map<string, string>();
  for (const section of sections) {
    for (const node of flattenContent(section.nodes)) {
      if (node.type === "file") ownerByFileId.set(node.id, section.title);
    }
  }
  const currentSection = sections.find((section) => section.id === sectionId);
  const scopeNodes =
    currentSection === undefined
      ? flattenContent(allNodes)
      : currentSection.nodes;
  const currentFolder =
    folderId === undefined ? undefined : findFolder(scopeNodes, folderId);
  const locationNodes = currentFolder?.children ?? scopeNodes;
  const visibleNodes = searchContent(locationNodes, query);
  const folders =
    query.trim() === ""
      ? visibleNodes.flatMap((node) => (node.type === "folder" ? [node] : []))
      : [];
  const files = visibleNodes.flatMap((node) =>
    node.type === "file" ? [node] : [],
  );
  const assets = visibleNodes.flatMap((node) =>
    node.type === "assets" ? node.assets : [],
  );
  const visibleSkills =
    query.trim() === ""
      ? skills
      : skills.filter((skill) =>
          `${skill.name} ${skill.description} ${skill.fileName}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
        );
  const locationTitle =
    currentFolder?.name ?? currentSection?.title ?? "All files";

  const openDocument = (id: string) => {
    if (documents.some((document) => document.id === id)) {
      setSelection({ kind: "document", id });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-l">
      <header className="flex items-end justify-between gap-l">
        <h1 className="type-title">Files</h1>
        <p className="type-small text-imagine-foreground-muted">
          {library.documents} documents and {library.assets} assets
        </p>
      </header>
      <div className="@container flex min-h-0 flex-1 overflow-hidden rounded-panel border border-imagine-border bg-imagine-surface shadow-control">
        <aside className="flex w-56 shrink-0 flex-col border-r border-imagine-border bg-imagine-surface-raised p-m">
          <div className="flex items-center gap-s px-s pb-l">
            {logoUrl ? (
              // Workspace logos come from arbitrary hosts in the real app.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt=""
                className="size-7 rounded-control object-cover"
              />
            ) : (
              <span className="flex size-7 items-center justify-center rounded-control bg-imagine-primary text-imagine-primary-foreground">
                <Icon name="building" size="s" />
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate type-small font-semibold">
                {title}
              </span>
              <span className="block text-xs text-imagine-foreground-muted">
                Content library
              </span>
            </span>
          </div>

          <nav aria-label="File libraries" className="flex flex-col gap-xxs">
            <motion.button
              type="button"
              aria-pressed={sectionId === "all"}
              whileTap={pressRow.whileTap}
              transition={pressRow.transition}
              onClick={() => {
                setSectionId("all");
                setFolderId(undefined);
                const first = firstDocument(allNodes);
                if (first?.type === "file") openDocument(first.id);
              }}
              className={cn(
                "flex h-9 items-center gap-s rounded-control px-s text-left transition-colors outline-none hover:bg-imagine-surface focus-visible:ring-2 focus-visible:ring-ring/40",
                sectionId === "all" &&
                  "bg-imagine-surface font-medium shadow-control",
              )}
            >
              <span className="flex size-6 items-center justify-center text-imagine-foreground-muted">
                <Icon name="folder" size="s" />
              </span>
              <span className="min-w-0 flex-1 truncate type-small">
                All files
              </span>
              <span className="text-xs text-imagine-foreground-faint">
                {library.documents + library.assets}
              </span>
            </motion.button>

            <div className="my-s border-t border-imagine-border" />

            {sections.map((section) => {
              const active = section.id === sectionId;
              const count = countLibrary(section.nodes);
              const avatarUrl =
                section.avatarUrl ??
                (section.kind === "organization" ? logoUrl : undefined);
              return (
                <motion.button
                  key={section.id}
                  type="button"
                  aria-pressed={active}
                  whileTap={pressRow.whileTap}
                  transition={pressRow.transition}
                  onClick={() => {
                    setSectionId(section.id);
                    setFolderId(undefined);
                    const first = firstDocument(section.nodes);
                    if (first?.type === "file") openDocument(first.id);
                  }}
                  className={cn(
                    "flex h-10 items-center gap-s rounded-control px-s text-left transition-colors outline-none hover:bg-imagine-surface focus-visible:ring-2 focus-visible:ring-ring/40",
                    active && "bg-imagine-surface font-medium shadow-control",
                  )}
                >
                  {section.kind === "person" ? (
                    <Avatar size="sm" className="size-6">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={section.title} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {initials(section.title)}
                      </AvatarFallback>
                    </Avatar>
                  ) : avatarUrl ? (
                    // Organization images stay square.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt=""
                      className="size-6 rounded-control object-cover"
                    />
                  ) : (
                    <span className="flex size-6 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
                      <Icon name="building" size="s" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate type-small">
                    {section.title}
                  </span>
                  <span className="text-xs text-imagine-foreground-faint">
                    {count.documents + count.assets}
                  </span>
                </motion.button>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-14 shrink-0 items-center gap-l border-b border-imagine-border px-l">
            <Tabs
              value={view}
              onValueChange={(next) => {
                if (next === "files" || next === "skills") setView(next);
              }}
              className="flex-none"
            >
              <TabsList>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>
            </Tabs>
            <SearchField
              value={query}
              onValueChange={setQuery}
              placeholder={
                view === "files" ? "Search this library" : "Search skills"
              }
              className="ml-auto w-72 bg-imagine-surface-raised"
            />
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(19rem,0.9fr)_minmax(22rem,1.1fr)]">
            <section className="min-h-0 overflow-y-auto border-r border-imagine-border">
              <AnimatePresence initial={false} mode="wait">
                {view === "files" ? (
                  <motion.div
                    key={`files:${sectionId}:${folderId ?? "root"}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={fade.fast}
                    className="flex flex-col gap-xl p-l"
                  >
                    <header className="flex min-h-8 items-center gap-xs">
                      {currentFolder !== undefined ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setFolderId(undefined);
                            }}
                            className="rounded-xs type-heading font-medium text-imagine-foreground-muted outline-none hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            {currentSection?.title ?? "All files"}
                          </button>
                          <Icon
                            name="chevron-right"
                            size="s"
                            className="text-imagine-foreground-faint"
                          />
                        </>
                      ) : null}
                      <h2 className="truncate type-heading font-semibold">
                        {locationTitle}
                      </h2>
                    </header>

                    {folders.length > 0 ? (
                      <div className="flex flex-col gap-s">
                        <h3 className="type-small font-medium text-imagine-foreground-muted">
                          Folders
                        </h3>
                        <div className="divide-y divide-imagine-border border-y border-imagine-border">
                          {folders.map((folder) => {
                            const count = countLibrary(folder.children);
                            return (
                              <motion.button
                                key={folder.id}
                                type="button"
                                whileTap={pressRow.whileTap}
                                transition={pressRow.transition}
                                onClick={() => {
                                  setFolderId(folder.id);
                                  const first = firstDocument(folder.children);
                                  if (first?.type === "file") {
                                    openDocument(first.id);
                                  }
                                }}
                                className="flex h-11 w-full items-center gap-s px-xs text-left transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
                              >
                                <Icon
                                  name="folder"
                                  className="text-imagine-foreground-muted"
                                />
                                <span className="min-w-0 flex-1 truncate type-small font-medium">
                                  {folder.name}
                                </span>
                                <span className="text-xs text-imagine-foreground-faint">
                                  {count.documents + count.assets} items
                                </span>
                                <Icon
                                  name="chevron-right"
                                  size="s"
                                  className="text-imagine-foreground-faint"
                                />
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {files.length > 0 ? (
                      <div className="flex flex-col gap-s">
                        <h3 className="type-small font-medium text-imagine-foreground-muted">
                          Documents
                        </h3>
                        <div className="divide-y divide-imagine-border border-y border-imagine-border">
                          {files.map((file) => {
                            const active =
                              selection?.kind === "document" &&
                              selection.id === file.id;
                            const owner =
                              currentSection?.title ??
                              ownerByFileId.get(file.id);
                            return (
                              <motion.button
                                key={file.id}
                                type="button"
                                aria-pressed={active}
                                whileTap={pressRow.whileTap}
                                transition={pressRow.transition}
                                onClick={() => {
                                  openDocument(file.id);
                                }}
                                className={cn(
                                  "flex h-12 w-full items-center gap-s px-xs text-left transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset",
                                  active && "bg-imagine-secondary-soft",
                                )}
                              >
                                <span className="flex size-7 items-center justify-center rounded-xs bg-imagine-surface-raised text-imagine-foreground-muted shadow-control">
                                  <Icon name="file-lines" size="s" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate type-small font-medium">
                                    {file.name}
                                  </span>
                                  <span className="block text-xs text-imagine-foreground-faint">
                                    {owner ?? "Markdown document"}
                                  </span>
                                </span>
                                <Icon
                                  name="pen"
                                  size="s"
                                  className="text-imagine-foreground-faint"
                                />
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {assets.length > 0 ? (
                      <div className="flex flex-col gap-s">
                        <h3 className="type-small font-medium text-imagine-foreground-muted">
                          Assets
                        </h3>
                        <AssetGrid
                          assets={assets}
                          {...(selection?.kind === "asset"
                            ? { selectedId: selection.asset.id }
                            : {})}
                          onSelect={(asset) => {
                            setSelection({ kind: "asset", asset });
                          }}
                          className="grid-cols-2 @4xl:grid-cols-3"
                        />
                      </div>
                    ) : null}

                    {folders.length === 0 &&
                    files.length === 0 &&
                    assets.length === 0 ? (
                      <div className="flex min-h-48 flex-col items-center justify-center gap-s text-center text-imagine-foreground-muted">
                        <Icon name="magnifying-glass" size="l" />
                        <p className="type-small">
                          No files match &quot;{query}&quot;.
                        </p>
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={fade.fast}
                    className="flex flex-col gap-l p-l"
                  >
                    <header>
                      <h2 className="type-heading font-semibold">
                        Agent skills
                      </h2>
                      <p className="mt-xs type-small text-imagine-foreground-muted">
                        Enable instructions or open their markdown to edit.
                      </p>
                    </header>
                    <SkillsList
                      skills={visibleSkills}
                      {...(selection?.kind === "document"
                        ? { openSkillId: selection.id }
                        : {})}
                      onToggle={(id, enabled) => {
                        setSkills((current) =>
                          current.map((skill) =>
                            skill.id === id ? { ...skill, enabled } : skill,
                          ),
                        );
                      }}
                      onOpenFile={openDocument}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <aside className="relative min-h-0 min-w-0 overflow-hidden bg-imagine-surface-raised">
              <AnimatePresence initial={false} mode="wait">
                {activeDocument !== undefined ? (
                  <motion.div
                    key={activeDocument.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={fade.fast}
                    className="absolute inset-0 overflow-y-auto p-xl"
                  >
                    <MarkdownEditor
                      meta={activeDocument.meta}
                      value={values[activeDocument.id] ?? activeDocument.value}
                      savedValue={
                        savedValues[activeDocument.id] ?? activeDocument.value
                      }
                      onValueChange={(value) => {
                        setValues((current) => ({
                          ...current,
                          [activeDocument.id]: value,
                        }));
                      }}
                      onSave={() => {
                        setSavedValues((current) => ({
                          ...current,
                          [activeDocument.id]:
                            values[activeDocument.id] ?? activeDocument.value,
                        }));
                      }}
                    />
                  </motion.div>
                ) : selection?.kind === "asset" ? (
                  <motion.div
                    key={selection.asset.id}
                    initial={{ opacity: 0, transform: "scale(0.98)" }}
                    animate={{ opacity: 1, transform: "scale(1)" }}
                    exit={{ opacity: 0, transform: "scale(0.98)" }}
                    transition={fade.fast}
                    className="absolute inset-0 flex items-center justify-center p-xl"
                  >
                    <div className="flex w-full max-w-sm flex-col gap-m">
                      <AssetTile asset={selection.asset} />
                      <span>
                        <span className="block type-small font-medium">
                          {selection.asset.caption ?? "Untitled asset"}
                        </span>
                        <span className="block text-xs text-imagine-foreground-muted">
                          {selection.asset.kind === "video"
                            ? "Video asset"
                            : "Image asset"}
                        </span>
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={fade.fast}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-m text-imagine-foreground-muted"
                  >
                    <Icon name="folder" size="xl" />
                    <p className="type-small">
                      Choose a file or asset to preview.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
