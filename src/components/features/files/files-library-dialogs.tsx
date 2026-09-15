"use client";

import { useState } from "react";

import { useFilesLibrary } from "@/components/features/files/files-library-provider";
import type { BrowserItem } from "@/components/features/files/files-library-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

function deleteCopy(item: BrowserItem): {
  title: string;
  description: string;
} {
  const title = `Delete “${item.name}”?`;
  switch (item.kind) {
    case "folder":
      return {
        title,
        description: "Everything in this folder will be deleted too.",
      };
    case "document":
      return {
        title,
        description: "The agent won't be able to use this document.",
      };
    case "video":
      return {
        title,
        description: "This video will be removed from the library.",
      };
    default:
      return {
        title,
        description: "This image will be removed from the library.",
      };
  }
}

/** Confirm before a file, folder, or image is removed from the library. */
export function DeleteConfirmDialog({
  item,
  onConfirm,
  onClose,
}: {
  item: BrowserItem;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const copy = deleteCopy(item);

  return (
    <AlertDialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** The shared frame for naming something: one field, Enter submits. */
function NameDialog({
  title,
  description,
  initialValue,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  description: string;
  initialValue: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const trimmed = value.trim();

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <form
          className="flex flex-col gap-l"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed === "") return;
            onSubmit(trimmed);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="files-name">Name</FieldLabel>
            <Input
              id="files-name"
              autoFocus
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
              }}
              onFocus={(event) => {
                event.target.select();
              }}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={trimmed === ""}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseButton />
      </DialogContent>
    </Dialog>
  );
}

/** A folder in the browsed location, named before it is made. */
export function NewFolderDialog({
  locationTitle,
  onSubmit,
  onClose,
}: {
  locationTitle: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <NameDialog
      title="New folder"
      description={`Goes into ${locationTitle}.`}
      initialValue="New folder"
      submitLabel="Create"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}

/** Renaming a folder, a document, or an image. Opens on its current name. */
export function RenameDialog({
  name,
  onSubmit,
  onClose,
}: {
  name: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  return (
    <NameDialog
      title="Rename"
      description="The agent finds files by name, so keep it descriptive."
      initialValue={name}
      submitLabel="Rename"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}

/** Naming and confirming, for whichever change the library is waiting on. */
export function FilesLibraryDialogs() {
  const library = useFilesLibrary();
  const { dialog, pendingDelete } = library;

  return (
    <>
      {pendingDelete === null ? null : (
        <DeleteConfirmDialog
          item={pendingDelete}
          onConfirm={library.confirmRemove}
          onClose={library.cancelRemove}
        />
      )}

      {dialog === null ? null : dialog.kind === "rename" ? (
        <RenameDialog
          key={dialog.id}
          name={dialog.name}
          onSubmit={(name) => {
            library.rename(dialog.id, name);
          }}
          onClose={library.closeDialog}
        />
      ) : (
        <NewFolderDialog
          locationTitle={library.locationTitle}
          onSubmit={library.createFolder}
          onClose={library.closeDialog}
        />
      )}
    </>
  );
}
