"use client";

import { AnimatePresence, motion } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";

import {
  FileDragSource,
  FileDropTarget,
} from "@/components/features/files/file-drag";
import {
  fileDropBinding,
  type FileMoveDest,
  type FileMoveTargets,
} from "@/components/features/files/file-move";
import {
  searchFiles,
  searchSkills,
  toSearchResults,
} from "@/components/features/files/file-search";
import { useFilesLibrary } from "@/components/features/files/files-library-provider";
import {
  useFilesBrowse,
  useFilesEditor,
} from "@/components/features/files/files-library-state";
import type {
  BrowserItem,
  Filter,
  MediaItem,
  Place,
  Sort,
} from "@/components/features/files/files-library-types";
import {
  LibraryCardDocument,
  LibraryCardFolder,
  LibraryCardMedia,
  LibraryCardMenu,
  LibraryCardMenuDestructiveItem,
  LibraryCardMenuItem,
  LibraryCardMenuSeparator,
  LibraryCardRow,
} from "@/components/features/files/library-card";
import { SectionCrumbLink } from "@/components/features/files/section-crumb";
import { SkillsList } from "@/components/features/files/skills-list";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbMenu,
  type BreadcrumbMenuItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Chip, ChipGroup } from "@/components/ui/chip-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/icon";
import { SearchBox } from "@/components/ui/search-box";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { browseLocation } from "@/lib/files-browser";
import { fade } from "@/styles/motion";

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="type-small font-medium text-imagine-foreground-muted">
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------------ */
/* Cards                                                                    */
/* ------------------------------------------------------------------------ */

/** What every card in the browser can do, supplied by the page. */
interface BrowserApi {
  move: FileMoveTargets;
  press: (item: BrowserItem) => void;
  open: (item: BrowserItem) => void;
  send: (item: BrowserItem) => void;
  rename: (item: BrowserItem) => void;
  remove: (item: BrowserItem) => void;
}

const BrowserContext = createContext<BrowserApi | null>(null);

function useBrowser(): BrowserApi {
  const context = useContext(BrowserContext);
  if (context === null) throw new Error("Cards belong inside FilesLibrary");
  return context;
}

/** Picks the item up to move it somewhere else. */
function MovableItem({
  item,
  children,
}: {
  item: BrowserItem;
  children: ReactNode;
}) {
  const { move } = useBrowser();
  return (
    <FileDragSource
      dragging={move.draggingId === item.id}
      onDragStart={(event) => {
        move.start(item.id, event);
      }}
      onDragEnd={move.end}
      className="min-w-0"
    >
      {children}
    </FileDragSource>
  );
}

/** Catches an item dropped on a library or folder card. */
function ItemDropTarget({
  item,
  dest,
  children,
}: {
  item: BrowserItem;
  dest: FileMoveDest;
  children: ReactNode;
}) {
  const { move } = useBrowser();
  return (
    <FileDropTarget
      {...fileDropBinding(move, dest, item.id)}
      className="min-w-0"
    >
      {children}
    </FileDropTarget>
  );
}

function FolderMenu({ item }: { item: BrowserItem }) {
  const browser = useBrowser();
  return (
    <LibraryCardMenu>
      <LibraryCardMenuItem
        icon="pen"
        onSelect={() => {
          browser.rename(item);
        }}
      >
        Rename
      </LibraryCardMenuItem>
      <LibraryCardMenuSeparator />
      <LibraryCardMenuDestructiveItem
        icon="trash"
        onSelect={() => {
          browser.remove(item);
        }}
      >
        Delete
      </LibraryCardMenuDestructiveItem>
    </LibraryCardMenu>
  );
}

function DocumentMenu({ item }: { item: BrowserItem }) {
  const browser = useBrowser();
  return (
    <LibraryCardMenu>
      <LibraryCardMenuItem
        icon="file-lines"
        onSelect={() => {
          browser.open(item);
        }}
      >
        Open
      </LibraryCardMenuItem>
      <LibraryCardMenuItem
        icon="imagine"
        onSelect={() => {
          browser.send(item);
        }}
      >
        Send to agent
      </LibraryCardMenuItem>
      <LibraryCardMenuItem
        icon="pen"
        onSelect={() => {
          browser.rename(item);
        }}
      >
        Rename
      </LibraryCardMenuItem>
      <LibraryCardMenuSeparator />
      <LibraryCardMenuDestructiveItem
        icon="trash"
        onSelect={() => {
          browser.remove(item);
        }}
      >
        Delete
      </LibraryCardMenuDestructiveItem>
    </LibraryCardMenu>
  );
}

function MediaMenu({ item }: { item: BrowserItem }) {
  const browser = useBrowser();
  return (
    <LibraryCardMenu>
      <LibraryCardMenuItem
        icon="imagine"
        onSelect={() => {
          browser.send(item);
        }}
      >
        Send to agent
      </LibraryCardMenuItem>
      <LibraryCardMenuSeparator />
      <LibraryCardMenuDestructiveItem
        icon="trash"
        onSelect={() => {
          browser.remove(item);
        }}
      >
        Delete
      </LibraryCardMenuDestructiveItem>
    </LibraryCardMenu>
  );
}

/**
 * How an item behaves where it sits, which is the same whichever way the
 * browser draws it: a library at the root takes drops but stays put, a folder
 * inside one also moves, and documents and images only move.
 */
function ItemFrame({
  item,
  place,
  children,
}: {
  item: BrowserItem;
  place: Place;
  children: ReactNode;
}) {
  if (place.kind === "root") {
    return (
      <ItemDropTarget item={item} dest={{ sectionId: item.id }}>
        {children}
      </ItemDropTarget>
    );
  }
  if (item.kind === "folder") {
    return (
      <MovableItem item={item}>
        <ItemDropTarget
          item={item}
          dest={{ sectionId: place.sectionId, folderId: item.id }}
        >
          {children}
        </ItemDropTarget>
      </MovableItem>
    );
  }
  return <MovableItem item={item}>{children}</MovableItem>;
}

/** One card's slot in a group: how it enters, and how it moves. */
function BrowserCell({
  item,
  place,
  children,
}: {
  item: BrowserItem;
  place: Place;
  children: ReactNode;
}) {
  return (
    <StaggerItem>
      <ItemFrame item={item} place={place}>
        {children}
      </ItemFrame>
    </StaggerItem>
  );
}

/** A labelled run of cards, laid out however the view arranges them. */
function CardGroup({
  label,
  arrangement,
  children,
}: {
  label: string;
  arrangement: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-s">
      <GroupLabel>{label}</GroupLabel>
      <Stagger kind="grid" className={arrangement}>
        {children}
      </Stagger>
    </div>
  );
}

interface BrowserContentProps {
  place: Place;
  folders: readonly BrowserItem[];
  docs: readonly BrowserItem[];
  media: readonly MediaItem[];
}

const ROWS = "flex flex-col gap-px";
const TILES =
  "grid grid-cols-[repeat(auto-fill,minmax(min(100%,12rem),1fr))] gap-m";

/** A library at the root has no menu: it is not the user's to change here. */
function foldersLabel(place: Place) {
  return place.kind === "root" ? "Libraries" : "Folders";
}

/** Everything in the open location as one name per line. */
function BrowserRows({ place, folders, docs, media }: BrowserContentProps) {
  const browser = useBrowser();

  return (
    <>
      {folders.length > 0 ? (
        <CardGroup label={foldersLabel(place)} arrangement={ROWS}>
          {folders.map((item) => (
            <BrowserCell key={item.id} item={item} place={place}>
              <LibraryCardRow
                kind="folder"
                name={item.name}
                onPress={() => {
                  browser.press(item);
                }}
              >
                {place.kind === "root" ? null : <FolderMenu item={item} />}
              </LibraryCardRow>
            </BrowserCell>
          ))}
        </CardGroup>
      ) : null}

      {docs.length > 0 ? (
        <CardGroup label="Documents" arrangement={ROWS}>
          {docs.map((item) => (
            <BrowserCell key={item.id} item={item} place={place}>
              <LibraryCardRow
                kind="document"
                name={item.name}
                onPress={() => {
                  browser.press(item);
                }}
              >
                <DocumentMenu item={item} />
              </LibraryCardRow>
            </BrowserCell>
          ))}
        </CardGroup>
      ) : null}

      {media.length > 0 ? (
        <CardGroup label="Images" arrangement={ROWS}>
          {media.map((item) => (
            <BrowserCell key={item.id} item={item} place={place}>
              <LibraryCardRow
                kind={item.kind}
                name={item.name}
                onPress={() => {
                  browser.press(item);
                }}
              >
                <MediaMenu item={item} />
              </LibraryCardRow>
            </BrowserCell>
          ))}
        </CardGroup>
      ) : null}
    </>
  );
}

/** Everything in the open location as cards with a face. */
function BrowserTiles({ place, folders, docs, media }: BrowserContentProps) {
  const browser = useBrowser();

  return (
    <>
      {folders.length > 0 ? (
        <CardGroup label={foldersLabel(place)} arrangement={TILES}>
          {folders.map((item) => (
            <BrowserCell key={item.id} item={item} place={place}>
              <LibraryCardFolder
                name={item.name}
                onPress={() => {
                  browser.press(item);
                }}
              >
                {place.kind === "root" ? null : <FolderMenu item={item} />}
              </LibraryCardFolder>
            </BrowserCell>
          ))}
        </CardGroup>
      ) : null}

      {docs.length > 0 ? (
        <CardGroup label="Documents" arrangement={TILES}>
          {docs.map((item) => (
            <BrowserCell key={item.id} item={item} place={place}>
              <LibraryCardDocument
                name={item.name}
                {...(item.excerpt === undefined
                  ? {}
                  : { excerpt: item.excerpt })}
                onPress={() => {
                  browser.press(item);
                }}
              >
                <DocumentMenu item={item} />
              </LibraryCardDocument>
            </BrowserCell>
          ))}
        </CardGroup>
      ) : null}

      {media.length > 0 ? (
        <CardGroup label="Images" arrangement={TILES}>
          {media.map((item) => (
            <BrowserCell key={item.id} item={item} place={place}>
              <LibraryCardMedia
                kind={item.kind}
                name={item.name}
                {...(item.src === undefined ? {} : { src: item.src })}
                onPress={() => {
                  browser.press(item);
                }}
              >
                <MediaMenu item={item} />
              </LibraryCardMedia>
            </BrowserCell>
          ))}
        </CardGroup>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Shared frame: one location, said in the breadcrumb and drawn below it    */
/* ------------------------------------------------------------------------ */

function BrowserFrame({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="Browser"
      // The page's inset: on a wide frame the browser is a centered column.
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-m px-page pt-l pb-l md:pt-xl md:pb-xxl"
    >
      {children}
    </section>
  );
}

function BrowserHeader({ children }: { children: ReactNode }) {
  return (
    <header className="flex min-h-9 shrink-0 flex-wrap items-center gap-s">
      {children}
    </header>
  );
}

/** On a phone the rail is a drawer, and this is the way to it. */
function BrowserNavButton() {
  const { navOpen, openNav } = useFilesBrowse();
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="Browse files"
      aria-expanded={navOpen}
      onClick={openNav}
      className="md:hidden"
    >
      <Icon name="sidebar" />
    </Button>
  );
}

/** Whatever is below the header; its child crossfades when the place does. */
function BrowserBody({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-0 flex-1">
      <AnimatePresence initial={false} mode="wait">
        {children}
      </AnimatePresence>
    </div>
  );
}

const PANEL = "absolute inset-0 flex flex-col gap-xl overflow-y-auto pb-xxl";

function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-s text-center">
      <span className="flex size-10 items-center justify-center rounded-panel bg-imagine-surface-raised text-imagine-foreground-muted">
        <Icon name={icon} size="l" />
      </span>
      <p className="type-small font-medium">{title}</p>
      <p className="max-w-xs type-small text-imagine-foreground-muted">
        {body}
      </p>
      {action === undefined ? null : <div className="pt-xs">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* The files view                                                           */
/* ------------------------------------------------------------------------ */

const FILTERS: readonly { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "documents", label: "Documents" },
  { value: "images", label: "Images" },
];

const SORTS: readonly { value: Sort; label: string }[] = [
  { value: "name-asc", label: "Name, A to Z" },
  { value: "name-desc", label: "Name, Z to A" },
];

const SORT_SHORT: Record<Sort, string> = {
  "name-asc": "Name, A–Z",
  "name-desc": "Name, Z–A",
};

function isFilter(value: string): value is Filter {
  return FILTERS.some((entry) => entry.value === value);
}

function isSort(value: string): value is Sort {
  return SORTS.some((entry) => entry.value === value);
}

/** Where you are, and the way to switch libraries or folders in place. */
function FilesCrumbs() {
  const { sections, currentSection, currentFolder, moveTargets } =
    useFilesLibrary();
  const { place, goTo } = useFilesBrowse();

  const libraryMenu: readonly BreadcrumbMenuItem[] = sections.map(
    (section) => ({
      id: section.id,
      label: section.title,
      icon: section.kind === "person" ? "user" : "building",
    }),
  );
  const folderMenu: readonly BreadcrumbMenuItem[] =
    currentSection === undefined
      ? []
      : currentSection.nodes.flatMap((node) =>
          node.type === "folder"
            ? [{ id: node.id, label: node.name, icon: "folder" as const }]
            : [],
        );

  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbItem>
        {place.kind === "root" ? (
          <BreadcrumbPage>Files</BreadcrumbPage>
        ) : (
          <BreadcrumbLink
            onClick={() => {
              goTo({ kind: "root" });
            }}
          >
            Files
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
      {currentSection !== undefined ? (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {currentFolder === undefined ? (
              <BreadcrumbPage>{currentSection.title}</BreadcrumbPage>
            ) : (
              <SectionCrumbLink
                section={currentSection}
                onSelect={() => {
                  goTo({
                    kind: "library",
                    sectionId: currentSection.id,
                  });
                }}
                {...fileDropBinding(
                  moveTargets,
                  { sectionId: currentSection.id },
                  `crumb:${currentSection.id}`,
                )}
              />
            )}
            {currentFolder === undefined ? (
              <BreadcrumbMenu
                label="Switch library"
                items={libraryMenu}
                selectedId={currentSection.id}
                onSelect={(id) => {
                  goTo({ kind: "library", sectionId: id });
                }}
              />
            ) : null}
          </BreadcrumbItem>
        </>
      ) : null}
      {currentSection !== undefined && currentFolder !== undefined ? (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentFolder.name}</BreadcrumbPage>
            {folderMenu.length > 1 ? (
              <BreadcrumbMenu
                label="Switch folder"
                items={folderMenu}
                selectedId={currentFolder.id}
                onSelect={(id) => {
                  goTo({
                    kind: "library",
                    sectionId: currentSection.id,
                    folderId: id,
                  });
                }}
              />
            ) : null}
          </BreadcrumbItem>
        </>
      ) : null}
    </Breadcrumb>
  );
}

/** Search looks across the whole library, folders included, not just the
 * open folder. Same dropdown the calendar uses; a click opens the hit. */
function FilesSearch() {
  const { sections, currentSection, openResult } = useFilesLibrary();
  const { place, query, setQuery } = useFilesBrowse();

  const results = toSearchResults(
    searchFiles(
      place.kind === "library" && currentSection !== undefined
        ? [currentSection]
        : sections,
      query,
      { includeFolders: true },
    ),
  );

  return (
    <SearchBox
      value={query}
      onValueChange={setQuery}
      results={results}
      onSelect={openResult}
      placeholder={`Search in ${currentSection?.title ?? "all files"}`}
      emptyLabel={`Nothing matches “${query.trim()}”`}
      listLabel="Files"
      className="w-full min-w-0 sm:w-64 sm:shrink-0"
    />
  );
}

function FilesViewToggle() {
  const { view, setView } = useFilesBrowse();
  return (
    <ToggleGroup
      size="sm"
      value={view}
      onValueChange={(next) => {
        if (next === "grid" || next === "list") setView(next);
      }}
      aria-label="Layout"
      className="shrink-0"
    >
      <ToggleGroupItem value="list" aria-label="List">
        <Icon name="list" size="s" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="Grid">
        <Icon name="grip" size="s" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

function FilesArrangement() {
  const { filter, sort, setFilter, setSort } = useFilesBrowse();
  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-s">
      <ChipGroup
        value={filter}
        onValueChange={(next) => {
          if (isFilter(next)) setFilter(next);
        }}
        aria-label="Filter"
      >
        {FILTERS.map((entry) => (
          <Chip key={entry.value} value={entry.value}>
            {entry.label}
          </Chip>
        ))}
      </ChipGroup>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="shrink-0 text-imagine-foreground-muted data-open:text-imagine-foreground"
          >
            {SORT_SHORT[sort]}
            <Icon name="chevron-down" size="s" data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(next) => {
              if (isSort(next)) setSort(next);
            }}
          >
            {SORTS.map((entry) => (
              <DropdownMenuRadioItem key={entry.value} value={entry.value}>
                {entry.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function FilesPanel() {
  const library = useFilesLibrary();
  const { place, filter, sort, view, setFilter } = useFilesBrowse();
  const { shown, folders, docs, media } = browseLocation(
    place,
    library.sections,
    { filter, sort },
  );

  const browser: BrowserApi = {
    move: library.moveTargets,
    press: library.press,
    open: (item) => {
      library.open(item.id);
    },
    send: library.sendItem,
    rename: library.askRename,
    remove: library.askRemove,
  };

  if (shown.length === 0 && !(library.canCreate && filter === "all")) {
    return (
      <EmptyState
        icon={filter === "images" ? "image" : "folder"}
        title={filter === "all" ? "Nothing here" : `No ${filter} here`}
        body="Try another filter, or look in a different folder."
        {...(filter !== "all"
          ? {
              action: (
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    setFilter("all");
                  }}
                >
                  Show everything
                </Button>
              ),
            }
          : {})}
      />
    );
  }

  return (
    <BrowserContext value={browser}>
      {view === "list" ? (
        <BrowserRows
          place={place}
          folders={folders}
          docs={docs}
          media={media}
        />
      ) : (
        <BrowserTiles
          place={place}
          folders={folders}
          docs={docs}
          media={media}
        />
      )}

      {shown.length === 0 && library.canCreate ? (
        <p className="px-xs type-small text-imagine-foreground-muted">
          Nothing in {library.locationTitle} yet. Use New to add a document or
          folder.
        </p>
      ) : null}
    </BrowserContext>
  );
}

/* ------------------------------------------------------------------------ */
/* The skills view                                                          */
/* ------------------------------------------------------------------------ */

function SkillsCrumb() {
  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbItem>
        <BreadcrumbPage>Skills</BreadcrumbPage>
      </BreadcrumbItem>
    </Breadcrumb>
  );
}

function SkillsSearch() {
  const { skills, open } = useFilesLibrary();
  const { query, setQuery } = useFilesBrowse();
  const results = toSearchResults(searchSkills(skills, query));

  return (
    <SearchBox
      value={query}
      onValueChange={setQuery}
      results={results}
      onSelect={(id) => {
        setQuery("");
        open(id);
      }}
      placeholder="Search in skills"
      emptyLabel={`Nothing matches “${query.trim()}”`}
      listLabel="Files"
      className="w-full min-w-0 sm:w-64 sm:shrink-0"
    />
  );
}

/** Skills are instructions rather than files, so the tab reads as a list. */
function SkillsPanel() {
  const { skills, toggleSkill, open } = useFilesLibrary();
  const { documentId } = useFilesEditor();

  return (
    <>
      <p className="type-small text-imagine-foreground-muted">
        Skills are instructions the agent follows. Switch one off to pause it,
        or open its file to change what it does.
      </p>
      <SkillsList
        skills={skills}
        {...(documentId === undefined ? {} : { openSkillId: documentId })}
        onToggle={toggleSkill}
        onOpenFile={open}
      />
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* The browser, assembled                                                   */
/* ------------------------------------------------------------------------ */

/** One key per place, so moving somewhere else crossfades the body. */
function useFilesPanelKey() {
  const { currentSection, currentFolder } = useFilesLibrary();
  const { place, filter, view } = useFilesBrowse();
  return `${place.kind}:${currentSection?.id ?? ""}:${currentFolder?.id ?? ""}:${filter}:${view}`;
}

/**
 * The browser beside the rail: one location shown as folders, documents, and
 * images, over a breadcrumb that always says where you are.
 */
export function FilesLibraryBrowser() {
  const { tab } = useFilesBrowse();
  const filesPanelKey = useFilesPanelKey();

  return (
    <BrowserFrame>
      {tab === "files" ? (
        <>
          <BrowserHeader key="header">
            <BrowserNavButton />
            <FilesCrumbs />
            <FilesSearch />
            <FilesViewToggle />
          </BrowserHeader>
          <FilesArrangement key="arrangement" />
          <BrowserBody key="body">
            <motion.div
              key={filesPanelKey}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={fade.fast}
              className={PANEL}
            >
              <FilesPanel />
            </motion.div>
          </BrowserBody>
        </>
      ) : (
        <>
          <BrowserHeader key="header">
            <BrowserNavButton />
            <SkillsCrumb />
            <SkillsSearch />
          </BrowserHeader>
          <BrowserBody key="body">
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={fade.fast}
              className={PANEL}
            >
              <SkillsPanel />
            </motion.div>
          </BrowserBody>
        </>
      )}
    </BrowserFrame>
  );
}
