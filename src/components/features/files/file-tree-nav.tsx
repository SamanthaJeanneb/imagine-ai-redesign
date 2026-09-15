"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

import {
  FileDragSource,
  FileDropTarget,
  useFileDrag,
  useFileDrop,
} from "@/components/features/files/file-drag";
import type { FileSection } from "@/components/features/files/file-tree";
import {
  useFileMoveTargets,
  type FileMoveDest,
  type FileMoveTargets,
} from "@/components/features/files/file-move";
import { Disclosure } from "@/components/motion/disclosure";
import { Icon } from "@/components/ui/icon";
import { PersonAvatar } from "@/components/ui/person-avatar";
import type { FileNode } from "@/entities/files";
import { fade, pressRow, spring, stagger } from "@/styles/motion";

/** Where the browser should go: a library, or a folder inside one. */
export interface TreeLocation {
  sectionId: string;
  folderId?: string;
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
      <PersonAvatar
        name={section.title}
        {...(section.avatarUrl === undefined
          ? {}
          : { avatarUrl: section.avatarUrl })}
        size="sm"
        className="size-5 text-xs"
      />
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

/* ------------------------------------------------------------------------ */
/* State: which rows are open, and which is selected                        */
/* ------------------------------------------------------------------------ */

interface TreeNavState {
  selectedId: string | undefined;
  indicatorId: string;
  isOpen: (id: string) => boolean;
  toggle: (id: string) => void;
}

const TreeNavContext = createContext<TreeNavState | null>(null);

function useTreeNav(part: string): TreeNavState {
  const context = useContext(TreeNavContext);
  if (context === null) {
    throw new Error(`${part} must be rendered inside TreeNav`);
  }
  return context;
}

/**
 * The rail's tree frame. The path to the selection is held open unless the
 * user has closed it themselves; other rows open on demand.
 */
function TreeNav({
  sections,
  selectedId,
  className,
  children,
}: {
  sections: readonly FileSection[];
  /** The highlighted row: the open document, else the browsed location. */
  selectedId?: string;
  className?: string;
  children: ReactNode;
}) {
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
    <TreeNavContext value={{ selectedId, indicatorId, isOpen, toggle }}>
      <nav
        aria-label="Libraries"
        data-slot="file-tree-nav"
        className={cn("flex flex-col gap-px", className)}
      >
        {children}
      </nav>
    </TreeNavContext>
  );
}

/* ------------------------------------------------------------------------ */
/* Rows                                                                     */
/* ------------------------------------------------------------------------ */

/**
 * One line of the tree. The label and any trailing chevron are separate
 * buttons so a folder can be opened to look inside without becoming the
 * location.
 */
function Row({
  selected,
  onClick,
  leading,
  label,
  emphasis = false,
  trailing,
}: {
  selected: boolean;
  onClick: () => void;
  leading: ReactNode;
  label: string;
  emphasis?: boolean;
  trailing?: ReactNode;
}) {
  const { indicatorId } = useTreeNav("TreeNav row");
  const drag = useFileDrag();
  const dropActive = useFileDrop()?.active ?? false;

  return (
    <div
      data-selected={selected || undefined}
      className={cn(
        "group/row relative flex h-8 items-center rounded-control pl-xs transition-colors",
        trailing === undefined && "pr-xs",
        selected
          ? "text-imagine-foreground"
          : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
        dropActive &&
          "bg-imagine-secondary-soft text-imagine-secondary hover:bg-imagine-secondary-soft hover:text-imagine-secondary",
      )}
    >
      {selected ? (
        <motion.span
          layoutId={indicatorId}
          layoutDependency={label}
          aria-hidden="true"
          transition={spring.snappy}
          className="absolute inset-0 rounded-control bg-imagine-foreground/8"
        />
      ) : null}
      <motion.button
        type="button"
        aria-current={selected ? "location" : undefined}
        // Some browsers only start a drag from the element under the pointer.
        draggable={drag === null ? undefined : true}
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
      {trailing}
    </div>
  );
}

/** The chevron at a container row's end; points down when open. */
function Toggle({ id, label }: { id: string; label: string }) {
  const { isOpen, toggle } = useTreeNav("TreeNav toggle");
  const open = isOpen(id);
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      onClick={() => {
        toggle(id);
      }}
      className="relative z-10 flex h-full w-7 shrink-0 items-center justify-center rounded-xs text-imagine-foreground-faint outline-none hover:text-imagine-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      <motion.span
        animate={{ rotate: open ? 180 : 0 }}
        transition={spring.snappy}
        className="flex"
      >
        <Icon name="chevron-down" size="s" />
      </motion.span>
    </button>
  );
}

/** A library's row: its mark, its name in bold, and a chevron. */
function TreeNavSection({
  section,
  onSelect,
}: {
  section: FileSection;
  onSelect: () => void;
}) {
  const { selectedId } = useTreeNav("TreeNavSection");
  return (
    <Row
      selected={section.id === selectedId}
      onClick={onSelect}
      leading={<SectionMark section={section} />}
      label={section.title}
      emphasis
      trailing={<Toggle id={section.id} label={section.title} />}
    />
  );
}

/** A folder's row: the folder mark reflects whether it is open. */
function TreeNavFolder({
  id,
  name,
  onSelect,
}: {
  id: string;
  name: string;
  onSelect: () => void;
}) {
  const { selectedId, isOpen } = useTreeNav("TreeNavFolder");
  return (
    <Row
      selected={id === selectedId}
      onClick={onSelect}
      leading={<Icon name={isOpen(id) ? "folder-open" : "folder"} size="s" />}
      label={name}
      trailing={<Toggle id={id} label={name} />}
    />
  );
}

/** A document's row. Opens on click. */
function TreeNavFile({
  id,
  name,
  onOpen,
}: {
  id: string;
  name: string;
  onOpen: () => void;
}) {
  const { selectedId } = useTreeNav("TreeNavFile");
  return (
    <Row
      selected={id === selectedId}
      onClick={onOpen}
      leading={<Icon name="file-lines" size="s" />}
      label={name}
    />
  );
}

/** What sits under a section or folder row; folds with it. */
function TreeNavBranch({ id, children }: { id: string; children: ReactNode }) {
  const { isOpen } = useTreeNav("TreeNavBranch");
  return <Disclosure open={isOpen(id)}>{children}</Disclosure>;
}

/** The rows under one parent, indented behind a guide line. */
function TreeNavList({ children }: { children: ReactNode }) {
  return (
    <ul className="ml-l flex flex-col gap-px border-l border-imagine-border pl-s">
      {children}
    </ul>
  );
}

/** One row's slot in a `TreeNavList`; enters staggered by its position. */
function TreeNavItem({
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

/* ------------------------------------------------------------------------ */
/* Assembled trees                                                          */
/* ------------------------------------------------------------------------ */

interface TreeNavActions {
  onSelectLocation: (location: TreeLocation) => void;
  onOpenFile: (id: string) => void;
}

interface FileTreeNavProps extends TreeNavActions {
  sections: readonly FileSection[];
  selectedId?: string;
  className?: string;
}

/** Folders and files only; asset rows belong to the browser, not the rail. */
function browsable(nodes: readonly FileNode[]) {
  return nodes.filter((node) => node.type !== "assets");
}

const BrowseContext = createContext<TreeNavActions | null>(null);

function useBrowse() {
  const context = useContext(BrowseContext);
  if (context === null) throw new Error("Missing FileTreeNav");
  return context;
}

function BrowseBranch({
  sectionId,
  nodes,
}: {
  sectionId: string;
  nodes: readonly FileNode[];
}) {
  const actions = useBrowse();
  const visible = browsable(nodes);
  if (visible.length === 0) return null;
  return (
    <TreeNavList>
      {visible.map((node, index) => (
        <TreeNavItem key={node.id} index={index}>
          {node.type === "folder" ? (
            <>
              <TreeNavFolder
                id={node.id}
                name={node.name}
                onSelect={() => {
                  actions.onSelectLocation({ sectionId, folderId: node.id });
                }}
              />
              <TreeNavBranch id={node.id}>
                <BrowseBranch sectionId={sectionId} nodes={node.children} />
              </TreeNavBranch>
            </>
          ) : (
            <TreeNavFile
              id={node.id}
              name={node.name}
              onOpen={() => {
                actions.onOpenFile(node.id);
              }}
            />
          )}
        </TreeNavItem>
      ))}
    </TreeNavList>
  );
}

/**
 * The rail's tree. Libraries at the top level, folders and documents below.
 * Rows are for getting somewhere: a library or folder becomes the browser's
 * location, a document opens.
 */
export function FileTreeNav({
  sections,
  selectedId,
  onSelectLocation,
  onOpenFile,
  className,
}: FileTreeNavProps) {
  return (
    <BrowseContext value={{ onSelectLocation, onOpenFile }}>
      <TreeNav
        sections={sections}
        {...(selectedId === undefined ? {} : { selectedId })}
        {...(className === undefined ? {} : { className })}
      >
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-px">
            <TreeNavSection
              section={section}
              onSelect={() => {
                onSelectLocation({ sectionId: section.id });
              }}
            />
            <TreeNavBranch id={section.id}>
              <BrowseBranch sectionId={section.id} nodes={section.nodes} />
            </TreeNavBranch>
          </div>
        ))}
      </TreeNav>
    </BrowseContext>
  );
}

/* --- With moving ------------------------------------------------------- */

function destKey(dest: FileMoveDest): string {
  return dest.folderId ?? dest.sectionId;
}

const MoveContext = createContext<
  (TreeNavActions & { move: FileMoveTargets }) | null
>(null);

function useMove() {
  const context = useContext(MoveContext);
  if (context === null) throw new Error("Missing MovableFileTreeNav");
  return context;
}

/** Catches a drop on a library or folder row. */
function MoveDropTarget({
  dest,
  children,
}: {
  dest: FileMoveDest;
  children: ReactNode;
}) {
  const { move } = useMove();
  const key = destKey(dest);
  return (
    <FileDropTarget
      active={move.dropKey === key}
      onDragOver={(event) => {
        move.over(dest, key, event);
      }}
      onDragLeave={(event) => {
        move.leave(key, event);
      }}
      onDrop={(event) => {
        move.drop(dest, event);
      }}
    >
      {children}
    </FileDropTarget>
  );
}

/** Lets a folder or file row be picked up. */
function MoveSource({ id, children }: { id: string; children: ReactNode }) {
  const { move } = useMove();
  return (
    <FileDragSource
      dragging={move.draggingId === id}
      onDragStart={(event) => {
        move.start(id, event);
      }}
      onDragEnd={move.end}
      className="transition-opacity data-dragging:opacity-40"
    >
      {children}
    </FileDragSource>
  );
}

function MoveBranch({
  sectionId,
  nodes,
}: {
  sectionId: string;
  nodes: readonly FileNode[];
}) {
  const actions = useMove();
  const visible = browsable(nodes);
  if (visible.length === 0) return null;
  return (
    <TreeNavList>
      {visible.map((node, index) => (
        <TreeNavItem key={node.id} index={index}>
          {node.type === "folder" ? (
            <>
              <MoveSource id={node.id}>
                <MoveDropTarget dest={{ sectionId, folderId: node.id }}>
                  <TreeNavFolder
                    id={node.id}
                    name={node.name}
                    onSelect={() => {
                      actions.onSelectLocation({
                        sectionId,
                        folderId: node.id,
                      });
                    }}
                  />
                </MoveDropTarget>
              </MoveSource>
              <TreeNavBranch id={node.id}>
                <MoveBranch sectionId={sectionId} nodes={node.children} />
              </TreeNavBranch>
            </>
          ) : (
            <MoveSource id={node.id}>
              <TreeNavFile
                id={node.id}
                name={node.name}
                onOpen={() => {
                  actions.onOpenFile(node.id);
                }}
              />
            </MoveSource>
          )}
        </TreeNavItem>
      ))}
    </TreeNavList>
  );
}

/**
 * The library's rail: `FileTreeNav`, plus every folder and file can be
 * dragged onto a library or folder to move it there.
 */
export function MovableFileTreeNav({
  sections,
  selectedId,
  onSelectLocation,
  onOpenFile,
  onMoveFile,
  className,
}: FileTreeNavProps & {
  /** Drop a dragged item onto a library or folder to move it. */
  onMoveFile: (id: string, dest: FileMoveDest) => void;
}) {
  const move = useFileMoveTargets(sections, onMoveFile);

  return (
    <MoveContext value={{ onSelectLocation, onOpenFile, move }}>
      <TreeNav
        sections={sections}
        {...(selectedId === undefined ? {} : { selectedId })}
        {...(className === undefined ? {} : { className })}
      >
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-px">
            <MoveDropTarget dest={{ sectionId: section.id }}>
              <TreeNavSection
                section={section}
                onSelect={() => {
                  onSelectLocation({ sectionId: section.id });
                }}
              />
            </MoveDropTarget>
            <TreeNavBranch id={section.id}>
              <MoveBranch sectionId={section.id} nodes={section.nodes} />
            </TreeNavBranch>
          </div>
        ))}
      </TreeNav>
    </MoveContext>
  );
}
