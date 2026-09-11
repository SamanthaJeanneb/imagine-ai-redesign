"use client";

import { useState } from "react";

import { LinkedInPost } from "@/components/features/agent/linkedin-post-draft";
import {
  type PostChipData,
  type PostChipStatus,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface PostEditorValue {
  post: PostChipData;
  date: string;
  internalNotes: string;
}

interface PostEditorDialogProps {
  value: PostEditorValue;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: PostEditorValue) => void;
  onOpenAgent: (value: PostEditorValue) => void;
  onDelete?: (postId: string) => void;
}

const STATUS_LABEL: Record<PostChipStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Ready",
  published: "Published",
  failed: "Failed",
};

const EDITABLE_STATUSES: readonly {
  status: PostChipStatus;
  label: string;
}[] = [
  { status: "draft", label: "Draft" },
  { status: "in_review", label: "Review" },
  { status: "scheduled", label: "Ready" },
];

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function titleFromBody(body: string): string {
  const firstLine = body.split("\n", 1)[0] ?? "";
  return firstLine === "" ? "Untitled post" : firstLine;
}

/**
 * The focused calendar editor. It keeps the post and its publishing controls
 * in one modal, while the attached chip remains visible in the chat behind it.
 */
export function PostEditorDialog({
  value,
  open,
  onOpenChange,
  onSave,
  onOpenAgent,
  onDelete,
}: PostEditorDialogProps) {
  const [draft, setDraft] = useState(value);
  const preview = draft.post.preview;
  const author = preview?.author;
  const body = preview?.body ?? draft.post.title;
  const currentStatus = STATUS_LABEL[draft.post.status];

  function updatePost(patch: Partial<PostChipData>) {
    setDraft((current) => ({
      ...current,
      post: { ...current.post, ...patch },
    }));
  }

  function save() {
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="z-[60]"
        className="z-[70] flex max-h-[min(46rem,calc(100dvh-2rem))] w-[min(64rem,calc(100vw-2rem))] max-w-none flex-col gap-0 overflow-hidden rounded-panel bg-imagine-surface p-0 sm:max-w-none"
      >
        <DialogHeader className="flex-row items-center gap-s border-b border-imagine-border px-l py-m">
          <DialogTitle className="type-body font-semibold">
            Edit post
          </DialogTitle>
          <span
            style={postChipStyle(draft.post.status)}
            className="rounded-control bg-[color-mix(in_srgb,var(--chip-color)_18%,transparent)] px-s py-xxs type-caption text-imagine-foreground-muted"
          >
            {currentStatus}
          </span>
          <DialogDescription className="sr-only">
            Edit the post content, schedule, status, and internal notes.
          </DialogDescription>
          <div className="ml-auto flex items-center gap-xs">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenAgent(draft);
              }}
            >
              <Icon name="imagine" size="s" />
              Open in agent
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close editor"
              onClick={() => {
                onOpenChange(false);
              }}
            >
              <Icon name="xmark" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.95fr)] md:overflow-hidden">
          <div className="min-w-0 overflow-y-auto border-b border-imagine-border p-l md:border-r md:border-b-0">
            {author === undefined ? (
              <label className="mb-l flex items-center gap-s">
                <Avatar className="size-10">
                  <AvatarFallback>
                    {initials(draft.post.profile)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block type-small font-semibold">
                    {draft.post.profile}
                  </span>
                  <span className="block type-caption text-imagine-foreground-muted">
                    LinkedIn
                  </span>
                </span>
              </label>
            ) : null}

            {preview === undefined ? (
              <Textarea
                aria-label="Post body"
                value={body}
                onChange={(event) => {
                  const nextBody = event.target.value;
                  updatePost({
                    title: titleFromBody(nextBody),
                  });
                }}
                className="min-h-64 resize-none type-body"
              />
            ) : (
              <LinkedInPost
                {...preview}
                body={body}
                timestamp={draft.post.time}
                editing
                onBodyChange={(nextBody) => {
                  updatePost({
                    title: titleFromBody(nextBody),
                    preview: {
                      ...preview,
                      body: nextBody,
                    },
                  });
                }}
                className="shadow-none ring-1 ring-imagine-border"
              />
            )}

            <div className="mt-l flex items-center gap-s border-t border-imagine-border pt-m">
              {author === undefined ? (
                <Avatar className="size-7">
                  <AvatarFallback>
                    {initials(draft.post.profile)}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Avatar
                  shape={author.kind === "company" ? "square" : "circle"}
                  className="size-7"
                >
                  {author.avatarUrl === undefined ? null : (
                    <AvatarImage src={author.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>{initials(author.name)}</AvatarFallback>
                </Avatar>
              )}
              <Input
                aria-label="First comment"
                placeholder="Add a first comment"
                className="border-0 bg-transparent shadow-none"
              />
              <span className="shrink-0 type-caption text-imagine-foreground-muted tabular-nums">
                {body.length.toLocaleString()} characters
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-l overflow-y-auto bg-imagine-surface-raised/35 p-l">
            <fieldset className="flex flex-col gap-xs">
              <legend className="mb-xs type-small text-imagine-foreground-muted">
                Schedule
              </legend>
              <Input
                type="date"
                value={draft.date}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    date: event.target.value,
                  }));
                }}
              />
              <Input
                type="time"
                value={draft.post.time.padStart(5, "0")}
                onChange={(event) => {
                  updatePost({ time: event.target.value });
                }}
              />
            </fieldset>

            <fieldset className="flex flex-col gap-xs">
              <legend className="mb-xs type-small text-imagine-foreground-muted">
                Status
              </legend>
              <div className="grid grid-cols-3 gap-xs">
                {EDITABLE_STATUSES.map((item) => (
                  <Button
                    key={item.status}
                    type="button"
                    variant={
                      draft.post.status === item.status ? "soft" : "outline"
                    }
                    aria-pressed={draft.post.status === item.status}
                    onClick={() => {
                      updatePost({ status: item.status });
                    }}
                    className="min-w-0"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
              <Input
                aria-label="Post label"
                placeholder="Add label"
                value={draft.post.label ?? ""}
                onChange={(event) => {
                  const label = event.target.value;
                  updatePost(label === "" ? { label: undefined } : { label });
                }}
              />
            </fieldset>

            <label className="flex flex-col gap-xs">
              <span className="type-small text-imagine-foreground-muted">
                Internal notes
              </span>
              <Textarea
                value={draft.internalNotes}
                onChange={(event) => {
                  setDraft((current) => ({
                    ...current,
                    internalNotes: event.target.value,
                  }));
                }}
                placeholder="Add a note for your team"
                className="min-h-32 resize-none"
              />
            </label>
          </div>
        </div>

        <footer className="flex items-center gap-xs border-t border-imagine-border px-l py-m">
          {onDelete === undefined ? null : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onDelete(draft.post.id);
                onOpenChange(false);
              }}
              className="text-destructive hover:text-destructive"
            >
              Delete post
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onSave({
                ...draft,
                post: { ...draft.post, status: "published" },
              });
              onOpenChange(false);
            }}
            className="ml-auto"
          >
            Publish now
          </Button>
          <Button type="button" onClick={save}>
            Save
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
