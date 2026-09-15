"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { createContext, useContext, useState, type ReactNode } from "react";

import {
  AssetGridItem,
  AssetGridOverflow,
  AssetGridSmall,
} from "@/components/features/files/asset-grid";
import {
  AssetTileButton,
  type AssetTileData,
} from "@/components/features/files/asset-tile";
import {
  DraggableAsset,
  DraggableFile,
} from "@/components/features/files/draggable-resource";
import type { FileResource } from "@/components/features/files/resource-drag";
import { Disclosure } from "@/components/motion/disclosure";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import { fade, pressRow, spring, stagger } from "@/styles/motion";

export type FileNode =
  | {
      type: "file";
      id: string;
      name: string;
      /** Opening lines of the document, for card previews. */
      excerpt?: string;
    }
  | { type: "folder"; id: string; name: string; children: readonly FileNode[] }
  | {
      type: "assets";
      id: string;
      name: string;
      assets: readonly AssetTileData[];
    };

export interface FileSection {
  id: string;
  title: string;
  kind: "organization" | "person";
  avatarUrl?: string;
  nodes: readonly FileNode[];
}

/** Asset tiles a tree row shows before folding the rest into "+N". */
const TREE_ASSET_LIMIT = 2;

/** Trails its row, so names start on a straight edge at every depth. */
function Chevron({ open }: { open: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      animate={{ rotate: open ? 90 : 0 }}
      transition={spring.snappy}
      className="ml-auto flex w-3 shrink-0 justify-center text-imagine-foreground-faint"
    >
      <Icon name="chevron-right" size="s" />
    </motion.span>
  );
}

/* ------------------------------------------------------------------------ */
/* Parts                                                                    */
/* ------------------------------------------------------------------------ */

/** The tree's frame. Holds `FileTreeSection`s. */
function FileTree({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-slot="file-tree" className={cn("flex flex-col gap-s", className)}>
      {children}
    </div>
  );
}

/**
 * A library: an organization or a person, collapsible under its mark. The
 * children (a `FileTreeList`) sit inside a guide line.
 */
function FileTreeSection({
  section,
  children,
}: {
  section: FileSection;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="flex flex-col gap-xxs">
      <motion.button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        whileTap={pressRow.whileTap}
        transition={pressRow.transition}
        className="flex h-9 w-full items-center gap-s rounded-control px-s text-left transition-colors outline-none hover:bg-imagine-surface-raised focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {section.kind === "organization" ? (
          section.avatarUrl ? (
            // Org logos are user uploads from arbitrary hosts; next/image needs a domain list.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={section.avatarUrl}
              alt=""
              className="size-6 shrink-0 rounded-control object-cover"
            />
          ) : (
            <span className="flex size-6 items-center justify-center rounded-control bg-imagine-secondary-soft text-imagine-secondary">
              <Icon name="building" size="s" />
            </span>
          )
        ) : (
          <PersonAvatar
            name={section.title}
            {...(section.avatarUrl === undefined
              ? {}
              : { avatarUrl: section.avatarUrl })}
            size="sm"
            className="size-6 text-xs"
          />
        )}
        <span className="truncate type-body font-medium">{section.title}</span>
        <Chevron open={open} />
      </motion.button>
      <Disclosure open={open}>
        <div className="ml-m border-l border-imagine-border pl-s">
          {children}
        </div>
      </Disclosure>
    </section>
  );
}

/** The rows under one parent. */
function FileTreeList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-xxs">{children}</ul>;
}

/** One row's slot in a `FileTreeList`; enters staggered by its position. */
function FileTreeItem({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...fade.base, delay: index * stagger.list }}
    >
      {children}
    </motion.li>
  );
}

/** A collapsible folder row; its children (a `FileTreeList`) indent under it. */
function FileTreeFolder({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <motion.button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        whileTap={pressRow.whileTap}
        transition={pressRow.transition}
        className="flex h-8 w-full items-center gap-s rounded-control px-s text-left text-imagine-foreground-muted transition-colors outline-none hover:bg-imagine-surface-raised hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Icon
          name="folder"
          size="s"
          className="text-imagine-foreground-faint"
        />
        <span className="truncate type-small">{name}</span>
        <Chevron open={open} />
      </motion.button>
      <Disclosure open={open}>
        <div className="ml-m border-l border-imagine-border pl-s">
          {children}
        </div>
      </Disclosure>
    </>
  );
}

const FileTreeFileContext = createContext<{ name: string } | null>(null);

function useFileTreeFile(part: string) {
  const context = useContext(FileTreeFileContext);
  if (context === null) {
    throw new Error(`${part} must be rendered inside FileTreeFile`);
  }
  return context;
}

/**
 * A document row. The open one carries a left bar. Children are the actions
 * that appear on hover: `FileTreeFileAttachAction`, `FileTreeFileEditAction`.
 */
function FileTreeFile({
  name,
  active = false,
  onOpen,
  children,
}: {
  name: string;
  active?: boolean;
  onOpen: () => void;
  children?: ReactNode;
}) {
  return (
    <FileTreeFileContext value={{ name }}>
      <div
        className={cn(
          "group/file relative flex h-8 items-center gap-s rounded-control pr-xs pl-s transition-[background-color,opacity] hover:bg-imagine-surface-raised",
          active && "bg-imagine-secondary-soft hover:bg-imagine-secondary-soft",
        )}
      >
        {active ? (
          <span
            aria-hidden="true"
            className="absolute inset-y-1.5 -left-m w-0.5 rounded-full bg-imagine-secondary"
          />
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-s text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <Icon
            name="file-lines"
            size="s"
            className="text-imagine-foreground-faint"
          />
          <span
            className={cn(
              "truncate type-small",
              active
                ? "font-medium"
                : "text-imagine-foreground-muted group-hover/file:text-imagine-foreground",
            )}
          >
            {name}
          </span>
        </button>
        {children}
      </div>
    </FileTreeFileContext>
  );
}

function FileTreeFileAttachAction({ onPress }: { onPress: () => void }) {
  const { name } = useFileTreeFile("FileTreeFileAttachAction");
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label={`Attach ${name} to chat`}
      onClick={onPress}
      className="text-imagine-foreground-faint opacity-0 transition-opacity group-hover/file:opacity-100 focus-visible:opacity-100"
    >
      <Icon name="paperclip" size="s" />
    </Button>
  );
}

function FileTreeFileEditAction({ onPress }: { onPress: () => void }) {
  const { name } = useFileTreeFile("FileTreeFileEditAction");
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      aria-label={`Edit ${name}`}
      onClick={onPress}
      className="opacity-0 transition-opacity group-hover/file:opacity-100 focus-visible:opacity-100"
    >
      <Icon name="pen" size="s" />
    </Button>
  );
}

/** An assets row: a label over whatever grid the caller puts under it. */
function FileTreeAssets({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-s py-xs">
      <span className="flex h-6 items-center gap-s px-s type-small text-imagine-foreground-muted">
        <Icon name="image" size="s" className="text-imagine-foreground-faint" />
        {name}
      </span>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Assembled trees                                                          */
/* ------------------------------------------------------------------------ */

/** Which asset rows show everything, once "+N" has been pressed. */
function useExpandedAssets() {
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const expand = (id: string) => {
    setExpanded((current) => new Set(current).add(id));
  };
  return { expanded, expand };
}

interface ChatFileTreeProps {
  sections: readonly FileSection[];
  activeFileId?: string;
  /** The asset already attached to the draft. */
  activeAssetId?: string;
  onOpenFile: (id: string) => void;
  onEditFile: (id: string) => void;
  onAttachFile: (file: FileResource) => void;
  onOpenAsset: (asset: AssetTileData) => void;
  className?: string;
}

interface ChatFileTreeApi extends Omit<
  ChatFileTreeProps,
  "sections" | "className"
> {
  expanded: ReadonlySet<string>;
  expand: (id: string) => void;
}

const ChatFileTreeContext = createContext<ChatFileTreeApi | null>(null);

function useChatFileTree() {
  const context = useContext(ChatFileTreeContext);
  if (context === null) throw new Error("Missing ChatFileTree");
  return context;
}

function ChatNodes({ nodes }: { nodes: readonly FileNode[] }) {
  const tree = useChatFileTree();
  return (
    <FileTreeList>
      {nodes.map((node, index) => (
        <FileTreeItem key={node.id} index={index}>
          {node.type === "file" ? (
            <DraggableFile file={{ id: node.id, title: node.name }}>
              <FileTreeFile
                name={node.name}
                active={node.id === tree.activeFileId}
                onOpen={() => {
                  tree.onOpenFile(node.id);
                }}
              >
                <FileTreeFileAttachAction
                  onPress={() => {
                    tree.onAttachFile({ id: node.id, title: node.name });
                  }}
                />
                <FileTreeFileEditAction
                  onPress={() => {
                    tree.onEditFile(node.id);
                  }}
                />
              </FileTreeFile>
            </DraggableFile>
          ) : node.type === "folder" ? (
            <FileTreeFolder name={node.name}>
              <ChatNodes nodes={node.children} />
            </FileTreeFolder>
          ) : (
            <ChatAssets node={node} />
          )}
        </FileTreeItem>
      ))}
    </FileTreeList>
  );
}

function ChatAssets({ node }: { node: Extract<FileNode, { type: "assets" }> }) {
  const tree = useChatFileTree();
  const shown = tree.expanded.has(node.id)
    ? node.assets
    : node.assets.slice(0, TREE_ASSET_LIMIT);
  const overflow = node.assets.length - shown.length;
  return (
    <FileTreeAssets name={node.name}>
      <AssetGridSmall className="px-s">
        {shown.map((asset) => (
          <DraggableAsset key={asset.id} asset={asset}>
            <AssetGridItem asset={asset}>
              <AssetTileButton
                asset={asset}
                selected={asset.id === tree.activeAssetId}
                onSelect={tree.onOpenAsset}
              />
            </AssetGridItem>
          </DraggableAsset>
        ))}
        {overflow > 0 ? (
          <AssetGridOverflow
            count={overflow}
            onPress={() => {
              tree.expand(node.id);
            }}
          />
        ) : null}
      </AssetGridSmall>
    </FileTreeAssets>
  );
}

/**
 * The tree beside a chat: every file and asset drags into the composer, and
 * hovering a file offers attach and edit.
 */
export function ChatFileTree({
  sections,
  className,
  ...api
}: ChatFileTreeProps) {
  const { expanded, expand } = useExpandedAssets();
  return (
    <ChatFileTreeContext value={{ ...api, expanded, expand }}>
      <FileTree className={className}>
        {sections.map((section) => (
          <FileTreeSection key={section.id} section={section}>
            <ChatNodes nodes={section.nodes} />
          </FileTreeSection>
        ))}
      </FileTree>
    </ChatFileTreeContext>
  );
}
