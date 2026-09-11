"use client";

import { useState } from "react";

import { LinkedInPostEditor } from "@/components/features/calendar/linkedin-post-detail";
import {
  type PostChipData,
  type PostChipStatus,
  postChipStyle,
} from "@/components/features/calendar/post-chip";
import type { AssetTileData } from "@/components/features/files/asset-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface PostEditorValue {
  post: PostChipData;
  date: string;
  internalNotes: string;
}

interface PostEditorProps {
  value: PostEditorValue;
  onSave: (value: PostEditorValue) => void;
  onOpenAgent: (value: PostEditorValue) => void;
  /** The editor asking for its tab to go away, after a delete. */
  onClose: () => void;
  onDelete?: (postId: string) => void;
  /** Assets the editor can attach to the post. */
  mediaLibrary?: readonly AssetTileData[];
  /** The labels this workspace files posts under. */
  labelOptions?: readonly string[];
}

/** Radix selects cannot hold an empty value, so "none" needs a name. */
const NO_LABEL = "__none__";

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
 * A post's own tab: the post as it reads on LinkedIn, editable, with the
 * publishing controls beside it. The attached chip stays in the chat, so the
 * agent can be asked about whatever is on screen.
 */
export function PostEditor({
  value,
  onSave,
  onOpenAgent,
  onClose,
  onDelete,
  mediaLibrary,
  labelOptions = [],
}: PostEditorProps) {
  const [draft, setDraft] = useState(value);
  const preview = draft.post.preview;
  const author = preview?.author;
  const body = preview?.body ?? draft.post.title;
  // A post can carry a label the workspace has since renamed; keep it listed.
  const label = draft.post.label;
  const labels =
    label === undefined || labelOptions.includes(label)
      ? labelOptions
      : [...labelOptions, label];

  function updatePost(patch: Partial<PostChipData>) {
    setDraft((current) => ({
      ...current,
      post: { ...current.post, ...patch },
    }));
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-imagine-surface">
      <div className="mx-auto flex w-full max-w-6xl shrink-0 flex-row items-center gap-s px-l py-m">
        <h2 className="type-body font-semibold">Edit post</h2>
        <span
          style={postChipStyle(draft.post.status)}
          className="rounded-control bg-[color-mix(in_srgb,var(--chip-color)_18%,transparent)] px-s py-xxs type-caption text-imagine-foreground-muted"
        >
          {STATUS_LABEL[draft.post.status]}
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenAgent(draft);
          }}
          className="ml-auto"
        >
          <Icon name="imagine" size="s" />
          Open in agent
        </Button>
      </div>

      <div className="mx-auto grid min-h-0 w-full max-w-6xl flex-1 gap-l overflow-y-auto px-l pb-l md:grid-cols-[minmax(0,1fr)_20rem] md:overflow-hidden">
        <div className="min-w-0 overflow-y-auto py-l">
          {preview === undefined ? (
            <Textarea
              aria-label="Post body"
              value={body}
              onChange={(event) => {
                updatePost({ title: titleFromBody(event.target.value) });
              }}
              className="min-h-64 resize-none type-body"
            />
          ) : (
            <LinkedInPostEditor
              post={draft.post}
              body={body}
              mediaLibrary={mediaLibrary}
              onBodyChange={(nextBody) => {
                updatePost({
                  title: titleFromBody(nextBody),
                  preview: { ...preview, body: nextBody },
                });
              }}
              onMediaChange={(media) => {
                const { media: _dropped, ...rest } = preview;
                updatePost({
                  preview: media.length === 0 ? rest : { ...rest, media },
                });
              }}
            />
          )}

          <div className="mt-l flex items-center gap-s pt-m">
            {draft.post.engagement === undefined ? (
              <>
                <Avatar
                  shape={author?.kind === "company" ? "square" : "circle"}
                  className="size-7"
                >
                  {author?.avatarUrl === undefined ? null : (
                    <AvatarImage src={author.avatarUrl} alt="" />
                  )}
                  <AvatarFallback>
                    {initials(author?.name ?? draft.post.profile)}
                  </AvatarFallback>
                </Avatar>
                <Input
                  aria-label="First comment"
                  placeholder="Add a first comment"
                  className="border-0 bg-transparent shadow-none"
                />
              </>
            ) : null}
            <span className="ml-auto shrink-0 type-caption text-imagine-foreground-muted tabular-nums">
              {body.length.toLocaleString()} characters
            </span>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-l overflow-y-auto rounded-panel bg-imagine-surface-raised/35 p-l">
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
            <Select
              value={draft.post.label ?? NO_LABEL}
              onValueChange={(next) => {
                updatePost(
                  next === NO_LABEL ? { label: undefined } : { label: next },
                );
              }}
            >
              <SelectTrigger aria-label="Post label" className="w-full">
                <SelectValue placeholder="Add label" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_LABEL}>No label</SelectItem>
                {labels.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      <footer className="mx-auto flex w-full max-w-6xl shrink-0 items-center gap-xs px-l py-m">
        {onDelete === undefined ? null : (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              onDelete(draft.post.id);
              onClose();
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
            onSave({ ...draft, post: { ...draft.post, status: "published" } });
          }}
          className="ml-auto"
        >
          Publish now
        </Button>
        <Button
          type="button"
          onClick={() => {
            onSave(draft);
          }}
        >
          Save
        </Button>
      </footer>
    </div>
  );
}
