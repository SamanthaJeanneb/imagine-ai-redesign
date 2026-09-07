"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useState } from "react";

import { AssetGrid } from "@/components/features/files/asset-grid";
import { type AssetTileData } from "@/components/features/files/asset-tile";
import { Disclosure } from "@/components/motion/disclosure";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { fade, pressRow, spring, stagger } from "@/styles/motion";

export type FileNode =
  | { type: "file"; id: string; name: string }
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

interface FileTreeProps {
  sections: readonly FileSection[];
  activeFileId?: string;
  onOpenFile?: (id: string) => void;
  onEditFile?: (id: string) => void;
  onOpenAsset?: (asset: AssetTileData) => void;
  onShowAllAssets?: (nodeId: string) => void;
  /** Tile size for asset rows. */
  assetSize?: "sm" | "default";
  className?: string;
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

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

function FileRow({
  node,
  active,
  onOpen,
  onEdit,
}: {
  node: Extract<FileNode, { type: "file" }>;
  active: boolean;
  onOpen?: (id: string) => void;
  onEdit?: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "group/file relative flex h-8 items-center gap-s rounded-control pr-xs pl-s transition-colors hover:bg-imagine-surface-raised",
        active && "selection-gradient-soft hover:bg-transparent",
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
        onClick={() => onOpen?.(node.id)}
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
          {node.name}
        </span>
      </button>
      {onEdit ? (
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Edit ${node.name}`}
          onClick={() => {
            onEdit(node.id);
          }}
          className="opacity-0 transition-opacity group-hover/file:opacity-100 focus-visible:opacity-100"
        >
          <Icon name="pen" size="s" />
        </Button>
      ) : null}
    </div>
  );
}

function Nodes({
  nodes,
  depth,
  activeFileId,
  assetSize,
  onOpenFile,
  onEditFile,
  onOpenAsset,
  onShowAllAssets,
}: {
  nodes: readonly FileNode[];
  depth: number;
} & Pick<
  FileTreeProps,
  | "activeFileId"
  | "assetSize"
  | "onOpenFile"
  | "onEditFile"
  | "onOpenAsset"
  | "onShowAllAssets"
>) {
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());

  return (
    <ul
      className={cn(
        "flex flex-col gap-xxs",
        depth > 0 && "ml-m border-l border-imagine-border pl-s",
      )}
    >
      {nodes.map((node, index) => (
        <motion.li
          key={node.id}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...fade.base, delay: index * stagger.list }}
        >
          {node.type === "file" ? (
            <FileRow
              node={node}
              active={node.id === activeFileId}
              onOpen={onOpenFile}
              onEdit={onEditFile}
            />
          ) : node.type === "folder" ? (
            <>
              <motion.button
                type="button"
                aria-expanded={!closed.has(node.id)}
                onClick={() => {
                  setClosed((current) => {
                    const next = new Set(current);
                    if (next.has(node.id)) next.delete(node.id);
                    else next.add(node.id);
                    return next;
                  });
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
                <span className="truncate type-small">{node.name}</span>
                <Chevron open={!closed.has(node.id)} />
              </motion.button>
              <Disclosure open={!closed.has(node.id)}>
                <Nodes
                  nodes={node.children}
                  depth={depth + 1}
                  activeFileId={activeFileId}
                  assetSize={assetSize}
                  onOpenFile={onOpenFile}
                  onEditFile={onEditFile}
                  onOpenAsset={onOpenAsset}
                  onShowAllAssets={onShowAllAssets}
                />
              </Disclosure>
            </>
          ) : (
            <div className="flex flex-col gap-s py-xs">
              <span className="flex h-6 items-center gap-s px-s type-small text-imagine-foreground-muted">
                <Icon
                  name="image"
                  size="s"
                  className="text-imagine-foreground-faint"
                />
                {node.name}
              </span>
              <AssetGrid
                assets={node.assets}
                limit={assetSize === "sm" ? 2 : 5}
                size={assetSize}
                onSelect={onOpenAsset}
                onShowAll={() => onShowAllAssets?.(node.id)}
                className="px-s"
              />
            </div>
          )}
        </motion.li>
      ))}
    </ul>
  );
}

/**
 * Drive-like tree: an organization section and one per person, each
 * collapsible, with markdown files, folders, and an assets row. Hovering a
 * file reveals edit; the open file carries a left bar.
 */
export function FileTree({
  sections,
  activeFileId,
  onOpenFile,
  onEditFile,
  onOpenAsset,
  onShowAllAssets,
  assetSize = "sm",
  className,
}: FileTreeProps) {
  const [closed, setClosed] = useState<ReadonlySet<string>>(new Set());

  return (
    <div data-slot="file-tree" className={cn("flex flex-col gap-s", className)}>
      {sections.map((section) => {
        const open = !closed.has(section.id);
        return (
          <section key={section.id} className="flex flex-col gap-xxs">
            <motion.button
              type="button"
              aria-expanded={open}
              onClick={() => {
                setClosed((current) => {
                  const next = new Set(current);
                  if (next.has(section.id)) next.delete(section.id);
                  else next.add(section.id);
                  return next;
                });
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
                <Avatar size="sm" className="size-6">
                  {section.avatarUrl ? (
                    <AvatarImage src={section.avatarUrl} alt={section.title} />
                  ) : null}
                  <AvatarFallback className="text-xs">
                    {initials(section.title)}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="truncate type-body font-medium">
                {section.title}
              </span>
              <Chevron open={open} />
            </motion.button>
            <Disclosure open={open}>
              <div className="ml-m border-l border-imagine-border pl-s">
                <Nodes
                  nodes={section.nodes}
                  depth={0}
                  activeFileId={activeFileId}
                  assetSize={assetSize}
                  onOpenFile={onOpenFile}
                  onEditFile={onEditFile}
                  onOpenAsset={onOpenAsset}
                  onShowAllAssets={onShowAllAssets}
                />
              </div>
            </Disclosure>
          </section>
        );
      })}
    </div>
  );
}
