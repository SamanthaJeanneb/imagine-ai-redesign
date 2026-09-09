"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useState } from "react";

import type {
  FileNode,
  FileSection,
} from "@/components/features/files/file-tree";
import { Disclosure } from "@/components/motion/disclosure";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { fade, pressRow, spring, stagger } from "@/styles/motion";

/** Where the browser should go: a library, or a folder inside one. */
export interface TreeLocation {
  sectionId: string;
  folderId?: string;
}

interface FileTreeNavProps {
  sections: readonly FileSection[];
  /** The highlighted row: the open document, else the browsed location. */
  selectedId?: string;
  onSelectLocation: (location: TreeLocation) => void;
  onOpenFile: (id: string) => void;
  className?: string;
}

type FolderNode = Extract<FileNode, { type: "folder" }>;

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Every folder id on the way down to `id`, so the path can be held open. */
function pathTo(nodes: readonly FileNode[], id: string): readonly string[] {
  for (const node of nodes) {
    if (node.id === id) return [id];
    if (node.type !== "folder") continue;
    const below = pathTo(node.children, id);
    if (below.length > 0) return [node.id, ...below];
  }
  return [];
}

function SectionMark({ section }: { section: FileSection }) {
  if (section.kind === "person") {
    return (
      <Avatar size="sm" className="size-5">
        {section.avatarUrl ? (
          <AvatarImage src={section.avatarUrl} alt="" />
        ) : null}
        <AvatarFallback className="text-xs">
          {initials(section.title)}
        </AvatarFallback>
      </Avatar>
    );
  }
  if (section.avatarUrl) {
    return (
      // Organization marks stay square; hosts vary in the real app.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={section.avatarUrl}
        alt=""
        className="size-5 rounded-xs object-cover"
      />
    );
  }
  return (
    <span className="flex size-5 items-center justify-center rounded-xs bg-imagine-secondary-soft text-imagine-secondary">
      <Icon name="building" size="s" />
    </span>
  );
}

interface RowProps {
  selected: boolean;
  indicatorId: string;
  /** Present on containers; toggles without selecting. */
  open?: boolean;
  onToggle?: () => void;
  onClick: () => void;
  leading: React.ReactNode;
  label: string;
  emphasis?: boolean;
}

/**
 * One line of the tree. The chevron and the label are separate buttons so a
 * folder can be opened to look inside without becoming the location.
 */
function Row({
  selected,
  indicatorId,
  open,
  onToggle,
  onClick,
  leading,
  label,
  emphasis = false,
}: RowProps) {
  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "group/row relative flex h-8 items-center rounded-control pr-xs transition-colors",
        selected
          ? "text-imagine-foreground"
          : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
      )}
    >
      {selected ? (
        <motion.span
          layoutId={indicatorId}
          aria-hidden="true"
          transition={spring.snappy}
          className="absolute inset-0 rounded-control bg-imagine-foreground/8"
        />
      ) : null}
      {onToggle === undefined ? (
        <span aria-hidden="true" className="relative z-10 w-5 shrink-0" />
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
          onClick={onToggle}
          className="relative z-10 flex h-full w-5 shrink-0 items-center justify-center rounded-xs text-imagine-foreground-faint outline-none hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={spring.snappy}
            className="flex"
          >
            <Icon name="chevron-right" size="s" />
          </motion.span>
        </button>
      )}
      <motion.button
        type="button"
        aria-current={selected ? "location" : undefined}
        whileTap={pressRow.whileTap}
        transition={pressRow.transition}
        onClick={onClick}
        className="relative z-10 flex h-full min-w-0 flex-1 items-center gap-xs rounded-control text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="flex size-6 shrink-0 items-center justify-center">
          {leading}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate type-small",
            selected || emphasis ? "font-semibold" : "font-medium",
          )}
        >
          {label}
        </span>
      </motion.button>
    </div>
  );
}

interface BranchProps {
  sectionId: string;
  nodes: readonly FileNode[];
  depth: number;
  selectedId?: string;
  indicatorId: string;
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
  onSelectLocation: (location: TreeLocation) => void;
  onOpenFile: (id: string) => void;
}

/** Folders and files under one parent. Asset rows belong to the browser, not here. */
function Branch({
  sectionId,
  nodes,
  depth,
  selectedId,
  indicatorId,
  isOpen,
  toggle,
  onSelectLocation,
  onOpenFile,
}: BranchProps) {
  const visible = nodes.filter((node) => node.type !== "assets");
  if (visible.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-px", depth > 0 && "pl-l")}>
      {visible.map((node, index) => (
        <motion.li
          key={node.id}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...fade.base, delay: index * stagger.list }}
        >
          {node.type === "folder" ? (
            <FolderRows
              sectionId={sectionId}
              folder={node}
              depth={depth}
              selectedId={selectedId}
              indicatorId={indicatorId}
              isOpen={isOpen}
              toggle={toggle}
              onSelectLocation={onSelectLocation}
              onOpenFile={onOpenFile}
            />
          ) : (
            <Row
              selected={node.id === selectedId}
              indicatorId={indicatorId}
              onClick={() => {
                onOpenFile(node.id);
              }}
              leading={<Icon name="file-lines" size="s" />}
              label={node.name}
            />
          )}
        </motion.li>
      ))}
    </ul>
  );
}

function FolderRows({
  sectionId,
  folder,
  depth,
  selectedId,
  indicatorId,
  isOpen,
  toggle,
  onSelectLocation,
  onOpenFile,
}: Omit<BranchProps, "nodes"> & { folder: FolderNode }) {
  const open = isOpen(folder.id);
  return (
    <>
      <Row
        selected={folder.id === selectedId}
        indicatorId={indicatorId}
        open={open}
        onToggle={() => {
          toggle(folder.id);
        }}
        onClick={() => {
          onSelectLocation({ sectionId, folderId: folder.id });
        }}
        leading={<Icon name={open ? "folder-open" : "folder"} size="s" />}
        label={folder.name}
      />
      <Disclosure open={open}>
        <Branch
          sectionId={sectionId}
          nodes={folder.children}
          depth={depth + 1}
          selectedId={selectedId}
          indicatorId={indicatorId}
          isOpen={isOpen}
          toggle={toggle}
          onSelectLocation={onSelectLocation}
          onOpenFile={onOpenFile}
        />
      </Disclosure>
    </>
  );
}

/**
 * The rail's tree. Libraries at the top level, folders and documents below.
 * Rows are for getting somewhere: a library or folder becomes the browser's
 * location, a document opens. The path to the selection is held open unless
 * the user has closed it themselves.
 */
export function FileTreeNav({
  sections,
  selectedId,
  onSelectLocation,
  onOpenFile,
  className,
}: FileTreeNavProps) {
  const indicatorId = useId();
  // User toggles override the default of "open along the selected path".
  const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );

  const selectedPath = new Set<string>();
  if (selectedId !== undefined) {
    for (const section of sections) {
      const path = pathTo(section.nodes, selectedId);
      if (path.length > 0 || section.id === selectedId) {
        selectedPath.add(section.id);
        for (const id of path) selectedPath.add(id);
        break;
      }
    }
  }

  const isOpen = (id: string) => overrides.get(id) ?? selectedPath.has(id);
  const toggle = (id: string) => {
    setOverrides((current) => {
      const next = new Map(current);
      next.set(id, !isOpen(id));
      return next;
    });
  };

  return (
    <nav
      aria-label="Libraries"
      data-slot="file-tree-nav"
      className={cn("flex flex-col gap-px", className)}
    >
      {sections.map((section) => {
        const open = isOpen(section.id);
        return (
          <div key={section.id} className="flex flex-col gap-px">
            <Row
              selected={section.id === selectedId}
              indicatorId={indicatorId}
              open={open}
              onToggle={() => {
                toggle(section.id);
              }}
              onClick={() => {
                onSelectLocation({ sectionId: section.id });
              }}
              leading={<SectionMark section={section} />}
              label={section.title}
              emphasis
            />
            <Disclosure open={open}>
              <Branch
                sectionId={section.id}
                nodes={section.nodes}
                depth={1}
                selectedId={selectedId}
                indicatorId={indicatorId}
                isOpen={isOpen}
                toggle={toggle}
                onSelectLocation={onSelectLocation}
                onOpenFile={onOpenFile}
              />
            </Disclosure>
          </div>
        );
      })}
    </nav>
  );
}
