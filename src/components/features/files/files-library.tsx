"use client";

import { cn } from "cn";

import type { FileSection } from "@/components/features/files/file-tree";
import { FilesLibraryBrowser } from "@/components/features/files/files-library-browser";
import { FilesLibraryDialogs } from "@/components/features/files/files-library-dialogs";
import {
  FilesLibraryEditor,
  FilesLibraryPreview,
} from "@/components/features/files/files-library-editor";
import { FilesLibraryNav } from "@/components/features/files/files-library-nav";
import { FilesLibraryProvider } from "@/components/features/files/files-library-provider";
import {
  FilesBrowseProvider,
  FilesEditorProvider,
  FilesLibraryBrowserArea,
} from "@/components/features/files/files-library-state";
import type { DraggableResource } from "@/components/features/files/resource-drag";
import type { Skill } from "@/components/features/files/skills-list";
import type { OpenDocument } from "@/services/files";

interface FilesLibraryProps {
  /** Workspace name, the organization library's title. */
  title: string;
  sections: readonly FileSection[];
  skills: readonly Skill[];
  documents: readonly OpenDocument[];
  /** Attach the resource to the chat and go there. Omit to hide the action. */
  onSendToChat?: (resource: DraggableResource) => void;
  className?: string;
}

/**
 * The Files workspace at `/files`. A full-height sidebar on the left holds
 * the tree and the way to add things; the browser on the right shows one
 * location as folders, documents, and images, with a breadcrumb that always
 * says where you are and lets you switch libraries or folders in place.
 * Documents open in an editor sheet over the browser — from the bottom on
 * a phone, from the right on a wider frame, framed like a page of its own;
 * the tree stays live to switch files.
 * Images open in a preview. Deleting asks first, then an undo on the toast.
 */
export function FilesLibrary({
  title,
  sections,
  skills,
  documents,
  onSendToChat,
  className,
}: FilesLibraryProps) {
  return (
    <FilesEditorProvider>
      <FilesBrowseProvider sections={sections}>
        <FilesLibraryProvider
          title={title}
          sections={sections}
          skills={skills}
          documents={documents}
          {...(onSendToChat === undefined ? {} : { onSendToChat })}
        >
          <div
            data-slot="files-library"
            className={cn(
              "@container relative flex min-h-0 min-w-0 flex-1",
              className,
            )}
          >
            {/* The breadcrumb says where you are, so the page's own name is
                only needed by a screen reader. */}
            <h1 className="sr-only">{title}</h1>
            <FilesLibraryNav />
            <FilesLibraryBrowserArea>
              <FilesLibraryBrowser />
              <FilesLibraryEditor />
            </FilesLibraryBrowserArea>
            <FilesLibraryDialogs />
            <FilesLibraryPreview />
          </div>
        </FilesLibraryProvider>
      </FilesBrowseProvider>
    </FilesEditorProvider>
  );
}
