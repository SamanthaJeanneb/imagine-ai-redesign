"use client";

import { cn } from "cn";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { findFolder } from "@/components/features/files/file-tree-ops";
import { useFilesLibrary } from "@/components/features/files/files-library-provider";
import {
  useFilesBrowse,
  useFilesEditor,
} from "@/components/features/files/files-library-state";
import { MarkdownEditor } from "@/components/features/files/markdown-editor";
import { SectionCrumbLink } from "@/components/features/files/section-crumb";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { ResizeHandle } from "@/components/ui/resize-handle";
import { useResizable } from "@/lib/use-resizable";
import type { OpenDocument } from "@/services/files";
import { fade } from "@/styles/motion";

/** Where the open document lives, so the sheet can say and offer the way back. */
function DocumentLocation({ openDocument }: { openDocument: OpenDocument }) {
  const library = useFilesLibrary();
  const browse = useFilesBrowse();
  const at = library.home.get(openDocument.id);
  const section =
    at === undefined ? undefined : library.sectionById.get(at.sectionId);
  const folder =
    at?.folderId === undefined || section === undefined
      ? undefined
      : findFolder(section.nodes, at.folderId);

  if (at === undefined) {
    return (
      <BreadcrumbItem>
        <BreadcrumbPage>Skills</BreadcrumbPage>
      </BreadcrumbItem>
    );
  }

  return (
    <>
      <BreadcrumbItem>
        <BreadcrumbLink
          onClick={() => {
            browse.setTab("files");
            browse.goTo({ kind: "root" });
          }}
        >
          Files
        </BreadcrumbLink>
      </BreadcrumbItem>
      {section === undefined ? null : (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {folder === undefined ? (
              <BreadcrumbPage>{section.title}</BreadcrumbPage>
            ) : (
              <SectionCrumbLink
                section={section}
                onSelect={() => {
                  browse.setTab("files");
                  browse.goTo({ kind: "library", sectionId: section.id });
                }}
              />
            )}
          </BreadcrumbItem>
        </>
      )}
      {folder === undefined || section === undefined ? null : (
        <>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{folder.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </>
      )}
    </>
  );
}

/**
 * The document editor: a modal sheet over the browser. On a phone it rises
 * from the bottom; on a wider frame it slides in from the right, framed the
 * way a page is (rounded left corners on a dimmed backdrop). The scrim,
 * Escape, and the close button all put the browser back.
 */
export function FilesLibraryEditor() {
  const { documentById, send } = useFilesLibrary();
  const { isMobile } = useFilesBrowse();
  const { documentId, drafts, close, sheetHost } = useFilesEditor();
  const reduceMotion = useReducedMotion();
  // Wide by default: it is a page, not a side panel.
  const resize = useResizable({
    defaultWidth: 880,
    min: 560,
    max: 1280,
    edge: "start",
  });

  const openDocument =
    documentId === undefined ? undefined : documentById.get(documentId);

  return (
    // Not modal: the sheet covers the browser, but the tree beside it stays
    // live so the reader can switch documents without putting this one away.
    <Dialog
      modal={false}
      open={openDocument !== undefined}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        data-slot="files-editor"
        aria-describedby={undefined}
        container={sheetHost}
        overlayClassName="absolute z-20 bg-imagine-foreground/10 supports-backdrop-filter:backdrop-blur-none"
        // Only the dimmed browser behind the sheet puts it away. A press on
        // the tree is a press on another document, and swaps this one out.
        onInteractOutside={(event) => {
          const target = event.target;
          if (target instanceof Node && sheetHost?.contains(target) === true) {
            close();
            return;
          }
          event.preventDefault();
        }}
        style={isMobile ? undefined : { width: resize.width }}
        className={cn(
          "absolute inset-y-0 right-0 left-auto z-20 flex h-full w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-imagine-surface p-0 text-imagine-foreground shadow-raised duration-200 sm:max-w-full",
          "max-md:inset-x-0 max-md:inset-y-auto max-md:bottom-0 max-md:h-[calc(100%-var(--spacing-l))] max-md:rounded-t-surface",
          "md:rounded-l-surface",
          // The sheet's own entrance replaces the dialog's zoom.
          "data-open:zoom-in-100 data-closed:zoom-out-100",
          reduceMotion
            ? null
            : isMobile
              ? "data-open:slide-in-from-bottom-full data-closed:slide-out-to-bottom-full"
              : "data-open:slide-in-from-right-full data-closed:slide-out-to-right-full",
        )}
      >
        {openDocument === undefined ? null : (
          <>
            <DialogTitle className="sr-only">
              {openDocument.meta.title}
            </DialogTitle>
            <ResizeHandle
              edge="start"
              binding={resize.handle}
              dragging={resize.dragging}
              label="Resize editor"
              className="max-md:hidden"
            />
            <div
              aria-hidden
              className="flex shrink-0 justify-center pt-s md:hidden"
            >
              <span className="h-1 w-10 rounded-full bg-imagine-border" />
            </div>
            {/* Where the document lives, and the way out. Stays put while
              the page below scrolls. */}
            <div className="flex shrink-0 items-center gap-s px-l pt-s md:px-xxl md:pt-xl">
              <Breadcrumb
                aria-label="Document location"
                className="min-w-0 flex-1"
              >
                <DocumentLocation openDocument={openDocument} />
              </Breadcrumb>
              <Button
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => {
                  send({
                    kind: "file",
                    file: {
                      id: openDocument.id,
                      title: openDocument.meta.title,
                    },
                  });
                }}
              >
                <Icon name="imagine" size="s" data-icon="inline-start" />
                Send to agent
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Close editor"
                onClick={close}
                className="-mr-xs shrink-0 text-imagine-foreground-muted hover:text-imagine-foreground"
              >
                <Icon name="xmark" size="s" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-l pt-l pb-l md:px-xxl md:pt-xl md:pb-xxl">
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  key={openDocument.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={fade.fast}
                  className="w-full"
                >
                  <MarkdownEditor
                    meta={openDocument.meta}
                    value={drafts.valueOf(openDocument)}
                    savedValue={drafts.savedValueOf(openDocument)}
                    onValueChange={(value) => {
                      drafts.change(openDocument, value);
                    }}
                    onSave={() => {
                      drafts.save(openDocument);
                    }}
                    className="mx-auto max-w-3xl"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** An image or video from the browser, shown full size. */
export function FilesLibraryPreview() {
  const { assetById, askRemove, send } = useFilesLibrary();
  const { previewId, closePreview } = useFilesEditor();

  const asset = previewId === undefined ? undefined : assetById.get(previewId);

  return (
    <Dialog
      open={asset !== undefined}
      onOpenChange={(next) => {
        if (!next) closePreview();
      }}
    >
      <DialogContent className="gap-m sm:max-w-2xl">
        {asset === undefined ? null : (
          <>
            <DialogHeader>
              <DialogTitle className="truncate">
                {asset.caption ?? "Untitled image"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {asset.kind === "video" ? "Video" : "Image"}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-hidden rounded-panel bg-imagine-surface-raised">
              {asset.src === undefined ? (
                <div className="flex aspect-video items-center justify-center text-imagine-foreground-faint">
                  <Icon name={asset.kind} size="xl" />
                </div>
              ) : (
                // Mock media comes from arbitrary hosts.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.src}
                  alt={asset.caption ?? ""}
                  className="max-h-[60vh] w-full object-contain"
                />
              )}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  askRemove({
                    id: asset.id,
                    kind: asset.kind,
                    name: asset.caption ?? "Untitled image",
                  });
                }}
              >
                <Icon name="trash" size="s" data-icon="inline-start" />
                Delete
              </Button>
              <Button
                onClick={() => {
                  closePreview();
                  send({ kind: "asset", asset });
                }}
              >
                <Icon name="imagine" size="s" data-icon="inline-start" />
                Send to agent
              </Button>
            </DialogFooter>
          </>
        )}
        <DialogCloseButton />
      </DialogContent>
    </Dialog>
  );
}
