"use client";

import { cn } from "cn";
import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { MovableFileTreeNav } from "@/components/features/files/file-tree-nav";
import { useFilesLibrary } from "@/components/features/files/files-library-provider";
import {
  useFilesBrowse,
  useFilesEditor,
} from "@/components/features/files/files-library-state";
import { NewMenu } from "@/components/features/files/new-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResizable } from "@/lib/use-resizable";
import { fade } from "@/styles/motion";

/* ------------------------------------------------------------------------ */
/* Parts                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * The rail beside the browser: full height, page-white, a rule against the
 * browser. On a phone it is a drawer over the page, dismissed by the scrim.
 */
function NavFrame({ children }: { children: ReactNode }) {
  const { navOpen, isMobile, closeNav } = useFilesBrowse();
  const resize = useResizable({
    defaultWidth: 256,
    min: 208,
    max: 420,
    edge: "end",
  });

  return (
    <>
      {navOpen ? (
        <button
          type="button"
          aria-label="Close files navigation"
          className="absolute inset-0 z-20 bg-imagine-foreground/10 md:hidden"
          onClick={closeNav}
        />
      ) : null}
      <aside
        aria-label="Files navigation"
        style={isMobile ? undefined : { width: resize.width }}
        className={cn(
          "relative flex h-full shrink-0 flex-col gap-m border-r border-imagine-border bg-imagine-surface px-s pt-l pb-s",
          "max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:shadow-floating",
          !navOpen && "max-md:hidden",
        )}
      >
        <ResizeHandle
          edge="end"
          binding={resize.handle}
          dragging={resize.dragging}
          label="Resize files sidebar"
          className="max-md:hidden"
        />
        {children}
      </aside>
    </>
  );
}

function NavTabs() {
  const { tab, setTab } = useFilesBrowse();
  return (
    <Tabs
      variant="line"
      value={tab}
      onValueChange={(next) => {
        if (next !== "files" && next !== "skills") return;
        setTab(next);
      }}
      className="px-xs"
    >
      <TabsList>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="skills">Skills</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/** The scrolling half of the rail; its child crossfades when the tab does. */
function NavBody({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <AnimatePresence initial={false} mode="wait">
        {children}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* The files rail                                                           */
/* ------------------------------------------------------------------------ */

function NewFileMenu() {
  const { canCreate, createDocument, askNewFolder } = useFilesLibrary();
  return (
    <NewMenu
      disabled={!canCreate}
      onIntent={(intent) => {
        if (intent === "folder") askNewFolder();
        else createDocument();
      }}
    />
  );
}

function FileTreeRail() {
  const { sections, open } = useFilesLibrary();
  const { place, goToLocation } = useFilesBrowse();
  const { documentId } = useFilesEditor();

  const selectedId =
    documentId ??
    (place.kind === "library"
      ? (place.folderId ?? place.sectionId)
      : undefined);

  return (
    <MovableFileTreeNav
      sections={sections}
      {...(selectedId === undefined ? {} : { selectedId })}
      onSelectLocation={goToLocation}
      onOpenFile={open}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* The skills rail                                                          */
/* ------------------------------------------------------------------------ */

function NewSkillButton() {
  return (
    <Button
      size="sm"
      className="w-full"
      onClick={() => {
        toast("New skills are not part of this prototype");
      }}
    >
      <Icon name="plus" size="s" data-icon="inline-start" />
      New skill
    </Button>
  );
}

function SkillsRail() {
  const { skills, open } = useFilesLibrary();
  const { documentId } = useFilesEditor();

  return (
    <>
      {skills.map((skill) => {
        const selected = documentId === skill.id;
        return (
          <button
            key={skill.id}
            type="button"
            aria-current={selected ? "location" : undefined}
            onClick={() => {
              open(skill.id);
            }}
            className={cn(
              "flex h-8 w-full items-center gap-xs rounded-control pr-s pl-xs text-left transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40",
              selected
                ? "bg-imagine-foreground/8 text-imagine-foreground"
                : "text-imagine-foreground-muted hover:bg-imagine-foreground/5 hover:text-imagine-foreground",
            )}
          >
            <span className="flex size-6 shrink-0 items-center justify-center">
              <Icon name="puzzle-piece" size="s" />
            </span>
            <span
              className={cn(
                "min-w-0 flex-1 truncate type-small",
                selected ? "font-semibold" : "font-medium",
              )}
            >
              {skill.name}
            </span>
            {skill.enabled ? null : <Badge variant="soft">Off</Badge>}
          </button>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* The rail, assembled                                                      */
/* ------------------------------------------------------------------------ */

export function FilesLibraryNav() {
  const { tab } = useFilesBrowse();

  return (
    <NavFrame>
      <NavTabs />
      {tab === "files" ? (
        <>
          <NewFileMenu key="action" />
          <NavBody key="body">
            <motion.div
              key="tree"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.fast}
              className="flex flex-col gap-s"
            >
              <FileTreeRail />
            </motion.div>
          </NavBody>
        </>
      ) : (
        <>
          <NewSkillButton key="action" />
          <NavBody key="body">
            <motion.div
              key="skills"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fade.fast}
              className="flex flex-col gap-px"
            >
              <SkillsRail />
            </motion.div>
          </NavBody>
        </>
      )}
    </NavFrame>
  );
}
